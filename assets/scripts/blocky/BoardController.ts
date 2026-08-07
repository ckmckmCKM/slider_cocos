import {
  Color, EventTouch, Graphics, Label, Mask, Node, Sprite, SpriteFrame, Tween, UIOpacity, UITransform,
  Vec3, tween,
} from 'cc';
import { BOARD_MAX_H, BOARD_MAX_W, CELL } from '../utils/Constants';
import { colorFromHex, shadeHex } from '../utils/Helpers';
import { ResCache } from '../utils/ResCache';
import { SoundMgr } from '../utils/SoundMgr';
import { addLabel, makeNode, setSprite } from '../utils/UIFactory';
import { ArrowDirection, MechanicType, TypeEnvironment, colorHex, hasMechanic } from './Enums';
import {
  ColorPathRuntime, GrinderRuntime, RollerRuntime, RotatorRuntime, TunnelRuntime, WoodenBoxRuntime,
  colorFlagBits, grinderCells, rotateCellCW, rotatorArmCells,
  spawnColorPathVisual, spawnGrinderVisual, spawnRoller, spawnRotator, spawnTunnelVisual, spawnWoodenBox,
} from './EnvHelpers';
import { DEFAULT_ICON_BG, pictureResourcePath, iconBgResourcePath } from './LevelParser';
import { LevelConfig, PictureData, PortalData, ShapePictureData, Vec2I } from './LevelTypes';

export interface Piece {
  id: number;
  node: Node;
  cells: Vec2I[];
  /** 开局 listPos，隧道弹出落点 */
  spawnCells: Vec2I[];
  picIndices: number[];
  idPanelPicture: number;
  color: number;
  mechanic: number;
  arrow: ArrowDirection;
  isObstacle: boolean;
  ice: number;
  lock: number;
  timeBomb: number;
  bombLeft: number;
  mystery: number;
  idCombineds: number[];
  idLayered: number;
  /** ColorBlock 剩余绳颜色 flags */
  colorBlock: number;
  alive: boolean;
  matchable: boolean;
  /** 藏在隧道队列中 */
  inTunnel: boolean;
  /** 双层：被压在下层，尚未解锁 */
  hiddenUnder: boolean;
  /** 被木箱/卷帘门困住 */
  contained: boolean;
  iceLabel?: Label | null;
  lockLabel?: Label | null;
  bombLabel?: Label | null;
  ropeLabel?: Label | null;
}

export interface BoardCallbacks {
  onHud: () => void;
  onGoals: () => void;
  onWin: () => void;
  onLose: (reason: 'time' | 'bomb') => void;
  onToast: (msg: string) => void;
  onPictureComplete?: (picId: number) => void;
}

interface WallIceRuntime {
  pos: Vec2I;
  num: number;
  node: Node;
  label: Label;
}

interface ShapePoint {
  x: number;
  y: number;
}


export class BoardController {
  root: Node;
  pieces: Piece[] = [];
  decor: Node[] = [];
  pictures: PictureData[] = [];
  completedPics = new Set<number>();
  wallIce: WallIceRuntime[] = [];
  portals: PortalData[] = [];
  tunnels: TunnelRuntime[] = [];
  woodenBoxes: WoodenBoxRuntime[] = [];
  grinders: GrinderRuntime[] = [];
  rollers: RollerRuntime[] = [];
  rotators: RotatorRuntime[] = [];
  colorPaths: ColorPathRuntime[] = [];
  board: TypeEnvironment[][] = [];
  levelIndex = 1;
  timeLeft = 0;
  running = false;
  levelDone = false;
  loseReason: 'time' | 'bomb' | null = null;
  tools = { freeze: 2, magnet: 2, slicer: 3, teleport: 1 };
  activeTool: string | null = null;
  frozenTimer = 0;
  cell = CELL;
  private drag: {
    piece: Piece;
    group: Piece[];
    picGroup: Piece[];
    startCells: Vec2I[][];
    ox: number;
    oy: number;
    moved: boolean;
    highlights: Node[];
    trails: Node[];
    touchRing: Node | null;
    lastBlockAt: number;
  } | null = null;
  private autoCompleting = false;
  private lastMoveDelta = { x: 0, y: 0 };
  private origin = new Vec3(0, 0, 0);
  private playMin = { x: 0, y: 0 };
  private playMax = { x: 0, y: 0 };
  /** 可玩区 grid 中心，用于 Y 轴映射（Unity：y 越大越靠上） */
  private playCenter = { x: 0, y: 0 };
  private cb: BoardCallbacks;
  private teleportFirst: Piece | null = null;
  private picMap = new Map<number, PictureData>();

  constructor(root: Node, cb: BoardCallbacks) {
    this.root = root;
    this.cb = cb;
    this.root.on(Node.EventType.TOUCH_START, this.onDown, this);
    this.root.on(Node.EventType.TOUCH_MOVE, this.onMove, this);
    this.root.on(Node.EventType.TOUCH_END, this.onUp, this);
    this.root.on(Node.EventType.TOUCH_CANCEL, this.onUp, this);
  }

  clear() {
    for (const p of this.pieces) {
      if (p.node?.isValid) p.node.destroy();
    }
    for (const d of this.decor) {
      if (d?.isValid) d.destroy();
    }
    this.pieces = [];
    this.decor = [];
    this.wallIce = [];
    this.portals = [];
    this.tunnels = [];
    this.woodenBoxes = [];
    this.grinders = [];
    this.rollers = [];
    this.rotators = [];
    this.colorPaths = [];
    this.pictures = [];
    this.completedPics.clear();
    this.drag = null;
    this.autoCompleting = false;
    this.teleportFirst = null;
    this.board = [];
    this.loseReason = null;
    this.picMap.clear();
  }


  async startLevel(idx: number, lvl: LevelConfig) {
    this.clear();
    this.levelIndex = idx;
    this.levelDone = false;
    this.running = true;
    this.activeTool = null;
    this.frozenTimer = 0;
    this.timeLeft = lvl.timeLimit || 180;
    // 深拷贝，避免 ensureGround 改写 ResCache 缓存
    const level = JSON.parse(JSON.stringify(lvl)) as LevelConfig;
    this.pictures = level.listPictureData.slice();
    this.picMap = new Map(level.listPictureData.map((p) => [p.id, p]));
    this.board = level.board;
    await this.buildBoard(level);
    this.applyLayeredHidden();
    this.applyContainedFlags();
    this.tryThrowTunnels();
    this.checkAllPictures();
    this.cb.onHud();
    this.cb.onGoals();
  }

  remainingPictures(): number {
    return this.pictures.filter((p) => !this.completedPics.has(p.id)).length;
  }

  goals(): { id: number; path: string; done: boolean }[] {
    return this.pictures.map((p) => ({
      id: p.id,
      path: pictureResourcePath(p.nameFilePicture),
      done: this.completedPics.has(p.id),
    }));
  }

  tick(dt: number) {
    if (!this.running || this.levelDone) return;
    if (this.frozenTimer > 0) {
      this.frozenTimer -= dt;
    } else {
      this.timeLeft -= dt;
    }
    this.tickBombs(dt);
    this.cb.onHud();
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.fail('time');
    }
  }

  keepPlaying(extraSec: number) {
    this.timeLeft = Math.max(this.timeLeft, 0) + extraSec;
    this.levelDone = false;
    this.running = true;
    this.loseReason = null;
    this.cb.onHud();
  }

  keepPlayingBomb() {
    for (const p of this.pieces) {
      if (!p.alive || p.timeBomb <= 0) continue;
      p.bombLeft = Math.max(p.bombLeft, p.timeBomb);
      if (p.bombLabel) p.bombLabel.string = String(Math.ceil(p.bombLeft));
    }
    this.levelDone = false;
    this.running = true;
    this.loseReason = null;
    this.cb.onHud();
  }

  useFreeze() {
    if (this.tools.freeze <= 0 || !this.running) return;
    this.tools.freeze--;
    this.frozenTimer = 15;
    SoundMgr.play('time');
    this.cb.onToast('冻结 15 秒');
    this.cb.onHud();
  }

  setActiveTool(kind: string | null) {
    this.activeTool = kind;
    this.teleportFirst = null;
  }

  // ─── build ───────────────────────────────────────────

  private async buildBoard(lvl: LevelConfig) {
    const ground = this.collectGround(lvl.board).map((c) => ({ ...c }));
    // 仅补方块占用格（双层块等 spawn 可能在 Ground 外），不填实心包围盒
    for (const s of lvl.listShapePictureData) {
      for (const p of s.listPos) {
        if (!ground.some((g) => g.x === p.x && g.y === p.y)) ground.push({ x: p.x, y: p.y });
        this.ensureGround(p.x, p.y);
      }
    }
    if (!ground.length) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const c of ground) {
      minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x);
      minY = Math.min(minY, c.y); maxY = Math.max(maxY, c.y);
    }
    this.playMin = { x: minX, y: minY };
    this.playMax = { x: maxX, y: maxY };
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    this.cell = Math.max(36, Math.floor(Math.min(
      BOARD_MAX_W / (bw + 1.2),
      BOARD_MAX_H / (bh + 1.2),
      110,
    )));
    const C = this.cell;
    const cxm = (minX + maxX) / 2;
    const cym = (minY + maxY) / 2;
    this.playCenter = { x: cxm, y: cym };
    this.origin.set(-cxm * C, 0, 0);

    const frameW = (bw + 0.88) * C;
    const frameH = (bh + 0.88) * C;
    const innerW = (bw + 0.14) * C;
    const innerH = (bh + 0.14) * C;
    const tray = makeNode('tray', this.root, frameW, frameH);
    const tg = tray.addComponent(Graphics);

    tg.fillColor = new Color(30, 12, 8, 155);
    tg.roundRect(-frameW / 2, -frameH / 2 - C * 0.07, frameW, frameH, C * 0.24);
    tg.fill();

    tg.fillColor = colorFromHex('#7b4028');
    tg.roundRect(-frameW / 2, -frameH / 2, frameW, frameH, C * 0.24);
    tg.fill();
    tg.strokeColor = colorFromHex('#3a1b12');
    tg.lineWidth = Math.max(6, C * 0.075);
    tg.roundRect(-frameW / 2, -frameH / 2, frameW, frameH, C * 0.24);
    tg.stroke();

    const bevelInset = C * 0.095;
    tg.strokeColor = colorFromHex('#b96a45');
    tg.lineWidth = Math.max(3, C * 0.045);
    tg.roundRect(
      -frameW / 2 + bevelInset,
      -frameH / 2 + bevelInset,
      frameW - bevelInset * 2,
      frameH - bevelInset * 2,
      C * 0.18,
    );
    tg.stroke();

    tg.fillColor = colorFromHex('#35180f');
    tg.roundRect(-innerW / 2, -innerH / 2, innerW, innerH, C * 0.1);
    tg.fill();
    tg.strokeColor = colorFromHex('#24100b');
    tg.lineWidth = Math.max(4, C * 0.055);
    tg.roundRect(-innerW / 2, -innerH / 2, innerW, innerH, C * 0.1);
    tg.stroke();
    this.decor.push(tray);

    const [cellFace, cellBack] = await Promise.all([
      ResCache.uiBr('UI_ingame_gach'),
      ResCache.uiBr('UI_ingame_gach1'),
    ]);
    const seen = new Set<string>();
    for (const c of ground) {
      const k = `${c.x},${c.y}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const cell = makeNode('cell', this.root, C * 0.96, C * 0.96);
      cell.setPosition(this.gridToLocal(c.x, c.y));
      if (cellFace && cellBack) {
        setSprite(cell, cellBack);
        setSprite(makeNode('face', cell, C * 0.94, C * 0.94), cellFace);
      } else {
        const g = cell.addComponent(Graphics);
        g.fillColor = new Color(28, 10, 7, 150);
        g.roundRect(-C * 0.47, -C * 0.47 - C * 0.025, C * 0.94, C * 0.94, C * 0.075);
        g.fill();
        g.fillColor = colorFromHex('#582d1e');
        g.roundRect(-C * 0.47, -C * 0.47, C * 0.94, C * 0.94, C * 0.075);
        g.fill();
        g.strokeColor = new Color(126, 70, 45, 150);
        g.lineWidth = Math.max(1.5, C * 0.018);
        g.roundRect(-C * 0.47, -C * 0.47, C * 0.94, C * 0.94, C * 0.075);
        g.stroke();
      }
      this.decor.push(cell);
    }

    // color paths
    this.colorPaths = [];
    for (const cp of lvl.listColorPathData) {
      this.colorPaths.push(spawnColorPathVisual(this.root, cp, (x, y) => this.gridToLocal(x, y), C, this.decor));
    }

    // wall ice
    for (const w of lvl.listWallIceData) {
      await this.spawnWallIce(w.pos, w.num);
    }

    this.portals = lvl.listPortalData.slice();
    for (const p of lvl.listPortalData) {
      this.spawnMarker(p.pos, colorHex(p.color), 'P');
    }

    this.grinders = [];
    for (const g of lvl.listGrinderData) {
      this.grinders.push(spawnGrinderVisual(this.root, g, (x, y) => this.gridToLocal(x, y), C, this.decor));
    }

    this.tunnels = [];
    const tunnelIds = new Set<number>();
    for (const t of lvl.listTunnelData) {
      const rt = spawnTunnelVisual(this.root, t, (x, y) => this.gridToLocal(x, y), C, this.decor);
      this.tunnels.push(rt);
      for (const id of t.listIdBlock) tunnelIds.add(id);
    }

    this.rollers = [];
    for (const r of lvl.listRollerDoorData) {
      this.rollers.push(spawnRoller(this.root, r, (x, y) => this.gridToLocal(x, y), C, this.decor));
    }

    this.rotators = [];
    for (const r of lvl.listRotatorData) {
      this.rotators.push(spawnRotator(this.root, r, (x, y) => this.gridToLocal(x, y), C, this.decor));
    }

    this.woodenBoxes = [];
    for (const b of lvl.listWoodenBoxData) {
      this.woodenBoxes.push(spawnWoodenBox(this.root, b, (x, y) => this.gridToLocal(x, y), C, this.decor));
    }

    for (const s of lvl.listShapePictureData) {
      const piece = await this.makePiece(s, this.picMap.get(s.idPanelPicture) || null);
      if (tunnelIds.has(s.id)) {
        piece.inTunnel = true;
        piece.node.active = false;
      }
      this.pieces.push(piece);
    }
  }

  private collectGround(board: TypeEnvironment[][]): Vec2I[] {
    const out: Vec2I[] = [];
    for (let y = 0; y < board.length; y++) {
      const row = board[y];
      for (let x = 0; x < row.length; x++) {
        if (row[x] === TypeEnvironment.Ground) out.push({ x, y });
      }
    }
    return out;
  }

  /** 保证 (x,y) 可走；必要时扩展 board 数组 */
  private ensureGround(x: number, y: number) {
    if (y < 0 || x < 0) return;
    while (this.board.length <= y) this.board.push([]);
    const row = this.board[y];
    while (row.length <= x) row.push(TypeEnvironment.Block);
    row[x] = TypeEnvironment.Ground;
  }

  private spawnMarker(pos: Vec2I, hex: string, tag: string) {
    const C = this.cell;
    const n = makeNode(`m_${tag}`, this.root, C * 0.55, C * 0.55);
    n.setPosition(this.gridToLocal(pos.x, pos.y));
    const g = n.addComponent(Graphics);
    g.fillColor = colorFromHex(hex);
    g.circle(0, 0, C * 0.22);
    g.fill();
    addLabel(makeNode('t', n, C * 0.5, C * 0.4), tag, 16, '#ffffff');
    this.decor.push(n);
  }

  private async spawnWallIce(pos: Vec2I, num: number) {
    const C = this.cell;
    const n = makeNode('wallIce', this.root, C * 0.95, C * 0.95);
    n.setPosition(this.gridToLocal(pos.x, pos.y));
    const g = n.addComponent(Graphics);
    g.fillColor = new Color(180, 220, 255, 200);
    g.roundRect(-C * 0.45, -C * 0.45, C * 0.9, C * 0.9, 6);
    g.fill();
    const label = addLabel(makeNode('txt', n, C * 0.8, C * 0.5), String(num), 22, '#0d47a1');
    this.wallIce.push({ pos: { ...pos }, num, node: n, label });
    this.decor.push(n);
  }

  private async makePiece(s: ShapePictureData, pic: PictureData | null): Promise<Piece> {
    const C = this.cell;
    const cells = s.listPos.map((p) => ({ x: p.x, y: p.y }));
    const matchable = !s.isObstacle && s.idPanelPicture >= 0 && s.listIndexPicture.some((i) => i >= 0);
    const hex = s.isObstacle
      ? (hasMechanic(s.mechanic, MechanicType.Stone) ? '#78909c' : hasMechanic(s.mechanic, MechanicType.Wooden) ? '#a67c52' : '#8a4a2a')
      : colorHex(s.color);


    const xs = cells.map((c) => c.x);
    const ys = cells.map((c) => c.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pw = (maxX - minX + 1) * C;
    const ph = (maxY - minY + 1) * C;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const node = makeNode(`piece_${s.id}`, this.root, pw, ph);
    node.setPosition(this.gridToLocal(cx, cy));

    const rawLoops = this.shapeBoundaryLoops(cells, cx, cy, C);
    const shapeInset = C * 0.045;
    const loops = this.insetBoundaryLoops(rawLoops, shapeInset);
    const cornerRadius = C * 0.2;

    const shadowNode = makeNode('shadow', node, pw, ph);
    const shadow = shadowNode.addComponent(Graphics);
    shadow.fillColor = colorFromHex(shadeHex(hex, 0.27), 235);
    // Keep the same horizontal footprint as the visible surface. Thickness is a
    // downward extrusion only; expanding all sides leaves an unwanted vertical
    // strip along the left edge of tall pieces.
    this.appendRoundedLoops(shadow, loops, cornerRadius, 0, -C * 0.085);
    shadow.fill();

    const clipNode = makeNode('contentMask', node, pw, ph);
    const clipMask = clipNode.addComponent(Mask);
    clipMask.type = Mask.Type.GRAPHICS_STENCIL;
    const stencil = clipMask.subComp as Graphics;
    stencil.fillColor = Color.WHITE;
    this.appendRoundedLoops(stencil, loops, cornerRadius);
    stencil.fill();

    const surfaceNode = makeNode('surface', clipNode, pw, ph);
    const surface = surfaceNode.addComponent(Graphics);
    surface.fillColor = colorFromHex(hex);
    this.appendRoundedLoops(surface, loops, cornerRadius);
    surface.fill();

    const outlineNode = makeNode('outline', node, pw, ph);
    const outline = outlineNode.addComponent(Graphics);
    outline.strokeColor = colorFromHex(shadeHex(hex, 0.48));
    outline.lineWidth = Math.max(1.2, C * 0.02);
    this.appendRoundedLoops(outline, loops, cornerRadius);
    outline.stroke();
    outline.strokeColor = new Color(255, 255, 255, 125);
    outline.lineWidth = Math.max(1.1, C * 0.016);
    outline.lineCap = Graphics.LineCap.ROUND;
    this.appendTopHighlights(outline, loops, cornerRadius);
    outline.stroke();

    if (matchable && pic) {
      const iconBgName = pic.nameIconBg || DEFAULT_ICON_BG;
      const [sf, glassSf, bgSf] = await Promise.all([
        ResCache.loadSprite(pictureResourcePath(pic.nameFilePicture)),
        ResCache.uiBr('RoundBoxGlass'),
        ResCache.loadSprite(iconBgResourcePath(iconBgName)),
      ]);
      if (sf) {
        const pictureNode = makeNode('picture', node, pw, ph);
        const pictureMask = pictureNode.addComponent(Mask);
        pictureMask.type = Mask.Type.GRAPHICS_STENCIL;
        const pictureStencil = pictureNode.getComponent(Graphics)!;
        pictureStencil.clear();
        pictureStencil.fillColor.fromHEX('#ff0000');
        this.appendRoundedLoops(pictureStencil, loops, cornerRadius);
        pictureStencil.fill();
        if (bgSf) {
          this.placePieceIconBg(pictureNode, bgSf, pw, ph);
        }
        if (glassSf) {
          this.placePieceGlassFrame(pictureNode, glassSf, pw, ph);
        }
        this.placePiecePictureStencil(
          pictureNode, sf, pic, cells, s.listIndexPicture, cx, cy, C,
        );
      }
    }

    const piece: Piece = {
      id: s.id,
      node,
      cells,
      spawnCells: cells.map((c) => ({ ...c })),
      picIndices: s.listIndexPicture.slice(),
      idPanelPicture: s.idPanelPicture,
      color: s.color,
      mechanic: s.mechanic,
      arrow: s.arrowDirection,
      isObstacle: s.isObstacle,
      ice: s.numberIce,
      lock: s.numberLock,
      timeBomb: s.timeBomb,
      bombLeft: s.timeBomb,
      mystery: s.numberMystery,
      idCombineds: s.idCombineds.slice(),
      idLayered: s.idLayered,
      colorBlock: s.colorBlock || 0,
      alive: true,
      matchable,
      inTunnel: false,
      hiddenUnder: false,
      contained: false,
    };

    this.applyOverlayIcons(piece, C);
    return piece;
  }

  /** 按实际占用格贴图（非整块包围盒），L/T 等异形才不会「填满缺角」 */
  private shapeBoundaryLoops(cells: Vec2I[], cx: number, cy: number, C: number): ShapePoint[][] {
    type Edge = { a: [number, number]; b: [number, number]; used: boolean };
    const occupied = new Set(cells.map((c) => `${c.x},${c.y}`));
    const edges: Edge[] = [];
    const add = (ax: number, ay: number, bx: number, by: number) => {
      edges.push({ a: [ax, ay], b: [bx, by], used: false });
    };
    for (const c of cells) {
      const x = c.x * 2;
      const y = c.y * 2;
      if (!occupied.has(`${c.x},${c.y - 1}`)) add(x - 1, y - 1, x + 1, y - 1);
      if (!occupied.has(`${c.x + 1},${c.y}`)) add(x + 1, y - 1, x + 1, y + 1);
      if (!occupied.has(`${c.x},${c.y + 1}`)) add(x + 1, y + 1, x - 1, y + 1);
      if (!occupied.has(`${c.x - 1},${c.y}`)) add(x - 1, y + 1, x - 1, y - 1);
    }

    const byStart = new Map<string, Edge[]>();
    for (const edge of edges) {
      const key = `${edge.a[0]},${edge.a[1]}`;
      const list = byStart.get(key) || [];
      list.push(edge);
      byStart.set(key, list);
    }

    const loops: ShapePoint[][] = [];
    for (const first of edges) {
      if (first.used) continue;
      const points: [number, number][] = [];
      let edge: Edge | undefined = first;
      const startKey = `${first.a[0]},${first.a[1]}`;
      while (edge && !edge.used) {
        edge.used = true;
        points.push(edge.a);
        const nextKey = `${edge.b[0]},${edge.b[1]}`;
        if (nextKey === startKey) break;
        edge = (byStart.get(nextKey) || []).find((candidate) => !candidate.used);
      }
      if (points.length >= 3) {
        const mapped = points.map(([x, y]) => ({
          x: (x / 2 - cx) * C,
          y: (y / 2 - cy) * C,
        }));
        // Adjacent occupied cells leave intermediate vertices on an otherwise
        // straight boundary. Rounding those vertices creates a visible crease at
        // the cell seam, so retain only actual direction changes.
        const simplified = mapped.filter((point, i) => {
          const prev = mapped[(i - 1 + mapped.length) % mapped.length];
          const next = mapped[(i + 1) % mapped.length];
          const inX = point.x - prev.x;
          const inY = point.y - prev.y;
          const outX = next.x - point.x;
          const outY = next.y - point.y;
          const cross = inX * outY - inY * outX;
          const dot = inX * outX + inY * outY;
          return Math.abs(cross) >= 0.001 || dot <= 0;
        });
        if (simplified.length >= 3) loops.push(simplified);
      }
    }
    return loops;
  }

  private insetBoundaryLoops(loops: ShapePoint[][], inset: number): ShapePoint[][] {
    const leftNormal = (from: ShapePoint, to: ShapePoint): ShapePoint => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
      return { x: -dy / length, y: dx / length };
    };
    return loops.map((loop) => loop.map((point, i) => {
      const prev = loop[(i - 1 + loop.length) % loop.length];
      const next = loop[(i + 1) % loop.length];
      const incoming = leftNormal(prev, point);
      const outgoing = leftNormal(point, next);
      const inDx = point.x - prev.x;
      const inDy = point.y - prev.y;
      const outDx = next.x - point.x;
      const outDy = next.y - point.y;
      const cross = inDx * outDy - inDy * outDx;
      if (Math.abs(cross) < 0.001) {
        return { x: point.x + outgoing.x * inset, y: point.y + outgoing.y * inset };
      }
      return {
        x: point.x + (incoming.x + outgoing.x) * inset,
        y: point.y + (incoming.y + outgoing.y) * inset,
      };
    }));
  }

  private appendRoundedLoops(
    g: Graphics,
    loops: ShapePoint[][],
    radius: number,
    offsetX = 0,
    offsetY = 0,
  ) {
    const toward = (from: ShapePoint, to: ShapePoint, distance: number): ShapePoint => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
      const scale = Math.min(distance, length * 0.45) / length;
      return { x: from.x + dx * scale + offsetX, y: from.y + dy * scale + offsetY };
    };
    for (const loop of loops) {
      if (loop.length < 3) continue;
      const first = loop[0];
      const previous = loop[loop.length - 1];
      const start = toward(first, previous, radius);
      g.moveTo(start.x, start.y);
      for (let i = 0; i < loop.length; i++) {
        const vertex = loop[i];
        const prev = loop[(i - 1 + loop.length) % loop.length];
        const next = loop[(i + 1) % loop.length];
        const before = toward(vertex, prev, radius);
        const after = toward(vertex, next, radius);
        g.lineTo(before.x, before.y);
        g.quadraticCurveTo(vertex.x + offsetX, vertex.y + offsetY, after.x, after.y);
      }
      g.close();
    }
  }

  /** Draw the normal glossy highlight on upward-facing edges only. */
  private appendTopHighlights(g: Graphics, loops: ShapePoint[][], cornerRadius: number) {
    for (const loop of loops) {
      for (let i = 0; i < loop.length; i++) {
        const from = loop[i];
        const to = loop[(i + 1) % loop.length];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        // Boundary loops are clockwise: screen-top horizontal edges run right-to-left.
        if (Math.abs(dy) >= 0.001 || dx >= 0) continue;
        const pad = Math.min(cornerRadius * 0.72, Math.abs(dx) * 0.22);
        g.moveTo(from.x - pad, from.y);
        g.lineTo(to.x + pad, to.y);
      }
    }
  }

  /** 九宫格碎图底：置于 picture 内最底层，随拼块包围盒拉伸 */
  private placePieceIconBg(parent: Node, sf: SpriteFrame, pw: number, ph: number) {
    // 保护圆角与角落网点；纹理约 315²
    sf.insetTop = 56;
    sf.insetBottom = 56;
    sf.insetLeft = 56;
    sf.insetRight = 56;
    const bg = makeNode('pieceBg', parent, pw, ph);
    const sp = setSprite(bg, sf);
    sp.type = Sprite.Type.SLICED;
    sp.trim = false;
  }

  /** 九宫格玻璃顶光框：置于 picture 内、image 之下，随拼块包围盒拉伸 */
  private placePieceGlassFrame(parent: Node, sf: SpriteFrame, pw: number, ph: number) {
    sf.insetTop = 36;
    sf.insetBottom = 8;
    sf.insetLeft = 12;
    sf.insetRight = 12;
    const glass = makeNode('glassFrame', parent, pw, ph);
    const sp = setSprite(glass, sf);
    sp.type = Sprite.Type.SLICED;
    sp.trim = false;
  }

  private placePiecePictureStencil(
    parent: Node,
    sf: SpriteFrame,
    pic: PictureData,
    cells: Vec2I[],
    indices: number[],
    cx: number,
    cy: number,
    C: number,
  ) {
    const first = indices.findIndex((idx) => idx >= 0);
    if (first < 0 || !cells[first]) return;

    const firstIdx = indices[first];
    const firstCell = cells[first];
    const logicalCol = firstIdx % pic.width;
    const logicalRow = Math.floor(firstIdx / pic.width);
    const textureCol = pic.isFlipX ? pic.width - 1 - logicalCol : logicalCol;
    const textureRow = pic.isFlipY ? logicalRow : pic.height - 1 - logicalRow;
    const cellX = (firstCell.x - cx) * C;
    const cellY = (firstCell.y - cy) * C;
    const imageX = cellX + C * (pic.width / 2 - textureCol - 0.5);
    const imageY = cellY + C * (textureRow + 0.5 - pic.height / 2);
    const pictureScale = 0.86;

    // A single full picture is positioned from the first fragment mapping.
    // The parent GRAPHICS_STENCIL performs all outer and concave clipping.
    const image = makeNode('image', parent, pic.width * C * pictureScale, pic.height * C * pictureScale);
    image.setPosition(imageX, imageY, 0);
    const sprite = setSprite(image, sf);
    sprite.trim = false;
    // 层级：pieceBg → glassFrame → image
    const bg = parent.getChildByName('pieceBg');
    const glass = parent.getChildByName('glassFrame');
    if (bg) bg.setSiblingIndex(0);
    if (glass) glass.setSiblingIndex(bg ? 1 : 0);
  }

  private placePiecePicture(
    parent: Node,
    sf: SpriteFrame,
    pic: PictureData,
    cells: Vec2I[],
    indices: number[],
    cx: number,
    cy: number,
    C: number,
    loops: ShapePoint[][],
    cornerRadius: number,
  ) {
    const w = pic.width;
    const h = pic.height;
    // 略重叠消缝；只画有碎片的格
    const first = indices.findIndex((idx) => idx >= 0);
    if (first < 0 || !cells[first]) return;
    const firstIdx = indices[first];
    const firstCell = cells[first];
    const firstCol = firstIdx % w;
    const firstRow = Math.floor(firstIdx / w);
    const firstTexRow = pic.isFlipY ? firstRow : (h - 1 - firstRow);
    const firstTexCol = pic.isFlipX ? (w - 1 - firstCol) : firstCol;
    const firstX = (firstCell.x - cx) * C;
    const firstY = (firstCell.y - cy) * C;
    const imageCenterX = firstX + C * (w / 2 - firstTexCol - 0.5);
    const imageCenterY = firstY + C * (firstTexRow + 0.5 - h / 2);
    const pictureScale = 0.86;
    for (let i = 0; i < cells.length; i++) {
      const idx = indices[i];
      if (idx < 0) continue;
      const c = cells[i];
      const lx = (c.x - cx) * C;
      const ly = (c.y - cy) * C;
      // Unity：grid y 增大 = 图片 row 增大；屏幕 y 向上 = row 向上
      // 纹理 row0 在图顶部，需映射 texRow = h-1-row（isFlipY 时再反一次）
      const maskNode = makeNode(`frag_${i}`, parent, C + 2, C + 2);
      maskNode.setPosition(lx, ly, 0);
      const mask = maskNode.addComponent(Mask);
      mask.type = Mask.Type.GRAPHICS_STENCIL;
      const rectStencil = mask.subComp as Graphics;
      rectStencil.fillColor = Color.WHITE;
      rectStencil.rect(-C * 0.5 - 1, -C * 0.5 - 1, C + 2, C + 2);
      rectStencil.fill();

      // The outer cell mask prevents bleed; the nested mask reuses the exact outline path.
      const curveNode = makeNode('outlineClip', maskNode, C + 2, C + 2);
      const curveMask = curveNode.addComponent(Mask);
      curveMask.type = Mask.Type.GRAPHICS_STENCIL;
      const curveStencil = curveMask.subComp as Graphics;
      curveStencil.fillColor = Color.WHITE;
      this.appendRoundedLoops(curveStencil, loops, cornerRadius, -lx, -ly);
      curveStencil.fill();

      const img = makeNode('img', curveNode, w * C * pictureScale, h * C * pictureScale);
      img.setPosition(imageCenterX - lx, imageCenterY - ly, 0);
      setSprite(img, sf);
    }
  }

  private applyOverlayIcons(piece: Piece, C: number) {
    if (piece.ice > 0) {
      const n = makeNode('ice', piece.node, C * 0.5, C * 0.5);
      n.setPosition(0, C * 0.15, 0);
      const g = n.addComponent(Graphics);
      g.fillColor = new Color(180, 220, 255, 180);
      g.circle(0, 0, C * 0.2);
      g.fill();
      piece.iceLabel = addLabel(makeNode('txt', n, C * 0.4, C * 0.4), String(piece.ice), 18, '#0d47a1');
    }
    if (piece.lock > 0) {
      const n = makeNode('lock', piece.node, C * 0.45, C * 0.45);
      n.setPosition(0, -C * 0.15, 0);
      const g = n.addComponent(Graphics);
      g.fillColor = colorFromHex('#ffd54f');
      g.roundRect(-C * 0.18, -C * 0.18, C * 0.36, C * 0.36, 4);
      g.fill();
      piece.lockLabel = addLabel(makeNode('txt', n, C * 0.4, C * 0.4), String(piece.lock), 16, '#5d4037');
    }
    if (piece.timeBomb > 0) {
      const n = makeNode('bomb', piece.node, C * 0.5, C * 0.5);
      n.setPosition(C * 0.2, C * 0.2, 0);
      const g = n.addComponent(Graphics);
      g.fillColor = colorFromHex('#c62828');
      g.circle(0, 0, C * 0.18);
      g.fill();
      piece.bombLabel = addLabel(makeNode('txt', n, C * 0.4, C * 0.4), String(Math.ceil(piece.bombLeft)), 16, '#ffffff');
    }
    if (hasMechanic(piece.mechanic, MechanicType.Pinned)) {
      const n = makeNode('pin', piece.node, C * 0.3, C * 0.3);
      const g = n.addComponent(Graphics);
      g.fillColor = colorFromHex('#37474f');
      g.circle(0, 0, C * 0.1);
      g.fill();
    }
    if (piece.arrow === ArrowDirection.Horizontal || piece.arrow === ArrowDirection.Vertical) {
      const n = makeNode('arrow', piece.node, C * 0.4, C * 0.4);
      n.setPosition(0, -C * 0.35, 0);
      addLabel(makeNode('txt', n, C * 0.4, C * 0.4), piece.arrow === ArrowDirection.Horizontal ? '↔' : '↕', 20, '#ffffff');
    }
    if (piece.colorBlock > 0) {
      const n = makeNode('rope', piece.node, C * 0.7, C * 0.35);
      n.setPosition(0, C * 0.4, 0);
      const g = n.addComponent(Graphics);
      g.fillColor = colorFromHex('#5d4037');
      g.roundRect(-C * 0.32, -C * 0.14, C * 0.64, C * 0.28, 6);
      g.fill();
      const bits = colorFlagBits(piece.colorBlock);
      piece.ropeLabel = addLabel(makeNode('txt', n, C * 0.6, C * 0.28), `绳×${bits.length}`, 14, '#ffe082');
    }
  }

  private gridToLocal(x: number, y: number): Vec3 {
    const C = this.cell;
    return new Vec3(
      this.origin.x + x * C,
      (y - this.playCenter.y) * C,
      0,
    );
  }

  private localToGrid(lx: number, ly: number): { x: number; y: number } {
    const C = this.cell;
    return {
      x: (lx - this.origin.x) / C,
      y: ly / C + this.playCenter.y,
    };
  }

  private syncPieceNode(piece: Piece) {
    const xs = piece.cells.map((c) => c.x);
    const ys = piece.cells.map((c) => c.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    piece.node.setPosition(this.gridToLocal(cx, cy));
  }

  // ─── input ───────────────────────────────────────────

  private onDown(e: EventTouch) {
    if (!this.running || this.levelDone || this.autoCompleting) return;
    const ui = e.getUILocation();
    const ut = this.root.getComponent(UITransform)!;
    const local = ut.convertToNodeSpaceAR(new Vec3(ui.x, ui.y, 0));

    // 旋转器优先：点中心旋转
    if (!this.activeTool && this.tryClickRotator(local.x, local.y)) return;

    const piece = this.hitTest(local.x, local.y);
    if (!piece) return;

    if (this.activeTool) {
      this.useToolOn(this.activeTool, piece);
      return;
    }

    if (!this.canMove(piece)) {
      this.playTapReject(piece);
      return;
    }
    const group = this.getMoveGroup(piece);
    const picGroup = this.getPictureGroup(piece);
    for (const p of group) {
      p.node.setSiblingIndex(this.root.children.length - 1);
      Tween.stopAllByTarget(p.node);
      p.node.setScale(1, 1, 1);
      tween(p.node).to(0.07, { scale: new Vec3(1.04, 1.04, 1) }).start();
    }
    // 同图碎片一起抬到上层，描边盖住整张图的外轮廓
    for (const p of picGroup) {
      if (group.indexOf(p) >= 0) continue;
      p.node.setSiblingIndex(Math.max(0, this.root.children.length - 1 - group.length));
    }
    const highlights = this.addPictureHighlights(picGroup);
    const touchRing = this.createTouchRing(local.x, local.y);
    this.drag = {
      piece,
      group,
      picGroup,
      startCells: group.map((p) => p.cells.map((c) => ({ ...c }))),
      ox: local.x,
      oy: local.y,
      moved: false,
      highlights,
      trails: [],
      touchRing,
      lastBlockAt: 0,
    };
  }

  private onMove(e: EventTouch) {
    if (!this.drag) return;
    const ui = e.getUILocation();
    const ut = this.root.getComponent(UITransform)!;
    const local = ut.convertToNodeSpaceAR(new Vec3(ui.x, ui.y, 0));
    let dx = local.x - this.drag.ox;
    let dy = local.y - this.drag.oy;
    const C = this.cell;

    const arrow = this.drag.piece.arrow;
    if (arrow === ArrowDirection.Horizontal) dy = 0;
    if (arrow === ArrowDirection.Vertical) dx = 0;

    const anchor = this.drag.startCells;
    // Do not clamp against the press-down row/column. After the piece has moved
    // around an obstacle, those old limits are stale (for example: move up, then
    // left past a block that only occupied the original row). Each step below is
    // validated against the piece's current cells, which is the authoritative rule.
    const targetX = Math.max(-24, Math.min(24, Math.round(dx / C)));
    const targetY = Math.max(-24, Math.min(24, Math.round(dy / C)));

    let { x: curX, y: curY } = this.stepFromAnchor(this.drag.group, anchor);
    while (curX < targetX) {
      const snap = this.drag.group.map((p) => p.cells.map((c) => ({ ...c })));
      const trailCells = this.drag.group.map((p) => p.cells.map((c) => ({ ...c })));
      if (!this.tryMoveGroup(this.drag.group, snap, 1, 0)) {
        this.playBlockFeedback(this.drag.group, 1, 0);
        break;
      }
      this.spawnGroupTrail(this.drag.group, trailCells);
      curX++;
      this.drag.moved = true;
    }
    while (curX > targetX) {
      const snap = this.drag.group.map((p) => p.cells.map((c) => ({ ...c })));
      const trailCells = this.drag.group.map((p) => p.cells.map((c) => ({ ...c })));
      if (!this.tryMoveGroup(this.drag.group, snap, -1, 0)) {
        this.playBlockFeedback(this.drag.group, -1, 0);
        break;
      }
      this.spawnGroupTrail(this.drag.group, trailCells);
      curX--;
      this.drag.moved = true;
    }
    while (curY < targetY) {
      const snap = this.drag.group.map((p) => p.cells.map((c) => ({ ...c })));
      const trailCells = this.drag.group.map((p) => p.cells.map((c) => ({ ...c })));
      if (!this.tryMoveGroup(this.drag.group, snap, 0, 1)) {
        this.playBlockFeedback(this.drag.group, 0, 1);
        break;
      }
      this.spawnGroupTrail(this.drag.group, trailCells);
      curY++;
      this.drag.moved = true;
    }
    while (curY > targetY) {
      const snap = this.drag.group.map((p) => p.cells.map((c) => ({ ...c })));
      const trailCells = this.drag.group.map((p) => p.cells.map((c) => ({ ...c })));
      if (!this.tryMoveGroup(this.drag.group, snap, 0, -1)) {
        this.playBlockFeedback(this.drag.group, 0, -1);
        break;
      }
      this.spawnGroupTrail(this.drag.group, trailCells);
      curY--;
      this.drag.moved = true;
    }

    let remX = dx - curX * C;
    let remY = dy - curY * C;
    // 余量必须按「当前位置下一步是否可走」夹紧，不能用开局轴向 max*：
    // 先纵后横等路径下，tryMove 已卡住时 maxPX 仍可能很大，rem 会滑进障碍将近一格
    const groupIds = new Set(this.drag.group.map((p) => p.id));
    const canStep = (sx: number, sy: number) => {
      const proposed = this.drag!.group.map((p) =>
        p.cells.map((c) => ({ x: c.x + sx, y: c.y + sy })));
      return this.canPlaceGroupAt(this.drag!.group, proposed, groupIds);
    };
    const rubber = C * 0.14;
    if (remX > 0 && !canStep(1, 0)) remX = Math.min(remX, rubber);
    if (remX < 0 && !canStep(-1, 0)) remX = Math.max(remX, -rubber);
    if (remY > 0 && !canStep(0, 1)) remY = Math.min(remY, rubber);
    if (remY < 0 && !canStep(0, -1)) remY = Math.max(remY, -rubber);
    remX = Math.max(-C * 0.5, Math.min(C * 0.5, remX));
    remY = Math.max(-C * 0.5, Math.min(C * 0.5, remY));
    if (this.tryAutoCompleteDrag(remX, remY)) return;
    this.applyGroupVisualOffset(this.drag.group, remX, remY);
    this.refreshPictureHighlights();
    if (this.drag.touchRing?.isValid) {
      this.drag.touchRing.setPosition(local.x, local.y, 0);
      this.drag.touchRing.setSiblingIndex(this.root.children.length - 1);
    }
  }

  private onUp() {
    if (!this.drag) return;
    const { group, startCells, moved, piece } = this.drag;
    this.clearDragChrome(this.drag);
    const changed = moved && group.some((p, i) =>
      p.cells.some((c, j) => c.x !== startCells[i][j].x || c.y !== startCells[i][j].y));
    for (const p of group) {
      p.cells = p.cells.map((c) => ({ x: Math.round(c.x), y: Math.round(c.y) }));
      const xs = p.cells.map((c) => c.x);
      const ys = p.cells.map((c) => c.y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const target = this.gridToLocal(cx, cy);
      Tween.stopAllByTarget(p.node);
      p.node.setPosition(target);
      if (!moved && p === piece) {
        p.node.setScale(1, 1, 1);
        tween(p.node)
          .to(0.05, { scale: new Vec3(0.94, 0.94, 1) })
          .to(0.08, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
          .start();
      } else {
        tween(p.node)
          .to(0.1, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
          .start();
      }
    }
    if (changed) {
      this.lastMoveDelta = {
        x: group[0].cells[0].x - startCells[0][0].x,
        y: group[0].cells[0].y - startCells[0][0].y,
      };
    }
    this.drag = null;
    if (changed) {
      SoundMgr.playMove(this.moveMaterial(piece));
      this.onAfterMove();
    }
  }

  private stepFromAnchor(group: Piece[], anchor: Vec2I[][]): { x: number; y: number } {
    const ac = anchor[0][0];
    const cc = group[0].cells[0];
    return { x: cc.x - ac.x, y: cc.y - ac.y };
  }

  /**
   * When a dragged picture group is close to its exact assembled position, snap it
   * into place and end the logical touch immediately. The later native TOUCH_END
   * becomes a no-op because this.drag has already been cleared.
   */
  private tryAutoCompleteDrag(remX: number, remY: number): boolean {
    const d = this.drag;
    if (!d || !d.piece.matchable || d.piece.idPanelPicture < 0) return false;
    const pic = this.picMap.get(d.piece.idPanelPicture);
    if (!pic) return false;

    const groupIds = new Set(d.group.map((p) => p.id));
    const snapDistance = this.cell * 0.2;
    let best: { dx: number; dy: number; distance: number; proposed: Vec2I[][] } | null = null;

    // The free visual remainder is limited to half a cell, so only the current
    // grid position and its immediate neighbours can enter the snap radius.
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const distance = Math.hypot(remX - dx * this.cell, remY - dy * this.cell);
        if (distance > snapDistance || (best && distance >= best.distance)) continue;
        const proposed = d.group.map((p) =>
          p.cells.map((c) => ({ x: c.x + dx, y: c.y + dy })));
        if (!this.canPlaceGroupAt(d.group, proposed, groupIds)) continue;
        if (!this.isPictureAssembledWith(pic, d.group, proposed)) continue;
        best = { dx, dy, distance, proposed };
      }
    }
    if (!best) return false;

    this.autoCompleting = true;
    for (let i = 0; i < d.group.length; i++) {
      d.group[i].cells = best.proposed[i];
      Tween.stopAllByTarget(d.group[i].node);
      d.group[i].node.setScale(1.04, 1.04, 1);
      this.syncPieceNode(d.group[i]);
      const snapTween = tween(d.group[i].node)
        .to(0.08, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' });
      if (i === 0) {
        snapTween.call(() => {
          this.autoCompleting = false;
          this.onAfterMove();
        });
      }
      snapTween.start();
    }

    const changed = d.group.some((p, i) =>
      p.cells.some((c, j) => c.x !== d.startCells[i][j].x || c.y !== d.startCells[i][j].y));
    if (changed) {
      this.lastMoveDelta = {
        x: d.group[0].cells[0].x - d.startCells[0][0].x,
        y: d.group[0].cells[0].y - d.startCells[0][0].y,
      };
    }
    this.clearDragChrome(d);
    this.drag = null;
    SoundMgr.playMove(this.moveMaterial(d.piece));
    return true;
  }

  /** Test the normal picture-complete rule against a proposed dragged position. */
  private isPictureAssembledWith(pic: PictureData, group: Piece[], proposed: Vec2I[][]): boolean {
    const proposedById = new Map<number, Vec2I[]>();
    for (let i = 0; i < group.length; i++) proposedById.set(group[i].id, proposed[i]);

    const cells: { x: number; y: number; idx: number }[] = [];
    for (const p of this.pieces) {
      if (!p.alive || p.inTunnel || p.hiddenUnder || p.contained || p.idPanelPicture !== pic.id) continue;
      if (p.ice > 0 || p.lock > 0 || p.mystery > 0 || p.colorBlock > 0) return false;
      const positions = proposedById.get(p.id) || p.cells;
      for (let i = 0; i < positions.length; i++) {
        const idx = p.picIndices[i];
        if (idx >= 0) cells.push({ x: positions[i].x, y: positions[i].y, idx });
      }
    }

    const expected = pic.width * pic.height;
    if (cells.length < expected) return false;
    const seen = new Set<number>();
    for (const c of cells) {
      if (seen.has(c.idx)) return false;
      seen.add(c.idx);
    }
    if (seen.size < expected) return false;

    const ref = cells[0];
    const refCol = ref.idx % pic.width;
    const refRow = Math.floor(ref.idx / pic.width);
    return cells.every((c) => {
      const col = c.idx % pic.width;
      const row = Math.floor(c.idx / pic.width);
      return c.x - ref.x === col - refCol && c.y - ref.y === row - refRow;
    });
  }

  private applyGroupVisualOffset(group: Piece[], ox: number, oy: number) {
    for (const p of group) {
      this.syncPieceNode(p);
      const pos = p.node.position;
      p.node.setPosition(pos.x + ox, pos.y + oy, 0);
    }
  }

  private spawnGroupTrail(group: Piece[], cellsBefore: Vec2I[][]) {
    if (!this.drag) return;
    for (let i = 0; i < group.length; i++) {
      const trail = this.spawnPieceTrail(group[i], cellsBefore[i]);
      if (trail) this.drag.trails.push(trail);
    }
  }

  private getPictureGroup(p: Piece): Piece[] {
    if (p.idPanelPicture < 0 || !p.matchable) return [p];
    return this.pieces.filter((x) =>
      x.alive && !x.inTunnel && !x.hiddenUnder && !x.contained
      && x.matchable && x.idPanelPicture === p.idPanelPicture);
  }

  /** 同图所有碎片外轮廓描边（相邻格共享边不描，拼在一起时成一体） */
  private addPictureHighlights(picGroup: Piece[]): Node[] {
    const highlights: Node[] = [];
    const C = this.cell;
    for (const p of picGroup) {
      const xs = p.cells.map((c) => c.x);
      const ys = p.cells.map((c) => c.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const pw = (maxX - minX + 1) * C;
      const ph = (maxY - minY + 1) * C;
      const loops = this.insetBoundaryLoops(
        this.shapeBoundaryLoops(p.cells, cx, cy, C),
        C * 0.045,
      );

      const hl = makeNode('selectionOutline', p.node, pw, ph);
      const g = hl.addComponent(Graphics);
      g.lineJoin = Graphics.LineJoin.ROUND;
      g.lineCap = Graphics.LineCap.ROUND;

      // A soft outer highlight plus a crisp white core matches the reference selection edge.
      g.strokeColor = new Color(255, 255, 255, 105);
      g.lineWidth = Math.max(1.2, C * 0.05);
      this.appendRoundedLoops(g, loops, C * 0.2);
      g.stroke();

      g.strokeColor = Color.WHITE;
      g.lineWidth = Math.max(1.1, C * 0.04);
      this.appendRoundedLoops(g, loops, C * 0.2);
      g.stroke();
      hl.setSiblingIndex(p.node.children.length - 1);
      highlights.push(hl);
    }
    return highlights;
  }

  private refreshPictureHighlights() {
    if (!this.drag) return;
    for (const h of this.drag.highlights) if (h.isValid) h.destroy();
    this.drag.highlights = this.addPictureHighlights(this.drag.picGroup);
  }

  private pictureOccupied(picGroup: Piece[]): Set<string> {
    const occupied = new Set<string>();
    for (const p of picGroup) {
      for (const c of p.cells) occupied.add(`${Math.round(c.x)},${Math.round(c.y)}`);
    }
    return occupied;
  }

  private paintPictureOutline(node: Node, picGroup: Piece[]) {
    // 每块用节点真实位置算偏移，描边跟着色块走，避免「贴格子、图已拖走」错位
    const cellOff = new Map<string, { ox: number; oy: number }>();
    for (const p of picGroup) {
      const xs = p.cells.map((c) => c.x);
      const ys = p.cells.map((c) => c.y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const base = this.gridToLocal(cx, cy);
      const ox = p.node.position.x - base.x;
      const oy = p.node.position.y - base.y;
      for (const c of p.cells) cellOff.set(`${Math.round(c.x)},${Math.round(c.y)}`, { ox, oy });
    }

    const g = node.getComponent(Graphics) || node.addComponent(Graphics);
    g.clear();
    g.strokeColor = new Color(255, 255, 255, 255);
    g.lineWidth = 5;
    g.lineJoin = Graphics.LineJoin.ROUND;
    g.lineCap = Graphics.LineCap.ROUND;
    this.strokeOccupiedOutline(g, this.pictureOccupied(picGroup), cellOff);
    g.stroke();
  }

  /**
   * 整图占用并集外轮廓：邻边不描；每条边带所属格的视觉偏移。
   * 顶点多路时取最左转（角点相接不画十字）；偏移变化处补短折线衔接。
   */
  private strokeOccupiedOutline(
    g: Graphics,
    occupied: Set<string>,
    cellOff: Map<string, { ox: number; oy: number }>,
  ) {
    type Seg = { x0: number; y0: number; x1: number; y1: number; ox: number; oy: number };
    const segs: Seg[] = [];
    const byStart = new Map<string, Seg[]>();
    const ik = (x: number, y: number) => `${x},${y}`;
    const offAt = (gx: number, gy: number) => cellOff.get(`${gx},${gy}`) || { ox: 0, oy: 0 };
    const addSeg = (x0: number, y0: number, x1: number, y1: number, ox: number, oy: number) => {
      const s = { x0, y0, x1, y1, ox, oy };
      segs.push(s);
      const k = ik(x0, y0);
      let arr = byStart.get(k);
      if (!arr) { arr = []; byStart.set(k, arr); }
      arr.push(s);
    };

    for (const key of Array.from(occupied.keys())) {
      const parts = key.split(',');
      const gx = Number(parts[0]);
      const gy = Number(parts[1]);
      const { ox, oy } = offAt(gx, gy);
      if (!occupied.has(`${gx},${gy - 1}`)) addSeg(gx, gy, gx + 1, gy, ox, oy);
      if (!occupied.has(`${gx + 1},${gy}`)) addSeg(gx + 1, gy, gx + 1, gy + 1, ox, oy);
      if (!occupied.has(`${gx},${gy + 1}`)) addSeg(gx + 1, gy + 1, gx, gy + 1, ox, oy);
      if (!occupied.has(`${gx - 1},${gy}`)) addSeg(gx, gy + 1, gx, gy, ox, oy);
    }

    const toLocal = (ix: number, iy: number, ox: number, oy: number) => {
      const p = this.gridToLocal(ix - 0.5, iy - 0.5);
      return { x: p.x + ox, y: p.y + oy };
    };

    const pickNext = (px: number, py: number, qx: number, qy: number, nexts: Seg[]): Seg | null => {
      const idx = qx - px;
      const idy = qy - py;
      let best: Seg | null = null;
      let bestCross = -Infinity;
      let bestDot = Infinity;
      for (const s of nexts) {
        const odx = s.x1 - s.x0;
        const ody = s.y1 - s.y0;
        const cross = idx * ody - idy * odx;
        const dot = idx * odx + idy * ody;
        if (cross > bestCross || (cross === bestCross && dot < bestDot)) {
          bestCross = cross;
          bestDot = dot;
          best = s;
        }
      }
      return best;
    };

    const used = new Set<Seg>();
    for (const start of segs) {
      if (used.has(start)) continue;
      const loop: Seg[] = [start];
      used.add(start);
      let px = start.x0;
      let py = start.y0;
      let cx = start.x1;
      let cy = start.y1;
      let closed = false;
      for (let guard = 0; guard < segs.length; guard++) {
        if (cx === start.x0 && cy === start.y0) { closed = true; break; }
        const nexts = (byStart.get(ik(cx, cy)) || []).filter((s) => !used.has(s));
        const next = pickNext(px, py, cx, cy, nexts);
        if (!next) break;
        used.add(next);
        loop.push(next);
        px = cx;
        py = cy;
        cx = next.x1;
        cy = next.y1;
      }
      if (!closed || loop.length < 3) continue;

      const wFirst = toLocal(loop[0].x0, loop[0].y0, loop[0].ox, loop[0].oy);
      g.moveTo(wFirst.x, wFirst.y);
      let prevOx = loop[0].ox;
      let prevOy = loop[0].oy;
      for (const s of loop) {
        // 相邻边分属拖拽/静止块时偏移不同，先接到本边起点再描，避免斜线贯穿
        if (s.ox !== prevOx || s.oy !== prevOy) {
          const wS = toLocal(s.x0, s.y0, s.ox, s.oy);
          g.lineTo(wS.x, wS.y);
        }
        const wE = toLocal(s.x1, s.y1, s.ox, s.oy);
        g.lineTo(wE.x, wE.y);
        prevOx = s.ox;
        prevOy = s.oy;
      }
      if (loop[0].ox !== prevOx || loop[0].oy !== prevOy) {
        g.lineTo(wFirst.x, wFirst.y);
      }
      g.close();
    }
  }

  private spawnPieceTrail(piece: Piece, cells: Vec2I[]): Node | null {
    if (!cells.length) return null;
    const C = this.cell;
    const xs = cells.map((c) => c.x);
    const ys = cells.map((c) => c.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const pw = (maxX - minX + 1) * C;
    const ph = (maxY - minY + 1) * C;
    const hex = piece.matchable ? colorHex(piece.color) : '#8a4a2a';

    const trail = makeNode('dragTrail', this.root, pw, ph);
    trail.setPosition(this.gridToLocal(cx, cy));
    const g = trail.addComponent(Graphics);
    const fill = colorFromHex(hex);
    fill.a = 110;
    g.fillColor = fill;
    for (const c of cells) {
      const lx = (c.x - cx) * C;
      const ly = (c.y - cy) * C;
      g.roundRect(lx - C / 2 + 3, ly - C / 2 + 3, C - 6, C - 6, 10);
    }
    g.fill();
    const stroke = colorFromHex(hex);
    stroke.a = 220;
    g.strokeColor = stroke;
    g.lineWidth = 4;
    for (const c of cells) {
      const lx = (c.x - cx) * C;
      const ly = (c.y - cy) * C;
      g.roundRect(lx - C / 2 + 3, ly - C / 2 + 3, C - 6, C - 6, 10);
    }
    g.stroke();

    const op = trail.addComponent(UIOpacity);
    op.opacity = 210;
    tween(op)
      .to(0.25, { opacity: 0 }, { easing: 'quadOut' })
      .call(() => { if (trail.isValid) trail.destroy(); })
      .start();
    return trail;
  }

  private createTouchRing(x: number, y: number): Node {
    const n = makeNode('touchRing', this.root, 48, 48);
    n.setPosition(x, y, 0);
    const g = n.addComponent(Graphics);
    g.fillColor = new Color(255, 255, 255, 90);
    g.circle(0, 0, 16);
    g.fill();
    g.strokeColor = new Color(255, 255, 255, 200);
    g.lineWidth = 3;
    g.circle(0, 0, 20);
    g.stroke();
    return n;
  }

  private clearDragChrome(d: { highlights: Node[]; touchRing: Node | null }) {
    for (const h of d.highlights) if (h.isValid) h.destroy();
    if (d.touchRing?.isValid) d.touchRing.destroy();
  }

  private spawnTapBurst(x: number, y: number) {
    const colors = ['#fff9c4', '#ffe082', '#ffffff', '#c8e6c9'];
    for (let i = 0; i < 6; i++) {
      const n = makeNode('tapBurst', this.root, 12, 12);
      n.setPosition(x, y, 0);
      const g = n.addComponent(Graphics);
      g.fillColor = colorFromHex(colors[i % colors.length]);
      g.circle(0, 0, 5);
      g.fill();
      const op = n.addComponent(UIOpacity);
      op.opacity = 220;
      const ang = (Math.PI * 2 * i) / 6;
      const dist = this.cell * 0.35;
      tween(n)
        .parallel(
          tween().to(0.22, { position: new Vec3(x + Math.cos(ang) * dist, y + Math.sin(ang) * dist, 0) }),
          tween(op).to(0.22, { opacity: 0 }),
        )
        .call(() => { if (n.isValid) n.destroy(); })
        .start();
    }
  }

  private playTapReject(piece: Piece) {
    const n = piece.node;
    Tween.stopAllByTarget(n);
    n.setScale(1, 1, 1);
    tween(n)
      .to(0.05, { scale: new Vec3(0.94, 0.94, 1) })
      .to(0.08, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
      .start();
  }

  private playBlockFeedback(group: Piece[], dirX: number, dirY: number) {
    const now = Date.now();
    if (this.drag && now - this.drag.lastBlockAt < 120) return;
    if (this.drag) this.drag.lastBlockAt = now;
    const bx = dirX !== 0 ? dirX * 5 : 0;
    const by = dirY !== 0 ? dirY * 5 : 0;
    for (const p of group) {
      const pos = p.node.position.clone();
      Tween.stopAllByTarget(p.node);
      // 顶墙回弹不要改 scale，保持当前拖拽放大态
      tween(p.node)
        .to(0.04, { position: new Vec3(pos.x + bx, pos.y + by, 0) })
        .to(0.05, { position: pos }, { easing: 'quadOut' })
        .start();
    }
  }

  private moveMaterial(piece: Piece): string {
    if (hasMechanic(piece.mechanic, MechanicType.Wooden)) return 'Wood';
    if (hasMechanic(piece.mechanic, MechanicType.Stone)) return 'Stone';
    return '';
  }

  private hitTest(lx: number, ly: number): Piece | null {
    const g = this.localToGrid(lx, ly);
    const gx = Math.round(g.x);
    const gy = Math.round(g.y);
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const p = this.pieces[i];
      if (!p.alive || !p.node.active || p.inTunnel || p.hiddenUnder) continue;
      if (p.cells.some((c) => c.x === gx && c.y === gy)) return p;
    }
    return null;
  }

  private canMove(p: Piece): boolean {
    if (!p.alive || p.inTunnel || p.hiddenUnder || p.contained) return false;
    if (p.isObstacle && !hasMechanic(p.mechanic, MechanicType.Wooden) && !hasMechanic(p.mechanic, MechanicType.Stone)) {
      if (!p.matchable) return false;
    }
    if (hasMechanic(p.mechanic, MechanicType.Pinned)) return false;
    if (p.ice > 0) return false;
    if (p.lock > 0) return false;
    if (p.mystery > 0) return false;
    if (!p.matchable && p.isObstacle && !hasMechanic(p.mechanic, MechanicType.Wooden) && !hasMechanic(p.mechanic, MechanicType.Stone)) {
      return false;
    }
    return true;
  }

  private getMoveGroup(p: Piece): Piece[] {
    if (!p.idCombineds.length) return [p];
    const ids = new Set<number>([p.id, ...p.idCombineds]);
    return this.pieces.filter((x) => x.alive && !x.inTunnel && !x.hiddenUnder && ids.has(x.id));
  }

  private canPlaceGroupAt(group: Piece[], proposed: Vec2I[][], groupIds: Set<number>): boolean {
    for (let i = 0; i < group.length; i++) {
      for (const c of proposed[i]) {
        if (!this.isWalkable(c.x, c.y)) return false;
        if (this.isBlockedByEnv(c.x, c.y)) return false;
        for (const other of this.pieces) {
          if (!other.alive || other.inTunnel || other.hiddenUnder || other.contained || groupIds.has(other.id)) continue;
          if (other.cells.some((oc) => oc.x === c.x && oc.y === c.y)) return false;
        }
      }
    }
    return true;
  }

  private tryMoveGroup(group: Piece[], startCells: Vec2I[][], stepX: number, stepY: number): boolean {
    const proposed: Vec2I[][] = startCells.map((cells) =>
      cells.map((c) => ({ x: c.x + stepX, y: c.y + stepY })),
    );
    const groupIds = new Set(group.map((p) => p.id));
    if (!this.canPlaceGroupAt(group, proposed, groupIds)) return false;
    for (let i = 0; i < group.length; i++) group[i].cells = proposed[i];
    return true;
  }

  private isWalkable(x: number, y: number): boolean {
    if (y < 0 || y >= this.board.length) return false;
    const row = this.board[y];
    if (x < 0 || x >= row.length) return false;
    return row[x] === TypeEnvironment.Ground;
  }

  private isBlockedByEnv(x: number, y: number): boolean {
    if (this.wallIce.some((w) => w.num > 0 && w.pos.x === x && w.pos.y === y)) return true;
    for (const b of this.woodenBoxes) {
      if (b.count > 0 && b.cells.some((c) => c.x === x && c.y === y)) return true;
    }
    for (const r of this.rollers) {
      if (r.count > 0 && r.cells.some((c) => c.x === x && c.y === y)) return true;
    }
    for (const g of this.grinders) {
      if (grinderCells(g).some((c) => c.x === x && c.y === y)) return true;
    }
    return false;
  }

  private onAfterMove() {
    this.tryPortalTeleport();
    this.tryColorPathForce();
    this.tryThrowTunnels();
    this.checkAllPictures();
    this.cb.onHud();
    this.cb.onGoals();
  }

  /** 同色传送门：方块踩入入口后整体平移到出口 */
  private tryPortalTeleport() {
    if (this.portals.length < 2) return;
    for (const piece of this.pieces) {
      if (!piece.alive) continue;
      for (const portal of this.portals) {
        if (!piece.cells.some((c) => c.x === portal.pos.x && c.y === portal.pos.y)) continue;
        const exit = this.portals.find((p) => p !== portal && p.color === portal.color);
        if (!exit) continue;
        const dx = exit.pos.x - portal.pos.x;
        const dy = exit.pos.y - portal.pos.y;
        if (dx === 0 && dy === 0) continue;
        const start = [piece.cells.map((c) => ({ ...c }))];
        if (this.tryMoveGroup([piece], start, dx, dy)) {
          this.syncPieceNode(piece);
          SoundMgr.play('click');
        }
        return; // 每次移动最多传送一次
      }
    }
  }

  // ─── picture complete ────────────────────────────────

  private checkAllPictures() {
    let any = false;
    for (const pic of this.pictures) {
      if (this.completedPics.has(pic.id)) continue;
      if (this.isPictureAssembled(pic)) {
        this.completePicture(pic);
        any = true;
      }
    }
    if (any) {
      this.meltIce(1);
      this.tickWallIce(1);
      this.revealMystery(1);
      this.tryThrowTunnels();
      this.checkAllPictures();
      if (this.remainingPictures() === 0) {
        this.running = false;
        this.levelDone = true;
        this.cb.onWin();
      }
    }
  }

  private isPictureAssembled(pic: PictureData): boolean {
    const cells: { x: number; y: number; idx: number }[] = [];
    for (const p of this.pieces) {
      if (!p.alive || p.inTunnel || p.hiddenUnder || p.contained) continue;
      if (p.idPanelPicture !== pic.id) continue;
      if (p.ice > 0 || p.lock > 0 || p.mystery > 0 || p.colorBlock > 0) return false;
      for (let i = 0; i < p.cells.length; i++) {
        const idx = p.picIndices[i];
        if (idx < 0) continue;
        cells.push({ x: p.cells[i].x, y: p.cells[i].y, idx });
      }
    }
    const expected = pic.width * pic.height;
    if (cells.length < expected) return false;
    const seen = new Set<number>();
    for (const c of cells) {
      if (seen.has(c.idx)) return false;
      seen.add(c.idx);
    }
    if (seen.size < expected) return false;

    const ref = cells[0];
    const refCol = ref.idx % pic.width;
    const refRow = Math.floor(ref.idx / pic.width);
    for (const c of cells) {
      const col = c.idx % pic.width;
      const row = Math.floor(c.idx / pic.width);
      if (c.x - ref.x !== col - refCol || c.y - ref.y !== row - refRow) return false;
    }
    return true;
  }

  private completePicture(pic: PictureData) {
    this.completedPics.add(pic.id);
    SoundMgr.play('match');
    const members = this.pieces.filter((p) =>
      p.alive && !p.inTunnel && !p.hiddenUnder && p.idPanelPicture === pic.id && p.matchable);
    if (members.length) {
      const xs = members.flatMap((p) => p.cells.map((c) => c.x));
      const ys = members.flatMap((p) => p.cells.map((c) => c.y));
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      this.spawnMatchBurst(cx, cy);
    }
    const hadKey = members.some((p) => hasMechanic(p.mechanic, MechanicType.Key));
    const topIds = members.map((p) => p.id);
    for (const p of members) {
      p.alive = false;
      this.flyOut(p);
    }
    if (hadKey) this.unlockLocks(1);
    this.cutColorBlocks(pic.color);
    this.onPictureCounters();
    this.breakLayeredTops(topIds);
    this.cb.onPictureComplete?.(pic.id);
  }

  private spawnMatchBurst(gx: number, gy: number) {
    const center = this.gridToLocal(gx, gy);
    const colors = ['#fff59d', '#ffffff', '#ffeb3b', '#c8e6c9', '#e1bee7'];
    const particleSize = Math.max(28, this.cell * 0.42);
    for (let i = 0; i < 12; i++) {
      const n = makeNode('matchBurst', this.root, particleSize, particleSize);
      n.setPosition(center.x, center.y, 0);
      n.setSiblingIndex(this.root.children.length - 1);
      const g = n.addComponent(Graphics);
      g.fillColor = colorFromHex(colors[i % colors.length]);
      const r = Math.max(8, this.cell * 0.14) + (i % 3) * Math.max(3, this.cell * 0.05);
      g.circle(0, 0, r);
      g.fill();
      const op = n.addComponent(UIOpacity);
      op.opacity = 240;
      const ang = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
      const dist = this.cell * (0.55 + Math.random() * 0.75);
      tween(n)
        .parallel(
          tween().to(0.32, { position: new Vec3(center.x + Math.cos(ang) * dist, center.y + Math.sin(ang) * dist, 0) }),
          tween(op).to(0.32, { opacity: 0 }),
          tween().to(0.32, { scale: new Vec3(0.35, 0.35, 1) }),
        )
        .call(() => { if (n.isValid) n.destroy(); })
        .start();
    }
  }

  private flyOut(p: Piece) {
    const op = p.node.getComponent(UIOpacity) || p.node.addComponent(UIOpacity);
    tween(p.node)
      .to(0.35, { position: new Vec3(p.node.position.x, p.node.position.y + 160, 0), scale: new Vec3(0.2, 0.2, 1) }, { easing: 'quadOut' })
      .start();
    tween(op).to(0.35, { opacity: 0 }).call(() => {
      if (p.node?.isValid) p.node.destroy();
    }).start();
  }

  private meltIce(n: number) {
    for (const p of this.pieces) {
      if (!p.alive || p.ice <= 0) continue;
      p.ice = Math.max(0, p.ice - n);
      if (p.iceLabel) p.iceLabel.string = String(p.ice);
      if (p.ice <= 0) {
        const iceNode = p.node.getChildByName('ice');
        if (iceNode) iceNode.destroy();
        p.iceLabel = null;
        SoundMgr.play('ice');
      }
    }
  }

  private unlockLocks(n: number) {
    for (const p of this.pieces) {
      if (!p.alive || p.lock <= 0) continue;
      p.lock = Math.max(0, p.lock - n);
      if (p.lockLabel) p.lockLabel.string = String(p.lock);
      if (p.lock <= 0) {
        const nLock = p.node.getChildByName('lock');
        if (nLock) nLock.destroy();
        p.lockLabel = null;
      }
    }
  }

  private tickWallIce(n: number) {
    for (const w of this.wallIce) {
      if (w.num <= 0) continue;
      w.num = Math.max(0, w.num - n);
      w.label.string = String(w.num);
      if (w.num <= 0) {
        if (w.node?.isValid) w.node.destroy();
      }
    }
    this.wallIce = this.wallIce.filter((w) => w.num > 0);
  }

  private revealMystery(n: number) {
    for (const p of this.pieces) {
      if (!p.alive || p.mystery <= 0) continue;
      p.mystery = Math.max(0, p.mystery - n);
    }
  }

  // ─── env / layered / colorblock ───────────────────────

  private applyLayeredHidden() {
    for (const top of this.pieces) {
      if (top.idLayered < 0) continue;
      const under = this.pieces.find((p) => p.id === top.idLayered);
      if (!under) continue;
      under.hiddenUnder = true;
      under.node.active = false;
    }
  }

  private applyContainedFlags() {
    for (const p of this.pieces) {
      if (!p.alive || p.inTunnel || p.hiddenUnder) continue;
      const inBox = this.woodenBoxes.some((b) =>
        b.count > 0 && p.cells.some((c) => b.cells.some((bc) => bc.x === c.x && bc.y === c.y)));
      const inDoor = this.rollers.some((r) =>
        r.count > 0 && p.cells.some((c) => r.cells.some((rc) => rc.x === c.x && rc.y === c.y)));
      p.contained = inBox || inDoor;
      if (p.contained) p.node.active = false;
    }
  }

  private breakLayeredTops(topIds: number[]) {
    for (const topId of topIds) {
      const top = this.pieces.find((p) => p.id === topId);
      if (!top || top.idLayered < 0) continue;
      const under = this.pieces.find((p) => p.id === top.idLayered);
      if (!under || !under.hiddenUnder) continue;
      under.hiddenUnder = false;
      under.node.active = true;
      // 同格叠放：继承 top 最后位置
      const samePos = under.spawnCells.length === top.spawnCells.length
        && under.spawnCells.every((c, i) => c.x === top.spawnCells[i].x && c.y === top.spawnCells[i].y);
      if (samePos) {
        under.cells = top.cells.map((c) => ({ ...c }));
      } else {
        under.cells = under.spawnCells.map((c) => ({ ...c }));
      }
      this.syncPieceNode(under);
      SoundMgr.play('click');
    }
  }

  private cutColorBlocks(picColor: number) {
    if (!picColor) return;
    for (const p of this.pieces) {
      if (!p.alive || p.colorBlock <= 0) continue;
      const cut = p.colorBlock & picColor;
      if (!cut) continue;
      p.colorBlock &= ~picColor;
      const bits = colorFlagBits(p.colorBlock);
      if (p.ropeLabel) p.ropeLabel.string = bits.length ? `绳×${bits.length}` : '';
      if (p.colorBlock <= 0) {
        const rope = p.node.getChildByName('rope');
        if (rope) rope.destroy();
        p.ropeLabel = null;
        SoundMgr.play('match');
      }
    }
  }

  private onPictureCounters() {
    // wooden boxes
    for (const b of this.woodenBoxes) {
      if (b.count <= 0) continue;
      b.count--;
      b.label.string = String(b.count);
      if (b.count <= 0) {
        b.node.destroy();
        this.releaseContainedIn(b.cells);
      }
    }
    this.woodenBoxes = this.woodenBoxes.filter((b) => b.count > 0);

    // rollers
    for (const r of this.rollers) {
      if (r.count <= 0) continue;
      r.count--;
      r.label.string = String(r.count);
      if (r.count <= 0) {
        r.node.destroy();
        this.releaseContainedIn(r.cells);
      }
    }
    this.rollers = this.rollers.filter((r) => r.count > 0);

    // grinders：每向 -1
    for (const g of this.grinders) {
      if (g.up > 0) g.up--;
      if (g.down > 0) g.down--;
      if (g.left > 0) g.left--;
      if (g.right > 0) g.right--;
      const total = g.up + g.down + g.left + g.right;
      g.label.string = String(total);
      if (total <= 0) {
        g.node.destroy();
      } else {
        // 刷新视觉：简单更新数字即可，颚缩短靠 isBlockedByEnv 读当前值
      }
    }
    this.grinders = this.grinders.filter((g) => g.up + g.down + g.left + g.right > 0);
  }

  private releaseContainedIn(cells: Vec2I[]) {
    for (const p of this.pieces) {
      if (!p.alive || !p.contained) continue;
      const hit = p.cells.some((c) => cells.some((bc) => bc.x === c.x && bc.y === c.y))
        || p.spawnCells.some((c) => cells.some((bc) => bc.x === c.x && bc.y === c.y));
      if (!hit) continue;
      // 仍被其它容器困住则不释放
      const still = this.woodenBoxes.some((b) => b.count > 0 && p.spawnCells.some((c) => b.cells.some((bc) => bc.x === c.x && bc.y === c.y)))
        || this.rollers.some((r) => r.count > 0 && p.spawnCells.some((c) => r.cells.some((rc) => rc.x === c.x && rc.y === c.y)));
      if (still) continue;
      p.contained = false;
      p.cells = p.spawnCells.map((c) => ({ ...c }));
      p.node.active = true;
      this.syncPieceNode(p);
    }
  }

  private tryThrowTunnels() {
    for (const t of this.tunnels) {
      if (!t.queue.length) continue;
      const id = t.queue[0];
      const piece = this.pieces.find((p) => p.id === id && p.inTunnel);
      if (!piece) { t.queue.shift(); continue; }

      // listPos = 弹出落点
      const proposed = piece.spawnCells.map((c) => ({ ...c }));
      if (!this.canPlaceCells(proposed, piece.id)) continue;

      t.queue.shift();
      piece.inTunnel = false;
      piece.cells = proposed;
      piece.node.active = true;
      this.syncPieceNode(piece);
      t.label.string = String(t.queue.length);
      if (!t.queue.length) {
        t.node.destroy();
      }
      SoundMgr.play('click');
      return; // 每次只吐一块
    }
    this.tunnels = this.tunnels.filter((t) => t.queue.length > 0 && t.node.isValid);
  }

  private canPlaceCells(cells: Vec2I[], selfId: number): boolean {
    for (const c of cells) {
      if (!this.isWalkable(c.x, c.y)) return false;
      if (this.isBlockedByEnv(c.x, c.y)) return false;
      for (const other of this.pieces) {
        if (!other.alive || other.inTunnel || other.hiddenUnder || other.contained || other.id === selfId) continue;
        if (other.cells.some((oc) => oc.x === c.x && oc.y === c.y)) return false;
      }
    }
    return true;
  }

  /** 同色色轨：沿上次移动方向 Continuously 滑行 */
  private tryColorPathForce() {
    const dx = Math.sign(this.lastMoveDelta.x);
    const dy = Math.sign(this.lastMoveDelta.y);
    if (dx === 0 && dy === 0) return;
    for (const p of this.pieces) {
      if (!p.alive || !p.node.active || p.inTunnel || p.hiddenUnder || p.contained) continue;
      if (!this.pieceOnMatchingPath(p)) continue;
      // 沿方向连续滑动，直到下一格不能走或不再压色轨
      let guard = 20;
      while (guard-- > 0) {
        if (!this.pieceOnMatchingPath(p)) break;
        const start = [p.cells.map((c) => ({ ...c }))];
        if (!this.tryMoveGroup([p], start, dx, dy)) break;
        this.syncPieceNode(p);
      }
    }
  }

  private pieceOnMatchingPath(p: Piece): boolean {
    return p.cells.some((c) =>
      this.colorPaths.some((cp) => cp.pos.x === c.x && cp.pos.y === c.y && (p.color & cp.color) !== 0));
  }

  private tryClickRotator(lx: number, ly: number): boolean {
    const g = this.localToGrid(lx, ly);
    const gx = Math.round(g.x);
    const gy = Math.round(g.y);
    for (const rot of this.rotators) {
      if (rot.pos.x !== gx || rot.pos.y !== gy) continue;
      if (rot.rotating) return true;
      this.doRotate(rot);
      return true;
    }
    return false;
  }

  private doRotate(rot: RotatorRuntime) {
    const arm = new Set(rotatorArmCells(rot).map((c) => `${c.x},${c.y}`));
    const affected = this.pieces.filter((p) =>
      p.alive && !p.inTunnel && !p.hiddenUnder && !p.contained
      && p.cells.some((c) => arm.has(`${c.x},${c.y}`)));

    const nextCells = affected.map((p) => p.cells.map((c) => rotateCellCW(c, rot.pos)));
    // 校验
    for (let i = 0; i < affected.length; i++) {
      for (const c of nextCells[i]) {
        if (!this.isWalkable(c.x, c.y)) {
          this.cb.onToast('无法旋转');
          return;
        }
        if (this.isBlockedByEnv(c.x, c.y) && !arm.has(`${c.x},${c.y}`)) {
          // 旋入臂外障碍
          this.cb.onToast('无法旋转');
          return;
        }
      }
    }
    // 互相重叠？
    const occupied = new Map<string, number>();
    for (let i = 0; i < affected.length; i++) {
      for (const c of nextCells[i]) {
        const k = `${c.x},${c.y}`;
        if (occupied.has(k)) { this.cb.onToast('无法旋转'); return; }
        occupied.set(k, affected[i].id);
      }
    }
    for (const other of this.pieces) {
      if (!other.alive || other.inTunnel || other.hiddenUnder || affected.includes(other)) continue;
      for (const c of other.cells) {
        if (occupied.has(`${c.x},${c.y}`)) { this.cb.onToast('无法旋转'); return; }
      }
    }

    for (let i = 0; i < affected.length; i++) {
      affected[i].cells = nextCells[i];
      this.syncPieceNode(affected[i]);
    }
    SoundMgr.play('click');
    this.onAfterMove();
  }

  private tickBombs(dt: number) {
    if (this.frozenTimer > 0) return;
    for (const p of this.pieces) {
      if (!p.alive || p.timeBomb <= 0 || p.inTunnel || p.hiddenUnder) continue;
      p.bombLeft -= dt;
      if (p.bombLabel) p.bombLabel.string = String(Math.max(0, Math.ceil(p.bombLeft)));
      if (p.bombLeft <= 0) {
        this.fail('bomb');
        return;
      }
    }
  }

  private fail(reason: 'time' | 'bomb') {
    this.running = false;
    this.levelDone = true;
    this.loseReason = reason;
    SoundMgr.play('lose');
    this.cb.onLose(reason);
  }

  // ─── boosters ────────────────────────────────────────

  private useToolOn(kind: string, piece: Piece) {
    if ((this.tools as any)[kind] <= 0) return;
    if (kind === 'slicer') {
      if (!piece.alive || piece.ice > 0 || piece.lock > 0) {
        this.cb.onToast('无法切开');
        return;
      }
      this.tools.slicer--;
      SoundMgr.play('hammer');
      piece.alive = false;
      this.flyOut(piece);
      this.activeTool = null;
      this.onAfterMove();
    } else if (kind === 'magnet') {
      if (!piece.matchable || piece.ice > 0 || piece.lock > 0 || piece.colorBlock > 0 || piece.contained) {
        this.cb.onToast('无法使用磁铁');
        return;
      }
      this.tools.magnet--;
      SoundMgr.play('magnet');
      const picId = piece.idPanelPicture;
      const targets = this.pieces.filter((p) =>
        p.alive && !p.inTunnel && !p.hiddenUnder && !p.contained
        && p.idPanelPicture === picId && p.matchable && p.ice <= 0 && p.lock <= 0 && p.colorBlock <= 0);
      const topIds = targets.map((p) => p.id);
      for (const p of targets) { p.alive = false; this.flyOut(p); }
      this.completedPics.add(picId);
      const pic = this.picMap.get(picId);
      if (pic) this.cutColorBlocks(pic.color);
      this.onPictureCounters();
      this.breakLayeredTops(topIds);
      this.activeTool = null;
      this.meltIce(1);
      this.tickWallIce(1);
      this.tryThrowTunnels();
      this.cb.onHud();
      this.cb.onGoals();
      if (this.remainingPictures() === 0) {
        this.running = false;
        this.levelDone = true;
        this.cb.onWin();
      } else {
        this.checkAllPictures();
      }
    } else if (kind === 'teleport') {
      if (!this.teleportFirst) {
        this.teleportFirst = piece;
        this.cb.onToast('再选一块交换位置');
        return;
      }
      if (this.teleportFirst === piece) return;
      this.tools.teleport--;
      const a = this.teleportFirst;
      const b = piece;
      const tmp = a.cells.map((c) => ({ ...c }));
      a.cells = b.cells.map((c) => ({ ...c }));
      b.cells = tmp;
      this.syncPieceNode(a);
      this.syncPieceNode(b);
      this.teleportFirst = null;
      this.activeTool = null;
      SoundMgr.play('click');
      this.onAfterMove();
    }
  }
}
