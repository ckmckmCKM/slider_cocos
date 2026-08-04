import {
  Color, EventTouch, Graphics, Mask, Node, UITransform, Vec3, tween, UIOpacity,
} from 'cc';
import { BOARD_MAX_H, BOARD_MAX_W, CELL, COLORS, EPS } from '../utils/Constants';
import { clamp, colorFromHex, parseDirect, resolveAnimalSize, resolveFootprint, shadeHex } from '../utils/Helpers';
import { BlockInstance, LevelData } from '../utils/LevelTypes';
import { ResCache } from '../utils/ResCache';
import { SoundMgr } from '../utils/SoundMgr';
import { makeNode, setSprite } from '../utils/UIFactory';

export interface Piece {
  id: number;
  node: Node;
  sx: number;
  sy: number;
  shapeName: string;
  sprite: string | null;
  groupId: number;
  offsetX: number;
  offsetZ: number;
  animalW: number;
  animalH: number;
  material: string;
  matchable: boolean;
  movable: boolean;
  frozen: boolean;
  iceLeft: number;
  chain: number;
  key: number;
  direct: { axis: 'x' | 'z' | null };
  alive: boolean;
  x: number;
  z: number;
  iceNode?: Node | null;
  chainNode?: Node | null;
}

export interface BoardCallbacks {
  onHud: () => void;
  onGoals: () => void;
  onWin: () => void;
  onToast: (msg: string) => void;
}

export class BoardController {
  root: Node;
  pieces: Piece[] = [];
  decor: Node[] = [];
  bounds = { minX: 0, maxX: 5, minZ: 0, maxZ: 5 };
  groupExpected: Record<string, number> = {};
  levelIndex = 1;
  timeLeft = 0;
  running = false;
  levelDone = false;
  tools = { hammer: 3, magnet: 2, magic: 1, time: 2 };
  activeTool: string | null = null;
  /** 当前关卡格像素，按棋盘自适应 */
  cell = CELL;
  private drag: { piece: Piece; ox: number; oz: number; startX: number; startZ: number; moved: boolean } | null = null;
  private origin = new Vec3(0, 0, 0);
  private cb: BoardCallbacks;

  constructor(root: Node, cb: BoardCallbacks) {
    this.root = root;
    this.cb = cb;
    this.root.on(Node.EventType.TOUCH_START, this.onDown, this);
    this.root.on(Node.EventType.TOUCH_MOVE, this.onMove, this);
    this.root.on(Node.EventType.TOUCH_END, this.onUp, this);
    this.root.on(Node.EventType.TOUCH_CANCEL, this.onUp, this);
  }

  clear() {
    for (const p of this.pieces) p.node.destroy();
    for (const d of this.decor) d.destroy();
    this.pieces = [];
    this.decor = [];
    this.groupExpected = {};
    this.drag = null;
  }

  async startLevel(idx: number, lvl: LevelData) {
    this.clear();
    this.levelIndex = idx;
    this.levelDone = false;
    this.running = true;
    this.activeTool = null;
    this.timeLeft = lvl.time || 300;
    await this.buildBoard(lvl);
    this.markEliminable();
    this.cb.onHud();
    this.cb.onGoals();
  }

  remainingGroups(): number {
    const seen = new Set<number>();
    let n = 0;
    for (const p of this.pieces) {
      if (!p.alive || !p.matchable || !p.groupId) continue;
      if (seen.has(p.groupId)) continue;
      seen.add(p.groupId);
      n++;
    }
    return n;
  }

  goals(): { sprite: string; count: number }[] {
    const map: Record<string, { sprite: string; count: number }> = {};
    for (const p of this.pieces) {
      if (!p.alive || !p.matchable || !p.sprite) continue;
      const k = String(p.groupId);
      if (!map[k]) map[k] = { sprite: p.sprite, count: 0 };
      map[k].count++;
    }
    return Object.values(map);
  }

  tick(dt: number) {
    if (!this.running || this.levelDone) return;
    this.timeLeft -= dt;
    this.cb.onHud();
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.running = false;
      this.levelDone = true;
      SoundMgr.play('lose');
    }
  }

  useTimeTool() {
    if (this.tools.time <= 0 || !this.running) return;
    this.tools.time--;
    this.timeLeft += 30;
    SoundMgr.play('time');
    this.cb.onToast('+30 秒');
    this.cb.onHud();
  }

  private async buildBoard(lvl: LevelData) {
    const inner = (lvl.borders || []).find((b) => b.name === 'Inner Tile');
    let minX = 1, maxX = 4, minZ = 1, maxZ = 5;
    if (inner?.positions?.length) {
      minX = Math.min(...inner.positions.map((p) => p.x));
      maxX = Math.max(...inner.positions.map((p) => p.x));
      minZ = Math.min(...inner.positions.map((p) => p.z));
      maxZ = Math.max(...inner.positions.map((p) => p.z));
    }
    this.bounds = { minX: minX - 0.5, maxX: maxX + 0.5, minZ: minZ - 0.5, maxZ: maxZ + 0.5 };
    const cxm = (minX + maxX) / 2;
    const czm = (minZ + maxZ) / 2;
    const bw = maxX - minX + 1;
    const bd = maxZ - minZ + 1;

    // 自适应格宽，贴近 HTML 版「棋盘铺满中部」
    this.cell = Math.max(64, Math.floor(Math.min(
      BOARD_MAX_W / (bw + 1.4),
      BOARD_MAX_H / (bd + 1.4),
      140,
    )));
    const C = this.cell;

    // board local: grid x -> px, grid z -> -py (screen up)
    this.origin.set(-cxm * C, czm * C, 0);

    // wood tray
    const tray = makeNode('tray', this.root, (bw + 0.6) * C, (bd + 0.6) * C);
    const tg = tray.addComponent(Graphics);
    tg.fillColor = colorFromHex('#6b4226');
    tg.roundRect(-(bw + 0.6) * C / 2, -(bd + 0.6) * C / 2, (bw + 0.6) * C, (bd + 0.6) * C, 18);
    tg.fill();
    this.decor.push(tray);

    // cells
    if (inner) {
      for (const p of inner.positions) {
        const cell = makeNode('cell', this.root, C * 0.92, C * 0.92);
        cell.setPosition(this.gridToLocal(p.x, p.z));
        const g = cell.addComponent(Graphics);
        g.fillColor = colorFromHex('#5a351c');
        g.roundRect(-C * 0.46, -C * 0.46, C * 0.92, C * 0.92, 8);
        g.fill();
        this.decor.push(cell);
      }
    }

    // frame rim
    const pad = 0.58, fw = 0.42;
    const rimColor = colorFromHex('#8b5a2b');
    for (const zpos of [minZ - pad, maxZ + pad]) {
      const m = makeNode('rimH', this.root, (bw + pad * 2 + fw * 0.6) * C, fw * C);
      m.setPosition(this.gridToLocal(cxm, zpos));
      const g = m.addComponent(Graphics);
      g.fillColor = rimColor;
      g.rect(-(bw + pad * 2 + fw * 0.6) * C / 2, -fw * C / 2, (bw + pad * 2 + fw * 0.6) * C, fw * C);
      g.fill();
      this.decor.push(m);
    }
    for (const xpos of [minX - pad, maxX + pad]) {
      const m = makeNode('rimV', this.root, fw * C, (bd + pad * 2 + fw * 0.6) * C);
      m.setPosition(this.gridToLocal(xpos, czm));
      const g = m.addComponent(Graphics);
      g.fillColor = rimColor;
      g.rect(-fw * C / 2, -(bd + pad * 2 + fw * 0.6) * C / 2, fw * C, (bd + pad * 2 + fw * 0.6) * C);
      g.fill();
      this.decor.push(m);
    }

    let id = 0;
    for (const g of (lvl.blocks || [])) {
      for (const bi of g.blockInstances) {
        const [sx, sy] = resolveFootprint(g.name, bi.size);
        const animal = resolveAnimalSize(bi.spriteName || '', bi.size);
        const piece = await this.makePiece(bi, sx, sy, g.name, id++, animal);
        this.pieces.push(piece);
        if (piece.groupId && piece.matchable) {
          const k = String(piece.groupId);
          this.groupExpected[k] = (this.groupExpected[k] || 0) + 1;
        }
      }
    }
  }

  private gridToLocal(x: number, z: number): Vec3 {
    const C = this.cell;
    return new Vec3(this.origin.x + x * C, this.origin.y - z * C, 0);
  }

  private localToGrid(lx: number, ly: number): { x: number; z: number } {
    const C = this.cell;
    return {
      x: (lx - this.origin.x) / C,
      z: (this.origin.y - ly) / C,
    };
  }

  private async makePiece(
    bi: BlockInstance,
    sx: number,
    sy: number,
    shapeName: string,
    id: number,
    animalSize: [number, number],
    uvOverride?: { u0: number; u1: number; v0: number; v1: number },
  ): Promise<Piece> {
    const C = this.cell;
    const matName = bi.materialName || 'Blue';
    const base = COLORS[matName] || COLORS.Blue;
    const spr = bi.spriteName;
    const isMatchable = !!(spr && spr !== 'None');
    const aw = animalSize[0] || sx;
    const ah = animalSize[1] || sy;
    const offX = bi.offset?.x || 0;
    const offZ = bi.offset?.y || 0;
    const dir = parseDirect(bi.directName);
    const iceLeft = bi.IceTime || 0;

    const pw = sx * C - 6;
    const ph = sy * C - 6;
    const node = makeNode(`piece_${id}`, this.root, pw, ph);
    const body = node.addComponent(Graphics);
    body.fillColor = colorFromHex(isMatchable ? base : (COLORS[matName + 'Dark'] || shadeHex(base, 0.7)));
    body.roundRect(-pw / 2, -ph / 2, pw, ph, 10);
    body.fill();
    body.strokeColor = colorFromHex(shadeHex(base, 0.65));
    body.lineWidth = 3;
    body.roundRect(-pw / 2, -ph / 2, pw, ph, 10);
    body.stroke();

    if (isMatchable && spr) {
      const sf = await ResCache.img(spr);
      if (sf) {
        const { u0, u1, v0, v1 } = uvOverride || this.pieceUV(sx, sy, aw, ah, offX, offZ);

        const mw = Math.max(8, sx * C - 14);
        const mh = Math.max(8, sy * C - 14);
        const maskNode = makeNode('imgMask', node, mw, mh);
        const mask = maskNode.addComponent(Mask);
        mask.type = Mask.Type.GRAPHICS_RECT;

        const img = makeNode('img', maskNode, aw * C, ah * C);
        setSprite(img, sf);
        const uMid = (u0 + u1) / 2;
        const vMid = (v0 + v1) / 2;
        // 纹理 v=0 在底部；本地 +y 向上
        img.setPosition(-(uMid - 0.5) * aw * C, -(vMid - 0.5) * ah * C, 0);
      }
    } else if (/Wood/i.test(matName)) {
      const sf = await ResCache.img('Wood_XR');
      if (sf) setSprite(makeNode('top', node, sx * C - 10, sy * C - 10), sf);
    } else if (/Stone/i.test(matName)) {
      const sf = (await ResCache.img('Stone_XR')) || (await ResCache.img('Stone'));
      if (sf) setSprite(makeNode('top', node, sx * C - 10, sy * C - 10), sf);
    }

    if (dir.axis) {
      const arrowSf = await ResCache.img('Direction_XR');
      if (arrowSf) {
        const a = makeNode('arrow', node, Math.min(sx, sy) * C * 0.45, Math.min(sx, sy) * C * 0.3);
        setSprite(a, arrowSf);
        if (dir.axis === 'z') a.angle = 90;
        const dp = bi.directPos || { x: 0, z: 0 };
        a.setPosition((dp.x || 0) * C, -(dp.z || 0) * C, 0);
      }
    }

    let iceNode: Node | null = null;
    if (iceLeft > 0) {
      iceNode = makeNode('ice', node, sx * C, sy * C);
      const ig = iceNode.addComponent(Graphics);
      ig.fillColor = new Color(179, 229, 252, 140);
      ig.roundRect(-sx * C / 2, -sy * C / 2, sx * C, sy * C, 10);
      ig.fill();
      const iceSf = (await ResCache.img('Ice_XR')) || (await ResCache.img('ice_texture_02'));
      if (iceSf) setSprite(makeNode('iceTex', iceNode, sx * C * 0.9, sy * C * 0.9), iceSf);
    }

    if (bi.key === 1) {
      const ksf = await ResCache.img('Key_XR');
      if (ksf) setSprite(makeNode('key', node, 40, 40), ksf);
    }
    let chainNode: Node | null = null;
    if ((bi.chain || 0) > 0) {
      const csf = (await ResCache.img('Lock_XR')) || (await ResCache.img('Lock'));
      if (csf) {
        chainNode = makeNode('chain', node, 44, 44);
        setSprite(chainNode, csf);
      }
    }

    const px = bi.position.x, pz = bi.position.z;
    node.setPosition(this.gridToLocal(px, pz));
    (node as any)._pieceId = id;

    return {
      id, node, sx, sy, shapeName,
      sprite: isMatchable ? (spr as string) : null,
      groupId: bi.groupId || 0,
      offsetX: offX, offsetZ: offZ,
      animalW: aw, animalH: ah,
      material: matName,
      matchable: isMatchable,
      movable: !/Border/i.test(matName),
      frozen: iceLeft > 0,
      iceLeft,
      chain: bi.chain || 0,
      key: bi.key || 0,
      direct: dir,
      alive: true,
      x: px, z: pz,
      iceNode, chainNode,
    };
  }

  private aabb(p: Piece, x: number, z: number) {
    return {
      minX: x - p.sx / 2 + EPS,
      maxX: x + p.sx / 2 - EPS,
      minZ: z - p.sy / 2 + EPS,
      maxZ: z + p.sy / 2 - EPS,
    };
  }

  private fits(p: Piece, x: number, z: number) {
    const a = this.aabb(p, x, z);
    const b = this.bounds;
    if (a.minX < b.minX - EPS || a.maxX > b.maxX + EPS || a.minZ < b.minZ - EPS || a.maxZ > b.maxZ + EPS) return false;
    for (const o of this.pieces) {
      if (!o.alive || o.id === p.id) continue;
      const oa = this.aabb(o, o.x, o.z);
      if (a.minX < oa.maxX && a.maxX > oa.minX && a.minZ < oa.maxZ && a.maxZ > oa.minZ) return false;
    }
    return true;
  }

  private pick(e: EventTouch): Piece | null {
    const loc = e.getUILocation();
    const ui = this.root.getComponent(UITransform)!;
    const local = ui.convertToNodeSpaceAR(new Vec3(loc.x, loc.y, 0));
    // top-most piece under point
    let best: Piece | null = null;
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const p = this.pieces[i];
      if (!p.alive) continue;
      const a = this.aabb(p, p.x, p.z);
      const g = this.localToGrid(local.x, local.y);
      if (g.x >= a.minX && g.x <= a.maxX && g.z >= a.minZ && g.z <= a.maxZ) {
        best = p;
        break;
      }
    }
    return best;
  }

  private onDown(e: EventTouch) {
    if (!this.running) return;
    const piece = this.pick(e);
    if (!piece) return;

    if (this.activeTool) {
      this.useTool(this.activeTool, piece);
      return;
    }
    if (!piece.movable || piece.frozen || piece.chain > 0) {
      if (piece.frozen) this.cb.onToast('冰块冻结中');
      else if (piece.chain > 0) this.cb.onToast('锁链束缚中');
      return;
    }
    const loc = e.getUILocation();
    const ui = this.root.getComponent(UITransform)!;
    const local = ui.convertToNodeSpaceAR(new Vec3(loc.x, loc.y, 0));
    const g = this.localToGrid(local.x, local.y);
    this.drag = {
      piece, ox: g.x - piece.x, oz: g.z - piece.z,
      startX: piece.x, startZ: piece.z, moved: false,
    };
    piece.node.setSiblingIndex(this.root.children.length - 1);
  }

  private onMove(e: EventTouch) {
    if (!this.drag || !this.running) return;
    const p = this.drag.piece;
    const loc = e.getUILocation();
    const ui = this.root.getComponent(UITransform)!;
    const local = ui.convertToNodeSpaceAR(new Vec3(loc.x, loc.y, 0));
    const g = this.localToGrid(local.x, local.y);
    let nx = g.x - this.drag.ox;
    let nz = g.z - this.drag.oz;
    if (p.direct.axis === 'x') nz = this.drag.startZ;
    if (p.direct.axis === 'z') nx = this.drag.startX;

    const tryX = this.fits(p, nx, p.z) ? nx : p.x;
    const tryZ = this.fits(p, tryX, nz) ? nz : p.z;
    const altZ = this.fits(p, p.x, nz) ? nz : p.z;
    const altX = this.fits(p, nx, altZ) ? nx : p.x;
    const d1 = Math.hypot(tryX - nx, tryZ - nz);
    const d2 = Math.hypot(altX - nx, altZ - nz);
    nx = d1 <= d2 ? tryX : altX;
    nz = d1 <= d2 ? tryZ : altZ;

    if (Math.hypot(nx - this.drag.startX, nz - this.drag.startZ) > 0.08) this.drag.moved = true;
    p.x = nx; p.z = nz;
    p.node.setPosition(this.gridToLocal(nx, nz));
  }

  private onUp() {
    if (!this.running || !this.drag) return;
    const p = this.drag.piece;
    const sx = Math.round(p.x * 2) / 2;
    const sz = Math.round(p.z * 2) / 2;
    if (this.fits(p, sx, sz)) { p.x = sx; p.z = sz; }
    else { p.x = this.drag.startX; p.z = this.drag.startZ; }
    p.node.setPosition(this.gridToLocal(p.x, p.z));

    if (this.drag.moved) {
      SoundMgr.playMove(p.material);
      this.onMoved();
    } else if (p.matchable && !p.frozen && p.chain <= 0) {
      const exp = this.groupExpected[String(p.groupId)] || 0;
      const aliveG = this.pieces.filter((x) => x.alive && x.groupId === p.groupId);
      if (exp === 1 && aliveG.length === 1) this.clearGroup(aliveG);
    }
    this.drag = null;
  }

  private onMoved() {
    for (const p of this.pieces) {
      if (!p.alive || !p.frozen) continue;
      p.iceLeft--;
      if (p.iceLeft <= 0) {
        p.frozen = false;
        if (p.iceNode) { p.iceNode.destroy(); p.iceNode = null; }
        SoundMgr.play('ice');
      }
    }
    this.markEliminable();
    this.cb.onGoals();
  }

  private isGroupAssembled(members: Piece[]) {
    if (!members.length) return false;
    if (members.some((p) => p.frozen || p.chain > 0)) return false;
    const r = members[0];
    for (const p of members) {
      const ex = r.x + (p.offsetX - r.offsetX);
      const ez = r.z + (p.offsetZ - r.offsetZ);
      if (Math.abs(p.x - ex) > 0.2 || Math.abs(p.z - ez) > 0.2) return false;
    }
    return true;
  }

  private findAssembledGroups(): Piece[][] {
    const map: Record<string, Piece[]> = {};
    for (const p of this.pieces) {
      if (!p.alive || !p.matchable || !p.groupId) continue;
      (map[p.groupId] = map[p.groupId] || []).push(p);
    }
    const ready: Piece[][] = [];
    for (const gid in map) {
      const members = map[gid];
      const expected = this.groupExpected[gid] || members.length;
      if (expected >= 2 && members.length >= expected && this.isGroupAssembled(members)) ready.push(members);
    }
    return ready;
  }

  private markEliminable() {
    for (const members of this.findAssembledGroups()) this.clearGroup(members);
  }

  private clearGroup(members: Piece[]) {
    if (!members.length) return;
    SoundMgr.play('match');
    for (const p of members) {
      if (!p.alive) continue;
      p.alive = false;
      this.flyOut(p);
    }
    if (members.some((t) => t.key === 1)) {
      for (const p of this.pieces) {
        if (!p.alive || p.chain <= 0) continue;
        p.chain--;
        if (p.chain <= 0 && p.chainNode) {
          p.chainNode.destroy();
          p.chainNode = null;
        }
      }
    }
    this.cb.onGoals();
    this.cb.onHud();
    if (this.remainingGroups() === 0) {
      this.running = false;
      this.levelDone = true;
      this.cb.onWin();
    }
  }

  private flyOut(p: Piece) {
    const op = p.node.getComponent(UIOpacity) || p.node.addComponent(UIOpacity);
    tween(p.node)
      .to(0.35, { position: new Vec3(p.node.position.x, p.node.position.y + 180, 0), scale: new Vec3(0.2, 0.2, 1) }, { easing: 'quadOut' })
      .start();
    tween(op).to(0.35, { opacity: 0 }).call(() => p.node.destroy()).start();
  }

  private useTool(kind: string, piece: Piece) {
    if ((this.tools as any)[kind] <= 0) return;
    if (kind === 'hammer') {
      if (!piece.movable || (piece.sx <= 1 + EPS && piece.sy <= 1 + EPS)) {
        this.cb.onToast('该滑块无法敲散');
        return;
      }
      this.tools.hammer--;
      SoundMgr.play('hammer');
      this.splitToOnes(piece);
    } else if (kind === 'magnet') {
      if (!piece.matchable || piece.frozen || piece.chain > 0) {
        this.cb.onToast('该滑块无法使用磁铁');
        return;
      }
      this.tools.magnet--;
      SoundMgr.play('magnet');
      const targets = this.pieces.filter((p) => p.alive && p.sprite === piece.sprite && !p.frozen && p.chain <= 0);
      for (const p of targets) { p.alive = false; this.flyOut(p); }
    } else if (kind === 'magic') {
      if (!piece.matchable) { this.cb.onToast('请点击图案滑块'); return; }
      this.tools.magic--;
      SoundMgr.play('match');
      const targets = this.pieces.filter((p) => p.alive && p.sprite === piece.sprite);
      for (const p of targets) { p.alive = false; this.flyOut(p); }
    }
    this.activeTool = null;
    this.markEliminable();
    this.cb.onGoals();
    this.cb.onHud();
    if (this.remainingGroups() === 0) {
      this.running = false;
      this.levelDone = true;
      this.cb.onWin();
    }
  }

  /** 与 HTML / makePiece 相同的 UV 区间 */
  private pieceUV(sx: number, sy: number, aw: number, ah: number, offX: number, offZ: number) {
    let u0 = 0, u1 = 1, v0 = 0, v1 = 1;
    if (Math.abs(sx - aw) >= 0.15) {
      const left = (offX - sx / 2 + aw / 2) / aw;
      u0 = clamp(left, 0, 1);
      u1 = clamp(left + sx / aw, 0, 1);
    }
    if (Math.abs(sy - ah) >= 0.15) {
      const bot = (offZ - sy / 2 + ah / 2) / ah;
      v0 = clamp(bot, 0, 1);
      v1 = clamp(bot + sy / ah, 0, 1);
    }
    if (u1 <= u0) { u0 = 0; u1 = 1; }
    if (v1 <= v0) { v0 = 0; v1 = 1; }
    return { u0, u1, v0, v1 };
  }

  private async splitToOnes(piece: Piece) {
    const sx = Math.round(piece.sx);
    const sy = Math.round(piece.sy);
    const aw = piece.animalW || 1;
    const ah = piece.animalH || 1;
    const x0 = piece.x - piece.sx / 2 + 0.5;
    const z0 = piece.z - piece.sy / 2 + 0.5;

    // 父块当前真正露出来的 UV（含 sy≈ah 时铺满整图高度的特殊情况）
    const parentUV = this.pieceUV(piece.sx, piece.sy, aw, ah, piece.offsetX, piece.offsetZ);

    const gid = piece.groupId;
    const gkey = String(gid);
    if (gid) {
      this.groupExpected[gkey] = Math.max(1, (this.groupExpected[gkey] || 1) - 1 + sx * sy);
    }

    piece.alive = false;
    piece.node.destroy();
    let nid = this.pieces.reduce((m, p) => Math.max(m, p.id), 0) + 1;

    for (let ix = 0; ix < sx; ix++) {
      for (let iz = 0; iz < sy; iz++) {
        // 显示：把父块 UV 均分；小 z 在屏幕上方 → 对应纹理高 v（图上方）
        const cellU0 = parentUV.u0 + (parentUV.u1 - parentUV.u0) * (ix / sx);
        const cellU1 = parentUV.u0 + (parentUV.u1 - parentUV.u0) * ((ix + 1) / sx);
        const cellV0 = parentUV.v0 + (parentUV.v1 - parentUV.v0) * ((sy - iz - 1) / sy);
        const cellV1 = parentUV.v0 + (parentUV.v1 - parentUV.v0) * ((sy - iz) / sy);

        // 拼合：offset 跟棋盘几何位置走
        const cellOffX = piece.offsetX - piece.sx / 2 + 0.5 + ix;
        const cellOffZ = piece.offsetZ - piece.sy / 2 + 0.5 + iz;

        const bi: BlockInstance = {
          spriteName: piece.sprite || 'None',
          materialName: piece.material,
          position: { x: x0 + ix, y: 0, z: z0 + iz },
          size: { x: aw, y: ah },
          offset: { x: cellOffX, y: cellOffZ },
          groupId: gid,
          directName: 'None', IceTime: 0, key: 0, chain: 0,
        };
        const np = await this.makePiece(
          bi, 1, 1, 'Single', nid++, [aw, ah],
          { u0: cellU0, u1: cellU1, v0: cellV0, v1: cellV1 },
        );
        np.groupId = gid;
        this.pieces.push(np);
      }
    }
    this.markEliminable();
  }
}
