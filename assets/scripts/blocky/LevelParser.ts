import {
  ArrowDirection, Difficulty, GameColor, MechanicType, ShapeType, ShapeWoodenBox, TypeEnvironment,
} from './Enums';
import {
  ColorPathData, GrinderData, LevelConfig, PictureData, PortalData, RotatorData,
  RollerDoorData, ShapePictureData, TunnelData, Vec2I, WallIceData, WoodenBoxData,
} from './LevelTypes';

/** 碎图底图默认资源（game/sprite/icon_bg/di_2_2） */
export const DEFAULT_ICON_BG = 'di_2_2';

/** 解析 Unity 恢复的 Lv_XXXX.txt（12 段 ^ 分隔） */
export class LevelParser {
  static parse(text: string): LevelConfig {
    if (!text || !text.trim()) throw new Error('Level text is empty');
    const sections = text.split('^');
    const level = emptyLevel();
    parseHeader(sections[0], level);
    if (sections.length > 1) level.listPictureData = parsePictures(sections[1]);
    if (sections.length > 2) level.listShapePictureData = parseShapes(sections[2]);
    if (sections.length > 3) level.listPortalData = parsePortals(sections[3]);
    if (sections.length > 4) level.listWoodenBoxData = parseWoodenBoxes(sections[4]);
    if (sections.length > 5) level.listGrinderData = parseGrinders(sections[5]);
    if (sections.length > 6) level.listTunnelData = parseTunnels(sections[6]);
    if (sections.length > 7) level.listColorPathData = parseColorPaths(sections[7]);
    const meta = sections.length > 8 ? sections[8].trim() : '';
    if (sections.length > 9) level.listRollerDoorData = parseRollerDoors(sections[9]);
    if (sections.length > 10) level.listWallIceData = parseWallIce(sections[10]);
    if (sections.length > 11) level.listRotatorData = parseRotators(sections[11]);
    level.levelId = meta ? meta.split('_')[0] : level.id.toString().padStart(4, '0');
    return level;
  }
}

function emptyLevel(): LevelConfig {
  return {
    id: 0,
    levelId: '0000',
    difficulty: Difficulty.Easy,
    timeLimit: 180,
    board: [],
    listPictureData: [],
    listShapePictureData: [],
    listPortalData: [],
    listWoodenBoxData: [],
    listGrinderData: [],
    listTunnelData: [],
    listColorPathData: [],
    listRollerDoorData: [],
    listWallIceData: [],
    listRotatorData: [],
  };
}

function parseHeader(header: string, level: LevelConfig) {
  const hash = header.split('#');
  if (hash.length < 4) throw new Error('Invalid level header');
  level.id = toInt(hash[0]);
  level.timeLimit = toInt(hash[1]);
  level.difficulty = toInt(hash[2]) as Difficulty;
  // Unity 板数据按列存储：`;` 分隔 X，`:` 分隔该列的 Y；转成 board[y][x]
  const cols = hash[3].split(';').filter((r) => r.length > 0);
  const colData = cols.map((col) =>
    col.split(':').filter((c) => c.length > 0).map((c) => toInt(c) as TypeEnvironment),
  );
  const width = colData.length;
  const height = colData.reduce((m, c) => Math.max(m, c.length), 0);
  level.board = [];
  for (let y = 0; y < height; y++) {
    const row: TypeEnvironment[] = [];
    for (let x = 0; x < width; x++) {
      row.push(colData[x][y] ?? TypeEnvironment.Block);
    }
    level.board.push(row);
  }
}

function parsePictures(section: string): PictureData[] {
  const list: PictureData[] = [];
  for (const item of splitEntries(section)) {
    const p = item.split(':');
    if (p.length < 8) continue;
    list.push({
      id: toInt(p[0]),
      width: toInt(p[1]),
      height: toInt(p[2]),
      nameFilePicture: p[3],
      color: toInt(p[4]) as GameColor,
      isPencil: toInt(p[5]) !== 0,
      isFlipX: toInt(p[6]) !== 0,
      isFlipY: toInt(p[7]) !== 0,
      nameIconBg: parseIconBgField(p.length >= 9 ? p[8] : ''),
    });
  }
  return list;
}

/** pictures 段 p[8]：`iconBg=di_2_2`（推荐）或裸文件名；空则默认 */
export function parseIconBgField(raw: string): string {
  const s = (raw || '').trim();
  if (!s) return DEFAULT_ICON_BG;
  if (s.startsWith('iconBg=')) {
    const v = s.slice('iconBg='.length).trim();
    return v || DEFAULT_ICON_BG;
  }
  return s;
}

/** 写出可读背景字段 */
export function formatIconBgField(fileName: string): string {
  const v = (fileName || '').trim() || DEFAULT_ICON_BG;
  return `iconBg=${v}`;
}

function parseShapes(section: string): ShapePictureData[] {
  const entries: string[] = [];
  for (const item of splitEntries(section)) {
    const p = item.split(':');
    if (p.length < 19) continue;
    entries.push(item);
  }

  const list: ShapePictureData[] = [];
  const seenEntry = new Set<string>();
  const usedId = new Set<number>();
  let maxId = 0;
  for (const item of entries) {
    maxId = Math.max(maxId, toInt(item.split(':')[0]));
  }

  for (const item of entries) {
    if (seenEntry.has(item)) continue;
    seenEntry.add(item);

    const p = item.split(':');
    let id = toInt(p[0]);
    if (usedId.has(id)) {
      maxId += 1;
      id = maxId;
    }
    usedId.add(id);

    list.push({
      id,
      rotation: toFloat(p[1]),
      posRelative: parseVec2List(p[2]),
      listPos: parseVec2List(p[3]),
      listIndexPicture: parseIntList(p[4]),
      shapeType: toInt(p[5]) as ShapeType,
      idPanelPicture: toInt(p[6]),
      color: toInt(p[7]) as GameColor,
      mechanic: toInt(p[8]),
      arrowDirection: toInt(p[9]) as ArrowDirection,
      isObstacle: toInt(p[10]) !== 0,
      numberIce: toInt(p[11]),
      numberLock: toInt(p[12]),
      listPosKey: parseVec2List(p[13]),
      idCombineds: parseIntList(p[14]),
      idLayered: toInt(p[15]),
      timeBomb: toInt(p[16]),
      colorBlock: toInt(p[17]) as GameColor,
      numberMystery: toInt(p[18]),
    });
  }
  return list;
}

function parsePortals(section: string): PortalData[] {
  const list: PortalData[] = [];
  for (const item of splitEntries(section)) {
    const p = item.split(':');
    if (p.length < 5) continue;
    list.push({
      rot: toInt(p[0]),
      size: toInt(p[1]),
      pos: parseVec2(p[2]),
      dir: parseVec2(p[3]),
      color: toInt(p[4]) as GameColor,
    });
  }
  return list;
}

function parseWoodenBoxes(section: string): WoodenBoxData[] {
  const list: WoodenBoxData[] = [];
  for (const item of splitEntries(section)) {
    const p = item.split(':');
    if (p.length < 5) continue;
    list.push({
      numberBox: toInt(p[0]),
      pos: parseVec2(p[1]),
      shapeWoodenBox: toInt(p[2]) as ShapeWoodenBox,
      canMoveVertical: toInt(p[3]) !== 0,
      canMoveHorizontal: toInt(p[4]) !== 0,
    });
  }
  return list;
}

function parseGrinders(section: string): GrinderData[] {
  const list: GrinderData[] = [];
  for (const item of splitEntries(section)) {
    const p = item.split(':');
    if (p.length < 5) continue;
    list.push({
      pos: parseVec2(p[0]),
      up: toInt(p[1]),
      down: toInt(p[2]),
      left: toInt(p[3]),
      right: toInt(p[4]),
    });
  }
  return list;
}

function parseTunnels(section: string): TunnelData[] {
  const list: TunnelData[] = [];
  for (const item of splitEntries(section)) {
    const p = item.split(':');
    if (p.length < 4) continue;
    list.push({
      pos: parseVec2(p[0]),
      rot: toInt(p[1]),
      dir: parseVec2(p[2]),
      listIdBlock: parseIntList(p[3]),
    });
  }
  return list;
}

function parseColorPaths(section: string): ColorPathData[] {
  const list: ColorPathData[] = [];
  for (const item of splitEntries(section)) {
    const p = item.split(':');
    if (p.length < 2) continue;
    list.push({ pos: parseVec2(p[0]), color: toInt(p[1]) as GameColor });
  }
  return list;
}

function parseRollerDoors(section: string): RollerDoorData[] {
  const list: RollerDoorData[] = [];
  for (const item of splitEntries(section)) {
    const p = item.split(':');
    if (p.length < 3) continue;
    list.push({ number: toInt(p[0]), pos: parseVec2(p[1]), size: parseVec2(p[2]) });
  }
  return list;
}

function parseWallIce(section: string): WallIceData[] {
  const list: WallIceData[] = [];
  for (const item of splitEntries(section)) {
    const p = item.split(':');
    if (p.length < 2) continue;
    list.push({ pos: parseVec2(p[0]), num: toInt(p[1]) });
  }
  return list;
}

function parseRotators(section: string): RotatorData[] {
  const list: RotatorData[] = [];
  for (const item of splitEntries(section)) {
    const p = item.split(':');
    if (p.length < 5) continue;
    list.push({
      pos: parseVec2(p[0]),
      up: toInt(p[1]),
      down: toInt(p[2]),
      left: toInt(p[3]),
      right: toInt(p[4]),
    });
  }
  return list;
}

function* splitEntries(section: string): Generator<string> {
  if (!section || !section.trim()) return;
  for (const part of section.split(';')) {
    const t = part.trim();
    if (t.length > 0) yield t;
  }
}

function toInt(s: string): number {
  const v = parseInt(s, 10);
  return Number.isFinite(v) ? v : 0;
}

function toFloat(s: string): number {
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : 0;
}

function parseVec2(s: string): Vec2I {
  if (!s) return { x: 0, y: 0 };
  const parts = s.split('_');
  if (parts.length < 2) return { x: 0, y: 0 };
  return { x: toInt(parts[0]), y: toInt(parts[1]) };
}

function parseVec2List(s: string): Vec2I[] {
  if (!s) return [];
  return s.split('|').filter((t) => t.length > 0).map(parseVec2);
}

function parseIntList(s: string): number[] {
  if (!s) return [];
  return s.split('|').filter((t) => t.length > 0).map(toInt);
}

/** Unity 路径 → Cocos game bundle icon 相对路径（无扩展名） */
export function pictureResourcePath(nameFilePicture: string): string {
  // AssetPicture\Dong vat\3x3\meo → icon/meo
  const p = nameFilePicture.replace(/\\/g, '/');
  const base = p.split('/').pop() || p;
  return `sprite/icon/${base}`;
}

/** game/sprite/icon_bg 碎片底图路径（无扩展名） */
export function iconBgResourcePath(fileName: string): string {
  return `sprite/icon_bg/${fileName}`;
}
