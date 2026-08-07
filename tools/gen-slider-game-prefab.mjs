/**
 * 生成 assets/bundle/game/prefab/SliderGame.prefab（Cocos 3.8 格式）
 * 用法: node tools/gen-slider-game-prefab.mjs
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets/bundle/game/prefab');
const DESIGN_W = 750;
const DESIGN_H = 1334;
const UI_2D = 33554432;

const objects = [];
const usedFileIds = new Set();

function fid() {
  let id;
  do {
    id = crypto.randomBytes(8).toString('base64url').slice(0, 11);
  } while (usedFileIds.has(id));
  usedFileIds.add(id);
  return id;
}

function push(obj) {
  objects.push(obj);
  return objects.length - 1;
}

function vec3(x = 0, y = 0, z = 0) {
  return { __type__: 'cc.Vec3', x, y, z };
}
function quat(x = 0, y = 0, z = 0, w = 1) {
  return { __type__: 'cc.Quat', x, y, z, w };
}
function size(width, height) {
  return { __type__: 'cc.Size', width, height };
}
function vec2(x, y) {
  return { __type__: 'cc.Vec2', x, y };
}
function color(r, g, b, a = 255) {
  return { __type__: 'cc.Color', r, g, b, a };
}

function addCompPrefabInfo() {
  return push({ __type__: 'cc.CompPrefabInfo', fileId: fid() });
}

function addPrefabInfo(rootId, isRoot = false) {
  return push({
    __type__: 'cc.PrefabInfo',
    root: { __id__: rootId },
    asset: isRoot ? { __id__: 0 } : { __id__: 0 },
    fileId: fid(),
    instance: null,
    targetOverrides: null,
    nestedPrefabInstanceRoots: null,
  });
}

function addUITransform(nodeId, w, h) {
  const prefabId = addCompPrefabInfo();
  return push({
    __type__: 'cc.UITransform',
    _name: '',
    _objFlags: 0,
    __editorExtras__: {},
    node: { __id__: nodeId },
    _enabled: true,
    __prefab: { __id__: prefabId },
    _contentSize: size(w, h),
    _anchorPoint: vec2(0.5, 0.5),
    _id: '',
  });
}

function addWidget(nodeId) {
  const prefabId = addCompPrefabInfo();
  return push({
    __type__: 'cc.Widget',
    _name: '',
    _objFlags: 0,
    __editorExtras__: {},
    node: { __id__: nodeId },
    _enabled: true,
    __prefab: { __id__: prefabId },
    _alignFlags: 45,
    _target: null,
    _left: 0,
    _right: 0,
    _top: 0,
    _bottom: 0,
    _horizontalCenter: 0,
    _verticalCenter: 0,
    _isAbsLeft: true,
    _isAbsRight: true,
    _isAbsTop: true,
    _isAbsBottom: true,
    _isAbsHorizontalCenter: true,
    _isAbsVerticalCenter: true,
    _originalWidth: 0,
    _originalHeight: 0,
    _alignMode: 2,
    _lockFlags: 0,
    _id: '',
  });
}

function addLabel(nodeId, text, fontSize, hex = '#5b341a') {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const prefabId = addCompPrefabInfo();
  return push({
    __type__: 'cc.Label',
    _name: '',
    _objFlags: 0,
    __editorExtras__: {},
    node: { __id__: nodeId },
    _enabled: true,
    __prefab: { __id__: prefabId },
    _customMaterial: null,
    _srcBlendFactor: 2,
    _dstBlendFactor: 4,
    _color: color(r, g, b, 255),
    _string: text,
    _horizontalAlign: 1,
    _verticalAlign: 1,
    _actualFontSize: fontSize,
    _fontSize: fontSize,
    _fontFamily: 'Arial',
    _lineHeight: fontSize + 6,
    _overflow: 0,
    _enableWrapText: false,
    _font: null,
    _isSystemFontUsed: true,
    _spacingX: 0,
    _isItalic: false,
    _isBold: false,
    _isUnderline: false,
    _underlineHeight: 2,
    _cacheMode: 0,
    _enableOutline: false,
    _outlineColor: color(0, 0, 0, 255),
    _outlineWidth: 2,
    _enableShadow: false,
    _shadowColor: color(0, 0, 0, 255),
    _shadowOffset: vec2(2, 2),
    _shadowBlur: 2,
    _id: '',
  });
}

function addSprite(nodeId) {
  const prefabId = addCompPrefabInfo();
  return push({
    __type__: 'cc.Sprite',
    _name: '',
    _objFlags: 0,
    __editorExtras__: {},
    node: { __id__: nodeId },
    _enabled: true,
    __prefab: { __id__: prefabId },
    _customMaterial: null,
    _srcBlendFactor: 2,
    _dstBlendFactor: 4,
    _color: color(255, 255, 255, 255),
    _spriteFrame: null,
    _type: 0,
    _fillType: 0,
    _sizeMode: 2,
    _fillCenter: vec2(0, 0),
    _fillStart: 0,
    _fillRange: 0,
    _isTrimmedMode: true,
    _useGrayscale: false,
    _atlas: null,
    _id: '',
  });
}

function addBlockInput(nodeId) {
  const prefabId = addCompPrefabInfo();
  return push({
    __type__: 'cc.BlockInputEvents',
    _name: '',
    _objFlags: 0,
    __editorExtras__: {},
    node: { __id__: nodeId },
    _enabled: true,
    __prefab: { __id__: prefabId },
    _id: '',
  });
}

function addGraphics(nodeId) {
  const prefabId = addCompPrefabInfo();
  return push({
    __type__: 'cc.Graphics',
    _name: '',
    _objFlags: 0,
    __editorExtras__: {},
    node: { __id__: nodeId },
    _enabled: true,
    __prefab: { __id__: prefabId },
    _customMaterial: null,
    _srcBlendFactor: 2,
    _dstBlendFactor: 4,
    _color: color(255, 255, 255, 255),
    _lineWidth: 1,
    _strokeColor: color(0, 0, 0, 255),
    _lineJoin: 2,
    _lineCap: 0,
    _fillColor: color(255, 255, 255, 255),
    _miterLimit: 10,
    _id: '',
  });
}

/**
 * @returns {{ id: number, comps: number[] }}
 */
function addNode(name, parentId, opts = {}) {
  const {
    w = 100,
    h = 100,
    x = 0,
    y = 0,
    active = true,
    fullWidget = false,
    label = null,
    sprite = false,
    graphics = false,
    blockInput = false,
    isRoot = false,
  } = opts;

  const nodeId = push({
    __type__: 'cc.Node',
    _name: name,
    _objFlags: 0,
    __editorExtras__: {},
    _parent: parentId == null ? null : { __id__: parentId },
    _children: [],
    _active: active,
    _components: [],
    _prefab: null,
    _lpos: vec3(x, y, 0),
    _lrot: quat(),
    _lscale: vec3(1, 1, 1),
    _mobility: 0,
    _layer: UI_2D,
    _euler: vec3(),
    _id: '',
  });

  if (parentId != null) {
    objects[parentId]._children.push({ __id__: nodeId });
  }

  const comps = [];
  comps.push(addUITransform(nodeId, w, h));
  if (fullWidget) comps.push(addWidget(nodeId));
  if (sprite) comps.push(addSprite(nodeId));
  if (graphics) comps.push(addGraphics(nodeId));
  if (blockInput) comps.push(addBlockInput(nodeId));
  if (label) comps.push(addLabel(nodeId, label.text, label.size, label.color || '#5b341a'));

  const prefabInfoId = addPrefabInfo(isRoot ? nodeId : 1, isRoot);
  objects[nodeId]._components = comps.map((id) => ({ __id__: id }));
  objects[nodeId]._prefab = { __id__: prefabInfoId };
  return { id: nodeId, comps };
}

function addButton(parentId, name, w, h, x, y, text, fontSize = 28) {
  const btn = addNode(name, parentId, { w, h, x, y, graphics: true });
  addNode('txt', btn.id, {
    w: w - 20,
    h: Math.max(24, h - 10),
    label: { text, size: fontSize, color: '#5b341a' },
  });
  return btn;
}

function addTool(parentId, name, x) {
  const n = addNode(name, parentId, { w: 80, h: 80, x, y: 0, graphics: true });
  addNode('icon', n.id, { w: 58, h: 58, sprite: true });
  const badge = addNode('cnt', n.id, { w: 28, h: 28, x: 28, y: 28, graphics: true });
  addNode('txt', badge.id, { w: 28, h: 28, label: { text: '0', size: 16, color: '#ffffff' } });
  return n;
}

// ─── build ─────────────────────────────────────────────
const prefabId = push({
  __type__: 'cc.Prefab',
  _name: 'SliderGame',
  _objFlags: 0,
  __editorExtras__: {},
  _native: '',
  data: { __id__: 1 },
  optimizationPolicy: 0,
  persistent: false,
});

const root = addNode('SliderGame', null, {
  w: DESIGN_W,
  h: DESIGN_H,
  fullWidget: true,
  isRoot: true,
});
// ensure root is id 1
if (root.id !== 1) throw new Error(`root id expected 1, got ${root.id}`);

addNode('bg', root.id, { w: DESIGN_W, h: DESIGN_H, fullWidget: true, sprite: true });
addNode('Board', root.id, { w: DESIGN_W, h: DESIGN_H * 0.72, x: 0, y: 20 });

const hud = addNode('HUD', root.id, { w: DESIGN_W - 20, h: 160, x: 0, y: DESIGN_H / 2 - 100 });
addNode('level', hud.id, {
  w: 180, h: 44, x: -250, y: 40,
  label: { text: '第1关', size: 32, color: '#5b341a' },
});
const timer = addNode('timer', hud.id, { w: 170, h: 48, x: 0, y: 40, graphics: true });
addNode('t', timer.id, {
  w: 140, h: 40,
  label: { text: '03:00', size: 28, color: '#fff8e7' },
});
const prog = addNode('prog', hud.id, { w: 140, h: 44, x: 250, y: 40, graphics: true });
addNode('txt', prog.id, {
  w: 130, h: 36,
  label: { text: '图 0', size: 22, color: '#6b3f1a' },
});
addNode('goals', hud.id, { w: DESIGN_W - 60, h: 64, x: 0, y: -36, graphics: true });

const tools = addNode('tools', root.id, {
  w: DESIGN_W, h: 110, x: 0, y: -DESIGN_H / 2 + 100, active: false,
});
const gap = 95;
const start = -((4 - 1) * gap) / 2;
['freeze', 'magnet', 'slicer', 'teleport'].forEach((name, i) => {
  addTool(tools.id, name, start + i * gap);
});

const tip = addNode('tip', root.id, {
  w: 620, h: 40, x: 0, y: -DESIGN_H / 2 + 185, active: false, graphics: true,
});
addNode('txt', tip.id, {
  w: 600, h: 36,
  label: { text: '拖动方块，拼完整张图片即可揭示', size: 20, color: '#ffe9c4' },
});

const toast = addNode('toast', root.id, {
  w: 360, h: 56, active: false, graphics: true,
});
addNode('txt', toast.id, {
  w: 340, h: 48,
  label: { text: '', size: 24, color: '#ffe9c4' },
});

const win = addNode('win', root.id, {
  w: DESIGN_W, h: DESIGN_H, fullWidget: true, active: false, graphics: true, blockInput: true,
});
addNode('confetti', win.id, { w: DESIGN_W, h: DESIGN_H, fullWidget: true });
const panel = addNode('panel', win.id, { w: 520, h: 420, graphics: true });
addNode('h1', panel.id, {
  w: 460, h: 70, x: 0, y: 130,
  label: { text: 'Well Done!', size: 52, color: '#4fc3f7' },
});
addNode('h2', panel.id, {
  w: 400, h: 40, x: 0, y: 50,
  label: { text: '', size: 26, color: '#ffffff' },
});
const feat = addNode('feat', panel.id, { w: 320, h: 120, x: 0, y: -30, graphics: true });
addNode('t1', feat.id, {
  w: 280, h: 30, x: 0, y: 28,
  label: { text: '关卡完成', size: 24, color: '#ffffff' },
});
addNode('t2', feat.id, {
  w: 280, h: 28, x: 0, y: -18,
  label: { text: '继续挑战下一关吧', size: 20, color: '#e0e0e0' },
});
addButton(panel.id, 'next', 280, 72, 0, -130, '下一关 ▶', 28);
addButton(panel.id, 'home', 200, 56, 0, -210, '返回主页', 24);

const lose = addNode('lose', root.id, {
  w: DESIGN_W, h: DESIGN_H, fullWidget: true, active: false, graphics: true, blockInput: true,
});
addNode('h1', lose.id, {
  w: 400, h: 50, x: 0, y: 120,
  label: { text: '失败', size: 42, color: '#ffe9c4' },
});
addButton(lose.id, 'keep', 240, 64, 0, 20, '续关 (+60秒)', 26);
addButton(lose.id, 'retry', 240, 64, 0, -60, '再来一次', 26);
addButton(lose.id, 'menu', 200, 56, 0, -140, '选关', 24);

addNode('keep', root.id, { w: 1, h: 1, active: false });

if (prefabId !== 0) throw new Error('prefab must be index 0');

const prefabUuid = crypto.randomUUID();
const meta = {
  ver: '1.1.50',
  importer: 'prefab',
  imported: true,
  uuid: prefabUuid,
  files: ['.json'],
  subMetas: {},
  userData: {
    syncNodeName: 'SliderGame',
  },
};

const dirMeta = {
  ver: '1.2.0',
  importer: 'directory',
  imported: true,
  uuid: crypto.randomUUID(),
  files: [],
  subMetas: {},
  userData: {},
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(ROOT, 'assets/bundle/game/prefab.meta'), JSON.stringify(dirMeta, null, 2) + '\n');
fs.writeFileSync(path.join(OUT_DIR, 'SliderGame.prefab'), JSON.stringify(objects, null, 2) + '\n');
fs.writeFileSync(path.join(OUT_DIR, 'SliderGame.prefab.meta'), JSON.stringify(meta, null, 2) + '\n');

console.log(`wrote ${objects.length} objects → assets/bundle/game/prefab/SliderGame.prefab`);
console.log(`uuid=${prefabUuid}`);
