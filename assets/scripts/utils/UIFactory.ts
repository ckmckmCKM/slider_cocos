import {
  Color, EventTouch, Label, Node, Sprite, SpriteFrame, UIOpacity, UITransform,
  Vec3, Widget, view, Layers, BlockInputEvents, Graphics,
} from 'cc';
import { DESIGN_H, DESIGN_W } from './Constants';
import { colorFromHex } from './Helpers';

const UI_LAYER = Layers.Enum.UI_2D;

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
  return sp;
}

export function setColorSprite(node: Node, color: Color) {
  const sp = node.getComponent(Sprite) || node.addComponent(Sprite);
  sp.sizeMode = Sprite.SizeMode.CUSTOM;
  sp.color = color;
  // need a white frame; Graphics fallback if no frame
  return sp;
}

export function addLabel(node: Node, text: string, fontSize = 28, color = '#5b341a'): Label {
  const lb = node.addComponent(Label);
  lb.string = text;
  lb.fontSize = fontSize;
  lb.lineHeight = fontSize + 6;
  lb.color = colorFromHex(color);
  lb.overflow = Label.Overflow.NONE;
  lb.horizontalAlign = Label.HorizontalAlign.CENTER;
  lb.verticalAlign = Label.VerticalAlign.CENTER;
  lb.enableWrapText = false;
  return lb;
}

export function makeButton(parent: Node, name: string, w: number, h: number, label: string, onClick: () => void): Node {
  const n = makeNode(name, parent, w, h);
  const g = n.addComponent(Graphics);
  g.fillColor = colorFromHex('#f2c97e');
  g.roundRect(-w / 2, -h / 2, w, h, 18);
  g.fill();
  g.strokeColor = colorFromHex('#c98a4b');
  g.lineWidth = 3;
  g.roundRect(-w / 2, -h / 2, w, h, 18);
  g.stroke();
  const t = makeNode('txt', n, w - 20, h - 10);
  addLabel(t, label, Math.min(28, Math.floor(h * 0.38)), '#5b341a');
  n.on(Node.EventType.TOUCH_END, (e: EventTouch) => {
    e.propagationStopped = true;
    onClick();
  });
  return n;
}

export function makeImageButton(parent: Node, name: string, w: number, h: number, bg: SpriteFrame | null, label: string, onClick: () => void): Node {
  const n = makeNode(name, parent, w, h);
  if (bg) setSprite(n, bg);
  else {
    const g = n.addComponent(Graphics);
    g.fillColor = colorFromHex('#8bc34a');
    g.roundRect(-w / 2, -h / 2, w, h, 20);
    g.fill();
  }
  const t = makeNode('txt', n, w * 0.8, h * 0.5);
  addLabel(t, label, 30, '#5b341a');
  n.on(Node.EventType.TOUCH_END, (e: EventTouch) => {
    e.propagationStopped = true;
    onClick();
  });
  return n;
}

export function makeOverlay(parent: Node, name: string): Node {
  const n = makeNode(name, parent, DESIGN_W, DESIGN_H);
  fullWidget(n);
  n.addComponent(BlockInputEvents);
  const g = n.addComponent(Graphics);
  g.fillColor = new Color(90, 52, 26, 220);
  g.rect(-DESIGN_W / 2, -DESIGN_H / 2, DESIGN_W, DESIGN_H);
  g.fill();
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
