/**
 * 给 levels_br 的 pictures 段补上可读背景字段 iconBg=di_2_2
 * 用法: node tools/migrate-icon-bg.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEVEL_DIR = path.join(__dirname, '..', 'assets/bundle/game/levels_br');
const DEFAULT_BG = 'di_2_2';
const PREFIX = 'iconBg=';

function normalizeIconBg(raw) {
  const s = (raw || '').trim();
  if (!s) return `${PREFIX}${DEFAULT_BG}`;
  if (s.startsWith(PREFIX)) {
    const v = s.slice(PREFIX.length).trim() || DEFAULT_BG;
    return `${PREFIX}${v}`;
  }
  return `${PREFIX}${s}`;
}

function migratePicturesSection(section) {
  if (!section || !section.trim()) return section;
  const parts = section.split(';');
  let changed = false;
  const out = parts.map((item) => {
    const trimmed = item.trim();
    if (!trimmed) return item;
    const p = trimmed.split(':');
    if (p.length < 8) return item;
    if (p.length === 8) {
      changed = true;
      return `${trimmed}:${PREFIX}${DEFAULT_BG}`;
    }
    const next = normalizeIconBg(p[8]);
    if (next !== p[8]) {
      changed = true;
      p[8] = next;
      return p.join(':');
    }
    return item;
  });
  return { text: out.join(';'), changed };
}

function migrateFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const sections = text.split('^');
  if (sections.length < 2) return false;
  const { text: pics, changed } = migratePicturesSection(sections[1]);
  if (!changed) return false;
  sections[1] = pics;
  fs.writeFileSync(filePath, sections.join('^'), 'utf8');
  return true;
}

const files = fs.readdirSync(LEVEL_DIR).filter((f) => /^Lv_\d+\.txt$/i.test(f)).sort();
let updated = 0;
for (const f of files) {
  if (migrateFile(path.join(LEVEL_DIR, f))) updated += 1;
}
console.log(`done: ${updated}/${files.length} levels updated (iconBg=${DEFAULT_BG})`);
