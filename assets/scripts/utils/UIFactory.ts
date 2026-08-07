import {
  Color, EventTouch, Label, Node, Sprite, SpriteFrame, UIOpacity, UITransform,
  Vec3, Widget, view, Layers, BlockInputEvents, Graphics,
} from 'cc';
import { DESIGN_H, DESIGN_W } from './Constants';
import { colorFromHex } from './Helpers';

const UI_LAYER = Layers.Enum.UI_2D;

// ─── 预制体节点导航 ─────────────────────────────────────────

/** 按 `/` 路径查找子节点，找不到返回 null */
export function childPath(root: Node, path: string): Node | null {
  const parts = path.split('/');
  let n: Node | null = root;
  for (const p of parts) {
    if (!n) return null;
    n = n.getChildByName(p);
  }
  return n;
}

/** 按路径查找子节点，缺失时抛错（owner 用于错误信息） */
export function mustChild(root: Node, path: string, owner = 'UI'): Node {
  const n = childPath(root, path);
  if (!n) throw new Error(`${owner} missing node: ${path}`);
  return n;
}

/** 按路径查找带 Label 的子节点 */
export function mustLabel(root: Node, path: string, owner = 'UI'): Label {
  const n = mustChild(root, path, owner);
  const lb = n.getComponent(Label);
  if (!lb) throw new Error(`${owner} missing Label: ${path}`);
  return lb;
}

// ─── 节点创建 ───────────────────────────────────────────────

export function makeNode(name: string, parent?: Node, w = 0, h = 0): Node {
  const n = new Node(name);
  n.layer = UI_LAYER;
  const ut = n.addComponent(UITransform);
  if (w || h) ut.setContentSize(w, h);
  if (parent) parent.addChild(n);
  return n;
}

export function fullWidget(node: Node) {
  const w = node.getComponent(Widget) || node.addComponent(Widget);
  w.isAlignTop = w.isAlignBottom = w.isAlignLeft = w.isAlignRight = true;
  w.top = w.bottom = w.left = w.right = 0;
  w.alignMode = 2;
  return w;
}

export function setSprite(node: Node, sf: SpriteFrame | null, sizeMode = Sprite.SizeMode.CUSTOM) {
  let sp = node.getComponent(Sprite);
  if (!sp) sp = node.addComponent(Sprite);
  sp.sizeMode = sizeMode;
  sp.spriteFrame = sf;
  disableSpriteTrim(sp);
  return sp;
}

/** 取消 Sprite Trim 勾选（对应编辑器 Trim；须设 trim + isTrimmedMode） */
export function disableSpriteTrim(sp: Sprite) {
  sp.trim = false;
  sp.isTrimmedMode = false;
}

/** 取消节点及子树上所有 Sprite 的 Trim */
export function disableSpriteTrimSubtree(root: Node) {
  const sp = root.getComponent(Sprite);
  if (sp) disableSpriteTrim(sp);
  for (const child of root.children) {
    disableSpriteTrimSubtree(child);
  }
}

export function setColorSprite(node: Node, color: Color) {
  const sp = node.getComponent(Sprite) || node.addComponent(Sprite);
  sp.sizeMode = Sprite.SizeMode.CUSTOM;
  sp.color = color;
  disableSpriteTrim(sp);
  return sp;
}

export function addLabel(node: Node, text: string, fontSize = 40, color = '#5b341a'): Label {
  const lb = node.addComponent(Label);
  lb.string = text;
  lb.fontSize = fontSize;
  lb.lineHeight = fontSize + 9;
  lb.color = colorFromHex(color);
  lb.overflow = Label.Overflow.NONE;
  lb.horizontalAlign = Label.HorizontalAlign.CENTER;
  lb.verticalAlign = Label.VerticalAlign.CENTER;
  lb.enableWrapText = false;
  return lb;
}

// ─── Graphics 绘制 ───────────────────────────────────────────

/** Label / Sprite 与 Graphics 不能同节点；返回可挂 Graphics 的节点（必要时创建子节点 bg） */
export function graphicsHost(node: Node, w?: number, h?: number): Node {
  const ut = node.getComponent(UITransform);
  const width = w ?? ut?.contentSize.width ?? 100;
  const height = h ?? ut?.contentSize.height ?? 50;
  if (!node.getComponent(Label) && !node.getComponent(Sprite)) {
    return node;
  }
  let bg = node.getChildByName('bg');
  if (!bg) {
    bg = makeNode('bg', node, width, height);
    bg.setSiblingIndex(0);
  } else if (w || h) {
    const bgUt = bg.getComponent(UITransform);
    if (bgUt) bgUt.setContentSize(width, height);
  }
  return bg;
}

function getOrAddGraphics(node: Node): Graphics {
  return node.getComponent(Graphics) || node.addComponent(Graphics);
}

export function paintRect(node: Node, x: number, y: number, w: number, h: number, fill: Color) {
  const host = graphicsHost(node, w, h);
  const g = getOrAddGraphics(host);
  g.clear();
  g.fillColor = fill;
  g.rect(x, y, w, h);
  g.fill();
}

export function paintRoundRect(
  node: Node, x: number, y: number, w: number, h: number, r: number, fill: Color,
) {
  const host = graphicsHost(node, w, h);
  const g = getOrAddGraphics(host);
  g.clear();
  g.fillColor = fill;
  g.roundRect(x, y, w, h, r);
  g.fill();
}

/** 以节点中心为原点绘制圆角按钮底（不绑定点击） */
export function paintRoundButton(
  node: Node,
  w?: number,
  h?: number,
  radius = 26,
  fillHex = '#f2c97e',
  strokeHex = '#c98a4b',
  lineWidth = 4,
) {
  const ut = node.getComponent(UITransform);
  const width = w ?? ut?.contentSize.width ?? 100;
  const height = h ?? ut?.contentSize.height ?? 50;
  const host = graphicsHost(node, width, height);
  const g = getOrAddGraphics(host);
  g.clear();
  g.fillColor = colorFromHex(fillHex);
  g.roundRect(-width / 2, -height / 2, width, height, radius);
  g.fill();
  g.strokeColor = colorFromHex(strokeHex);
  g.lineWidth = lineWidth;
  g.roundRect(-width / 2, -height / 2, width, height, radius);
  g.stroke();
}

/** 以节点中心为原点绘制圆角格（选关格子等） */
export function paintRoundCell(
  node: Node,
  w: number,
  h: number,
  fillHex: string,
  strokeHex: string,
  radius = 17,
  lineWidth = 3,
) {
  const g = node.addComponent(Graphics);
  g.fillColor = colorFromHex(fillHex);
  g.roundRect(-w / 2, -h / 2, w, h, radius);
  g.fill();
  g.strokeColor = colorFromHex(strokeHex);
  g.lineWidth = lineWidth;
  g.roundRect(-w / 2, -h / 2, w, h, radius);
  g.stroke();
}

// ─── 触摸绑定 ───────────────────────────────────────────────

export function bindTouchEnd(node: Node, onClick: () => void) {
  node.on(Node.EventType.TOUCH_END, (e: EventTouch) => {
    e.propagationStopped = true;
    onClick();
  });
}

// ─── 组合控件 ───────────────────────────────────────────────

export function makeButton(parent: Node, name: string, w: number, h: number, label: string, onClick: () => void): Node {
  const n = makeNode(name, parent, w, h);
  paintRoundButton(n, w, h);
  const t = makeNode('txt', n, w - 29, h - 14);
  addLabel(t, label, Math.min(40, Math.floor(h * 0.38)), '#5b341a');
  bindTouchEnd(n, onClick);
  return n;
}

export function makeImageButton(parent: Node, name: string, w: number, h: number, bg: SpriteFrame | null, label: string, onClick: () => void): Node {
  const n = makeNode(name, parent, w, h);
  if (bg) setSprite(n, bg);
  else {
    const g = n.addComponent(Graphics);
    g.fillColor = colorFromHex('#8bc34a');
    g.roundRect(-w / 2, -h / 2, w, h, 29);
    g.fill();
  }
  const t = makeNode('txt', n, w * 0.8, h * 0.5);
  addLabel(t, label, 43, '#5b341a');
  bindTouchEnd(n, onClick);
  return n;
}

export function makeOverlay(parent: Node, name: string): Node {
  const n = makeNode(name, parent, DESIGN_W, DESIGN_H);
  fullWidget(n);
  n.addComponent(BlockInputEvents);
  paintRect(n, -DESIGN_W / 2, -DESIGN_H / 2, DESIGN_W, DESIGN_H, new Color(90, 52, 26, 220));
  n.active = false;
  return n;
}

export function setOpacity(node: Node, opacity: number) {
  const op = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
  op.opacity = opacity;
  return op;
}

export function designCenter(): Vec3 {
  const vs = view.getVisibleSize();
  return new Vec3(vs.width / 2, vs.height / 2, 0);
}
