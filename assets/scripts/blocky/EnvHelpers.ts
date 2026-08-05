import { Graphics, Label, Node } from 'cc';
import { ShapeWoodenBox, colorHex } from './Enums';
import {
  ColorPathData, GrinderData, RotatorData, RollerDoorData, TunnelData, Vec2I, WoodenBoxData,
} from './LevelTypes';
import { colorFromHex } from '../utils/Helpers';
import { addLabel, makeNode } from '../utils/UIFactory';

export function woodenBoxSize(shape: ShapeWoodenBox): { w: number; h: number } {
  switch (shape) {
    case ShapeWoodenBox.Wooden_4x4: return { w: 4, h: 4 };
    case ShapeWoodenBox.Wooden_4x3: return { w: 4, h: 3 };
    case ShapeWoodenBox.Wooden_3x4: return { w: 3, h: 4 };
    case ShapeWoodenBox.Wooden_3x3: return { w: 3, h: 3 };
    case ShapeWoodenBox.Wooden_3x2: return { w: 3, h: 2 };
    case ShapeWoodenBox.Wooden_2x3: return { w: 2, h: 3 };
    default: return { w: 3, h: 3 };
  }
}

export function rectCells(pos: Vec2I, w: number, h: number): Vec2I[] {
  const out: Vec2I[] = [];
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) out.push({ x: pos.x + dx, y: pos.y + dy });
  }
  return out;
}

export function grinderCells(g: { pos: Vec2I; up: number; down: number; left: number; right: number }): Vec2I[] {
  const out: Vec2I[] = [{ ...g.pos }];
  for (let i = 1; i <= g.up; i++) out.push({ x: g.pos.x, y: g.pos.y - i });
  for (let i = 1; i <= g.down; i++) out.push({ x: g.pos.x, y: g.pos.y + i });
  for (let i = 1; i <= g.left; i++) out.push({ x: g.pos.x - i, y: g.pos.y });
  for (let i = 1; i <= g.right; i++) out.push({ x: g.pos.x + i, y: g.pos.y });
  return out;
}

export function rotatorArmCells(r: { pos: Vec2I; up: number; down: number; left: number; right: number }): Vec2I[] {
  return grinderCells(r); // 同形：中心 + 四向臂
}

/** 绕中心 90° 顺时针： (dx,dy) → (-dy, dx) 相对中心 */
export function rotateCellCW(cell: Vec2I, center: Vec2I): Vec2I {
  const dx = cell.x - center.x;
  const dy = cell.y - center.y;
  return { x: center.x - dy, y: center.y + dx };
}

export interface WoodenBoxRuntime {
  cells: Vec2I[];
  count: number;
  canMoveV: boolean;
  canMoveH: boolean;
  node: Node;
  label: Label;
  /** 相对锚点，拖动时用 */
  pos: Vec2I;
  w: number;
  h: number;
}

export interface GrinderRuntime {
  pos: Vec2I;
  up: number;
  down: number;
  left: number;
  right: number;
  node: Node;
  label: Label;
}

export interface RollerRuntime {
  cells: Vec2I[];
  count: number;
  node: Node;
  label: Label;
  pos: Vec2I;
  w: number;
  h: number;
}

export interface RotatorRuntime {
  pos: Vec2I;
  up: number;
  down: number;
  left: number;
  right: number;
  node: Node;
  rotating: boolean;
}

export interface TunnelRuntime {
  data: TunnelData;
  queue: number[];
  node: Node;
  label: Label;
}

export interface ColorPathRuntime {
  pos: Vec2I;
  color: number;
  node: Node;
}

export function spawnCountedRect(
  root: Node,
  cells: Vec2I[],
  count: number,
  hex: string,
  tag: string,
  gridToLocal: (x: number, y: number) => { x: number; y: number; z: number },
  cell: number,
  decor: Node[],
): { node: Node; label: Label } {
  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const pw = (maxX - minX + 1) * cell;
  const ph = (maxY - minY + 1) * cell;
  const node = makeNode(tag, root, pw, ph);
  node.setPosition(gridToLocal(cx, cy).x, gridToLocal(cx, cy).y, 0);
  const g = node.addComponent(Graphics);
  const col = colorFromHex(hex);
  col.a = 160;
  g.fillColor = col;
  for (const c of cells) {
    const lx = (c.x - cx) * cell;
    const ly = -(c.y - cy) * cell;
    g.rect(lx - cell / 2 + 1, ly - cell / 2 + 1, cell - 2, cell - 2);
  }
  g.fill();
  g.strokeColor = colorFromHex('#3e2723');
  g.lineWidth = 2;
  g.rect(-pw / 2, -ph / 2, pw, ph);
  g.stroke();
  const label = addLabel(makeNode('cnt', node, 60, 40), String(count), 28, '#ffffff');
  decor.push(node);
  return { node, label };
}

export function spawnGrinderVisual(
  root: Node,
  gData: GrinderData,
  gridToLocal: (x: number, y: number) => { x: number; y: number; z: number },
  cell: number,
  decor: Node[],
): GrinderRuntime {
  const cells = grinderCells(gData);
  const total = gData.up + gData.down + gData.left + gData.right;
  const { node, label } = spawnCountedRect(root, cells, total, '#ef5350', 'grinder', gridToLocal, cell, decor);
  const tag = makeNode('tag', node, 40, 24);
  tag.setPosition(0, cell * 0.35, 0);
  addLabel(tag, 'G', 14, '#ffffff');
  return {
    pos: { ...gData.pos },
    up: gData.up,
    down: gData.down,
    left: gData.left,
    right: gData.right,
    node,
    label,
  };
}

export function spawnWoodenBox(
  root: Node,
  data: WoodenBoxData,
  gridToLocal: (x: number, y: number) => { x: number; y: number; z: number },
  cell: number,
  decor: Node[],
): WoodenBoxRuntime {
  const { w, h } = woodenBoxSize(data.shapeWoodenBox);
  const cells = rectCells(data.pos, w, h);
  const { node, label } = spawnCountedRect(root, cells, data.numberBox, '#a1887f', 'woodbox', gridToLocal, cell, decor);
  const tag = makeNode('tag', node, 40, 24);
  tag.setPosition(0, cell * 0.35, 0);
  addLabel(tag, '箱', 14, '#3e2723');
  return {
    cells,
    count: data.numberBox,
    canMoveV: data.canMoveVertical,
    canMoveH: data.canMoveHorizontal,
    node,
    label,
    pos: { ...data.pos },
    w,
    h,
  };
}

export function spawnRoller(
  root: Node,
  data: RollerDoorData,
  gridToLocal: (x: number, y: number) => { x: number; y: number; z: number },
  cell: number,
  decor: Node[],
): RollerRuntime {
  const cells = rectCells(data.pos, data.size.x, data.size.y);
  const { node, label } = spawnCountedRect(root, cells, data.number, '#78909c', 'roller', gridToLocal, cell, decor);
  const tag = makeNode('tag', node, 40, 24);
  tag.setPosition(0, cell * 0.35, 0);
  addLabel(tag, '门', 14, '#ffffff');
  return {
    cells,
    count: data.number,
    node,
    label,
    pos: { ...data.pos },
    w: data.size.x,
    h: data.size.y,
  };
}

export function spawnRotator(
  root: Node,
  data: RotatorData,
  gridToLocal: (x: number, y: number) => { x: number; y: number; z: number },
  cell: number,
  decor: Node[],
): RotatorRuntime {
  const cells = rotatorArmCells(data);
  const { node } = spawnCountedRect(root, cells, 0, '#26a69a', 'rotator', gridToLocal, cell, decor);
  // 覆盖计数文字
  const cnt = node.getChildByName('cnt');
  if (cnt) {
    const lb = cnt.getComponent(Label);
    if (lb) lb.string = '↻';
  }
  return {
    pos: { ...data.pos },
    up: data.up,
    down: data.down,
    left: data.left,
    right: data.right,
    node,
    rotating: false,
  };
}

export function spawnTunnelVisual(
  root: Node,
  data: TunnelData,
  gridToLocal: (x: number, y: number) => { x: number; y: number; z: number },
  cell: number,
  decor: Node[],
): TunnelRuntime {
  const node = makeNode('tunnel', root, cell * 1.1, cell * 1.1);
  const p = gridToLocal(data.pos.x, data.pos.y);
  node.setPosition(p.x, p.y, 0);
  const g = node.addComponent(Graphics);
  g.fillColor = colorFromHex('#6d4c41');
  g.roundRect(-cell * 0.5, -cell * 0.5, cell, cell, 8);
  g.fill();
  g.strokeColor = colorFromHex('#3e2723');
  g.lineWidth = 3;
  g.roundRect(-cell * 0.5, -cell * 0.5, cell, cell, 8);
  g.stroke();
  // 方向箭头
  const dirLabel = data.dir.x > 0 ? '→' : data.dir.x < 0 ? '←' : data.dir.y > 0 ? '↓' : '↑';
  addLabel(makeNode('dir', node, cell, 24), dirLabel, 20, '#ffcc80').node.setPosition(0, cell * 0.28, 0);
  const label = addLabel(makeNode('cnt', node, cell, 28), String(data.listIdBlock.length), 22, '#ffffff');
  decor.push(node);
  return { data, queue: data.listIdBlock.slice(), node, label };
}

export function spawnColorPathVisual(
  root: Node,
  data: ColorPathData,
  gridToLocal: (x: number, y: number) => { x: number; y: number; z: number },
  cell: number,
  decor: Node[],
): ColorPathRuntime {
  const node = makeNode('cpath', root, cell * 0.85, cell * 0.85);
  const p = gridToLocal(data.pos.x, data.pos.y);
  node.setPosition(p.x, p.y, 0);
  const g = node.addComponent(Graphics);
  const col = colorFromHex(colorHex(data.color));
  col.a = 120;
  g.fillColor = col;
  g.roundRect(-cell * 0.4, -cell * 0.4, cell * 0.8, cell * 0.8, 6);
  g.fill();
  decor.push(node);
  return { pos: { ...data.pos }, color: data.color, node };
}

/** 列出 color flags 中的各个 bit */
export function colorFlagBits(flags: number): number[] {
  const bits: number[] = [];
  for (let b = 1; b <= 4096; b <<= 1) {
    if (flags & b) bits.push(b);
  }
  return bits;
}
