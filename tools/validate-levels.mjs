/**
 * 批量校验 Block Reveal 关卡（与 LevelParser 列优先 board 一致）
 * 用法: node tools/validate-levels.mjs [from] [to]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LEVEL_DIR = path.join(ROOT, 'assets/bundle/game/levels_br');
const PIC_DIR = path.join(ROOT, 'assets/bundle/game/pictures');

const TypeEnvironment = { Block: 0, Ground: 1 };

function toInt(s) {
  const v = parseInt(s, 10);
  return Number.isFinite(v) ? v : 0;
}

function parseVec2(s) {
  if (!s) return { x: 0, y: 0 };
  const parts = s.split('_');
  if (parts.length < 2) return { x: 0, y: 0 };
  return { x: toInt(parts[0]), y: toInt(parts[1]) };
}

function parseVec2List(s) {
  if (!s) return [];
  return s.split('|').filter((t) => t.length > 0).map(parseVec2);
}

function parseIntList(s) {
  if (!s) return [];
  return s.split('|').filter((t) => t.length > 0).map(toInt);
}

function splitEntries(section) {
  if (!section || !section.trim()) return [];
  return section.split(';').map((p) => p.trim()).filter((t) => t.length > 0);
}

function parseHeader(header) {
  const hash = header.split('#');
  if (hash.length < 4) throw new Error('Invalid level header');
  const cols = hash[3].split(';').filter((r) => r.length > 0);
  const colData = cols.map((col) =>
    col.split(':').filter((c) => c.length > 0).map((c) => toInt(c)),
  );
  const width = colData.length;
  const height = colData.reduce((m, c) => Math.max(m, c.length), 0);
  const board = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) row.push(colData[x][y] ?? TypeEnvironment.Block);
    board.push(row);
  }
  return {
    id: toInt(hash[0]),
    timeLimit: toInt(hash[1]),
    difficulty: toInt(hash[2]),
    board,
  };
}

function parsePictures(section) {
  const list = [];
  for (const item of splitEntries(section)) {
    const p = item.split(':');
    if (p.length < 8) continue;
    list.push({
      id: toInt(p[0]),
      width: toInt(p[1]),
      height: toInt(p[2]),
      nameFilePicture: p[3],
    });
  }
  return list;
}

function parseShapes(section) {
  const list = [];
  for (const item of splitEntries(section)) {
    const p = item.split(':');
    if (p.length < 19) continue;
    list.push({
      id: toInt(p[0]),
      listPos: parseVec2List(p[3]),
      listIndexPicture: parseIntList(p[4]),
      idPanelPicture: toInt(p[6]),
      idCombineds: parseIntList(p[14]),
      idLayered: toInt(p[15]),
    });
  }
  return list;
}

function parseLevel(text) {
  const sections = text.split('^');
  const header = parseHeader(sections[0]);
  return {
    ...header,
    listPictureData: sections.length > 1 ? parsePictures(sections[1]) : [],
    listShapePictureData: sections.length > 2 ? parseShapes(sections[2]) : [],
    listPortalData: sections.length > 3 ? splitEntries(sections[3]) : [],
    listTunnelData: sections.length > 6 ? splitEntries(sections[6]) : [],
  };
}

function pictureResourcePath(nameFilePicture) {
  let p = nameFilePicture.replace(/\\/g, '/');
  if (p.startsWith('AssetPicture/')) p = p.slice('AssetPicture/'.length);
  if (p.startsWith('AssetPicture')) p = p.slice('AssetPicture'.length).replace(/^\//, '');
  return path.join(PIC_DIR, p);
}

function isGround(board, x, y) {
  if (y < 0 || y >= board.length) return false;
  const row = board[y];
  if (x < 0 || x >= row.length) return false;
  return row[x] === TypeEnvironment.Ground;
}

function collectGround(board) {
  const out = [];
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      if (board[y][x] === TypeEnvironment.Ground) out.push({ x, y });
    }
  }
  return out;
}

function groundBBox(ground) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const c of ground) {
    minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x);
    minY = Math.min(minY, c.y); maxY = Math.max(maxY, c.y);
  }
  return { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function picExists(nameFilePicture) {
  const base = pictureResourcePath(nameFilePicture);
  const exts = ['.png', '.jpg', '.jpeg', '.webp'];
  return exts.some((e) => fs.existsSync(base + e));
}

function validateLevel(idx, lvl) {
  const issues = [];
  const ground = collectGround(lvl.board);
  if (!ground.length) issues.push('no ground cells');

  const shapeIds = new Set(lvl.listShapePictureData.map((s) => s.id));
  const picIds = new Set(lvl.listPictureData.map((p) => p.id));
  const picById = new Map(lvl.listPictureData.map((p) => [p.id, p]));

  for (const pic of lvl.listPictureData) {
    if (!picExists(pic.nameFilePicture)) {
      issues.push(`missing picture asset: ${pic.nameFilePicture}`);
    }
  }

  const occupied = new Map();
  for (const s of lvl.listShapePictureData) {
    if (s.listPos.length === 0) issues.push(`shape ${s.id} has no cells`);
    if (s.idPanelPicture >= 0 && !picById.has(s.idPanelPicture)) {
      issues.push(`shape ${s.id} references missing picture panel ${s.idPanelPicture}`);
    }
    const pic = picById.get(s.idPanelPicture);
    for (let i = 0; i < s.listPos.length; i++) {
      const { x, y } = s.listPos[i];
      if (!isGround(lvl.board, x, y)) {
        issues.push(`shape ${s.id} cell (${x},${y}) outside ground`);
      }
      const key = `${x},${y}`;
      if (occupied.has(key)) {
        issues.push(`overlap at (${x},${y}): shapes ${occupied.get(key)} & ${s.id}`);
      } else {
        occupied.set(key, s.id);
      }
      const idxPic = s.listIndexPicture[i];
      if (pic && idxPic >= 0 && idxPic >= pic.width * pic.height) {
        issues.push(`shape ${s.id} pic index ${idxPic} out of range for ${pic.width}x${pic.height}`);
      }
    }
    for (const cid of s.idCombineds) {
      if (cid >= 0 && !shapeIds.has(cid)) issues.push(`shape ${s.id} combined ref ${cid} missing`);
    }
    if (s.idLayered >= 0 && !shapeIds.has(s.idLayered)) {
      issues.push(`shape ${s.id} layered ref ${s.idLayered} missing`);
    }
  }

  for (const entry of lvl.listTunnelData) {
    const p = entry.split(':');
    if (p.length < 4) continue;
    for (const id of parseIntList(p[3])) {
      if (!shapeIds.has(id)) issues.push(`tunnel references missing shape ${id}`);
    }
  }

  const bb = groundBBox(ground);
  return { issues, groundCount: ground.length, bbox: bb };
}

const from = parseInt(process.argv[2] || '1', 10);
const to = parseInt(process.argv[3] || '100', 10);
const allIssues = [];

for (let i = from; i <= to; i++) {
  const file = path.join(LEVEL_DIR, `Lv_${String(i).padStart(4, '0')}.txt`);
  if (!fs.existsSync(file)) {
    allIssues.push({ level: i, issues: ['file missing'] });
    continue;
  }
  try {
    const text = fs.readFileSync(file, 'utf8');
    const lvl = parseLevel(text);
    const { issues, groundCount, bbox } = validateLevel(i, lvl);
    if (issues.length) allIssues.push({ level: i, issues, groundCount, bbox });
  } catch (e) {
    allIssues.push({ level: i, issues: [`parse error: ${e.message}`] });
  }
}

console.log(`Validated levels ${from}-${to}`);
console.log(`Levels with issues: ${allIssues.length}`);
for (const row of allIssues) {
  console.log(`\nLv ${row.level} (${row.groundCount ?? '?'} ground, bbox ${row.bbox?.w ?? '?'}x${row.bbox?.h ?? '?'})`);
  for (const iss of row.issues) console.log(`  - ${iss}`);
}
process.exit(allIssues.length ? 1 : 0);
