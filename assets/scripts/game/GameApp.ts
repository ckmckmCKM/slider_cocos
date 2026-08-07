import {
  _decorator, Component, Node, Label, Graphics, Color, sys, UITransform, EventTouch,
  view, ResolutionPolicy, tween, Vec3, UIOpacity, instantiate,
} from 'cc';
import { BoardController } from '../blocky/BoardController';
import { DESIGN_H, DESIGN_W, MAX_LEVEL, PROGRESS_KEY } from '../utils/Constants';
import { colorFromHex } from '../utils/Helpers';
import { ResCache } from '../utils/ResCache';
import { SoundMgr } from '../utils/SoundMgr';
import {
  addLabel, fullWidget, makeButton, makeImageButton, makeNode, setSprite,
} from '../utils/UIFactory';

const { ccclass } = _decorator;

function childPath(root: Node, path: string): Node | null {
  const parts = path.split('/');
  let n: Node | null = root;
  for (const p of parts) {
    if (!n) return null;
    n = n.getChildByName(p);
  }
  return n;
}

function mustChild(root: Node, path: string): Node {
  const n = childPath(root, path);
  if (!n) throw new Error(`SliderGame missing node: ${path}`);
  return n;
}

function mustLabel(root: Node, path: string): Label {
  const n = mustChild(root, path);
  const lb = n.getComponent(Label);
  if (!lb) throw new Error(`SliderGame missing Label: ${path}`);
  return lb;
}

@ccclass('GameApp')
export class GameApp extends Component {
  private lobby!: Node;
  private menu!: Node;
  private game!: Node;
  private boardRoot!: Node;
  private board!: BoardController;

  private hudLevel!: Label;
  private hudTimer!: Label;
  private hudProgress!: Label;
  private goalBar!: Node;
  private tip!: Label;
  private toast!: Label;
  private toastNode!: Node;
  private winOverlay!: Node;
  private winPanel!: Node;
  private winConfettiRoot!: Node;
  private loseOverlay!: Node;
  private keepOverlay!: Node;
  private winText!: Label;
  private loseTitle!: Label;

  private toolNodes: Record<string, { node: Node; cnt: Label }> = {};
  private maxLevel = 1;
  private warned15 = false;
  private toastTimer = 0;
  private menuPage = 0;
  private readonly pageSize = 50;

  async onLoad() {
    view.setDesignResolutionSize(DESIGN_W, DESIGN_H, ResolutionPolicy.SHOW_ALL);
    this.maxLevel = this.loadProgress();
    await SoundMgr.init(this.node);
    await this.buildUI();
    this.showLobby();
  }

  update(dt: number) {
    if (this.board) {
      this.board.tick(dt);
      if (this.board.timeLeft <= 15 && this.board.timeLeft > 0 && this.board.running && !this.warned15) {
        this.warned15 = true;
        SoundMgr.play('warn');
      }
    }
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.toastNode.active = false;
    }
  }

  private async buildUI() {
    const canvas = this.node;
    let ut = canvas.getComponent(UITransform);
    if (!ut) ut = canvas.addComponent(UITransform);
    ut.setContentSize(DESIGN_W, DESIGN_H);
    fullWidget(canvas);

    this.lobby = makeNode('Lobby', canvas, DESIGN_W, DESIGN_H);
    fullWidget(this.lobby);
    await this.buildLobby(this.lobby);

    this.menu = makeNode('Menu', canvas, DESIGN_W, DESIGN_H);
    fullWidget(this.menu);
    this.menu.active = false;
    await this.buildMenu(this.menu);

    const gamePrefab = await ResCache.loadPrefab('prefab/SliderGame');
    if (!gamePrefab) throw new Error('prefab/SliderGame missing');
    this.game = instantiate(gamePrefab);
    this.game.name = 'Game';
    canvas.addChild(this.game);
    fullWidget(this.game);
    await this.bindGame(this.game);
  }

  private async buildLobby(root: Node) {
    const bg = makeNode('bg', root, DESIGN_W, DESIGN_H);
    fullWidget(bg);
    const bgSf = await ResCache.ui('zy_bj');
    if (bgSf) setSprite(bg, bgSf);
    else {
      const g = bg.addComponent(Graphics);
      g.fillColor = colorFromHex('#87CEEB');
      g.rect(-DESIGN_W / 2, -DESIGN_H / 2, DESIGN_W, DESIGN_H);
      g.fill();
    }

    const content = makeNode('content', root, DESIGN_W, DESIGN_H);
    fullWidget(content);

    const logo = makeNode('logo', content, DESIGN_W * 0.82, 280);
    logo.setPosition(0, 280, 0);
    const logoSf = await ResCache.ui('logo');
    if (logoSf) setSprite(logo, logoSf);
    else addLabel(logo, 'Block Reveal', 48, '#5b341a');

    const btnBox = makeNode('btns', content, DESIGN_W, 200);
    btnBox.setPosition(0, -140, 0);

    const anLv = await ResCache.ui('an_lv');
    const anLan = await ResCache.ui('an_lan');
    makeImageButton(btnBox, 'start', 420, 90, anLv, '开始游戏', () => {
      SoundMgr.play('click');
      SoundMgr.startBgm();
      this.enterGame(this.loadProgress());
    }).setPosition(0, 50, 0);

    makeImageButton(btnBox, 'select', 420, 90, anLan, '选择关卡', () => {
      SoundMgr.play('click');
      this.showMenu();
    }).setPosition(0, -60, 0);

    const ver = makeNode('ver', root, 400, 30);
    ver.setPosition(0, -DESIGN_H / 2 + 40, 0);
    addLabel(ver, 'Block Reveal · Cocos 1:1', 18, '#5b341a99');
  }

  private async buildMenu(root: Node) {
    const bg = makeNode('bg', root, DESIGN_W, DESIGN_H);
    fullWidget(bg);
    const bgSf = await ResCache.ui('gk_bj');
    if (bgSf) setSprite(bg, bgSf);

    const top = makeNode('top', root, DESIGN_W, 100);
    top.setPosition(0, DESIGN_H / 2 - 70, 0);
    addLabel(makeNode('title', top, 400, 50), '选择关卡', 36, '#5b341a');

    const scroll = makeNode('grid', root, DESIGN_W - 40, DESIGN_H - 300);
    scroll.setPosition(0, 10, 0);
    (root as any)._levelGrid = scroll;

    const pager = makeNode('pager', root, DESIGN_W, 50);
    pager.setPosition(0, -DESIGN_H / 2 + 140, 0);
    makeButton(pager, 'prev', 120, 44, '上一页', () => {
      if (this.menuPage > 0) { this.menuPage--; this.refreshLevelGrid(); }
    }).setPosition(-160, 0, 0);
    const pageLbl = makeNode('page', pager, 160, 40);
    (root as any)._pageLbl = addLabel(pageLbl, '1', 22, '#5b341a');
    makeButton(pager, 'next', 120, 44, '下一页', () => {
      const maxPage = Math.ceil(MAX_LEVEL / this.pageSize) - 1;
      if (this.menuPage < maxPage) { this.menuPage++; this.refreshLevelGrid(); }
    }).setPosition(160, 0, 0);

    makeButton(root, 'back', 200, 56, '‹ 返回大厅', () => {
      SoundMgr.play('click');
      this.showLobby();
    }).setPosition(0, -DESIGN_H / 2 + 70, 0);
  }

  private refreshLevelGrid() {
    const grid: Node = (this.menu as any)._levelGrid;
    if (!grid) return;
    grid.removeAllChildren();
    this.maxLevel = this.loadProgress();
    const cols = 5;
    const cellW = 110, cellH = 64, gap = 10;
    const startX = -((cols - 1) * (cellW + gap)) / 2;
    const startY = (DESIGN_H - 360) / 2 - 20;
    const from = this.menuPage * this.pageSize + 1;
    const to = Math.min(MAX_LEVEL, from + this.pageSize - 1);
    const pageLbl: Label | undefined = (this.menu as any)._pageLbl;
    if (pageLbl) pageLbl.string = `${from}-${to} / ${MAX_LEVEL}`;

    for (let idx = from; idx <= to; idx++) {
      const i = idx - from;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const locked = idx > this.maxLevel;
      const btn = makeNode(`lv${idx}`, grid, cellW, cellH);
      btn.setPosition(startX + col * (cellW + gap), startY - row * (cellH + gap), 0);
      const g = btn.addComponent(Graphics);
      g.fillColor = locked ? colorFromHex('#c8b086') : colorFromHex('#f2c97e');
      g.roundRect(-cellW / 2, -cellH / 2, cellW, cellH, 12);
      g.fill();
      g.strokeColor = colorFromHex('#c98a4b');
      g.lineWidth = 2;
      g.roundRect(-cellW / 2, -cellH / 2, cellW, cellH, 12);
      g.stroke();
      const txt = makeNode('txt', btn, cellW - 8, cellH - 8);
      addLabel(txt, String(idx), 26, locked ? '#8a7355' : '#7a4518');
      btn.on(Node.EventType.TOUCH_END, () => {
        if (locked) { this.showToast('先通关前面的关卡解锁'); return; }
        SoundMgr.play('click');
        this.enterGame(idx);
      });
    }
  }

  private async bindGame(root: Node) {
    this.boardRoot = mustChild(root, 'Board');
    this.board = new BoardController(this.boardRoot, {
      onHud: () => this.refreshHud(),
      onGoals: () => this.refreshGoals(),
      onWin: () => this.onWin(),
      onLose: (reason) => this.onLose(reason),
      onToast: (m) => this.showToast(m),
    });

    this.hudLevel = mustLabel(root, 'HUD/level');
    this.hudTimer = mustLabel(root, 'HUD/timer/t');
    this.hudProgress = mustLabel(root, 'HUD/prog/txt');
    this.goalBar = mustChild(root, 'HUD/goals');

    this.paintRoundRect(mustChild(root, 'HUD/timer'), -85, -24, 170, 48, 22, new Color(70, 40, 18, 230));
    this.paintRoundRect(mustChild(root, 'HUD/prog'), -70, -22, 140, 44, 12, new Color(255, 240, 210, 230));
    this.paintRoundRect(this.goalBar, -(DESIGN_W - 60) / 2, -32, DESIGN_W - 60, 64, 12, new Color(120, 70, 30, 55));

    const tools = mustChild(root, 'tools');
    this.bindTools(tools);

    const tipN = mustChild(root, 'tip');
    this.tip = mustLabel(root, 'tip/txt');
    this.paintRoundRect(tipN, -310, -20, 620, 40, 14, new Color(90, 52, 26, 170));

    this.toastNode = mustChild(root, 'toast');
    this.toast = mustLabel(root, 'toast/txt');
    this.paintRoundRect(this.toastNode, -180, -28, 360, 56, 14, new Color(90, 52, 26, 230));

    this.winOverlay = mustChild(root, 'win');
    this.paintRect(this.winOverlay, -DESIGN_W / 2, -DESIGN_H / 2, DESIGN_W, DESIGN_H, new Color(0, 0, 0, 170));
    this.winConfettiRoot = mustChild(root, 'win/confetti');
    this.winPanel = mustChild(root, 'win/panel');
    this.paintRoundRect(this.winPanel, -260, -210, 520, 420, 24, new Color(255, 255, 255, 18));
    {
      const h1Label = mustLabel(root, 'win/panel/h1');
      h1Label.enableOutline = true;
      h1Label.outlineColor = colorFromHex('#ffd54f');
      h1Label.outlineWidth = 4;
      this.winText = mustLabel(root, 'win/panel/h2');
      const feat = mustChild(root, 'win/panel/feat');
      this.paintRoundRect(feat, -160, -60, 320, 120, 16, new Color(0, 0, 0, 140));
      const fg = feat.getComponent(Graphics)!;
      fg.strokeColor = new Color(255, 255, 255, 80);
      fg.lineWidth = 2;
      fg.roundRect(-160, -60, 320, 120, 16);
      fg.stroke();
      this.bindClick(mustChild(root, 'win/panel/next'), () => {
        SoundMgr.play('click');
        this.winOverlay.active = false;
        this.enterGame(this.board.levelIndex + 1);
      });
      this.bindClick(mustChild(root, 'win/panel/home'), () => {
        SoundMgr.play('click');
        this.winOverlay.active = false;
        this.showLobby();
      });
      this.paintButton(mustChild(root, 'win/panel/next'), 280, 72);
      this.paintButton(mustChild(root, 'win/panel/home'), 200, 56);
    }

    this.loseOverlay = mustChild(root, 'lose');
    this.paintRect(this.loseOverlay, -DESIGN_W / 2, -DESIGN_H / 2, DESIGN_W, DESIGN_H, new Color(90, 52, 26, 220));
    this.loseTitle = mustLabel(root, 'lose/h1');
    this.bindClick(mustChild(root, 'lose/keep'), () => {
      SoundMgr.play('click');
      this.loseOverlay.active = false;
      if (this.board.loseReason === 'bomb') this.board.keepPlayingBomb();
      else this.board.keepPlaying(60);
    });
    this.bindClick(mustChild(root, 'lose/retry'), () => {
      SoundMgr.play('click');
      this.enterGame(this.board.levelIndex);
    });
    this.bindClick(mustChild(root, 'lose/menu'), () => {
      SoundMgr.play('click');
      this.showMenu();
    });
    this.paintButton(mustChild(root, 'lose/keep'), 240, 64);
    this.paintButton(mustChild(root, 'lose/retry'), 240, 64);
    this.paintButton(mustChild(root, 'lose/menu'), 200, 56);

    this.keepOverlay = mustChild(root, 'keep');
  }

  private bindTools(parent: Node) {
    const defs: { key: string; tip: string; instant?: boolean }[] = [
      { key: 'freeze', tip: '', instant: true },
      { key: 'magnet', tip: '点击一张图，自动完成' },
      { key: 'slicer', tip: '点击要切开的方块' },
      { key: 'teleport', tip: '选择两块交换位置' },
    ];
    for (const d of defs) {
      const n = mustChild(parent, d.key);
      this.paintButton(n, 80, 80);
      const badge = mustChild(n, 'cnt');
      const bg = badge.getComponent(Graphics) || badge.addComponent(Graphics);
      bg.clear();
      bg.fillColor = colorFromHex('#e05030');
      bg.circle(0, 0, 14);
      bg.fill();
      const cnt = mustLabel(n, 'cnt/txt');
      this.toolNodes[d.key] = { node: n, cnt };
      n.on(Node.EventType.TOUCH_END, () => {
        if (!this.board?.running) return;
        const left = (this.board.tools as any)[d.key] as number;
        if (left <= 0) return;
        SoundMgr.play('click');
        if (d.instant && d.key === 'freeze') {
          this.board.useFreeze();
          this.refreshToolUI();
          return;
        }
        const next = this.board.activeTool === d.key ? null : d.key;
        this.board.setActiveTool(next);
        this.refreshToolUI();
        if (next && d.tip) this.showToast(d.tip);
      });
    }
  }

  private paintRect(node: Node, x: number, y: number, w: number, h: number, fill: Color) {
    const g = node.getComponent(Graphics) || node.addComponent(Graphics);
    g.clear();
    g.fillColor = fill;
    g.rect(x, y, w, h);
    g.fill();
  }

  private paintRoundRect(
    node: Node, x: number, y: number, w: number, h: number, r: number, fill: Color,
  ) {
    const g = node.getComponent(Graphics) || node.addComponent(Graphics);
    g.clear();
    g.fillColor = fill;
    g.roundRect(x, y, w, h, r);
    g.fill();
  }

  private paintButton(node: Node, w: number, h: number) {
    const g = node.getComponent(Graphics) || node.addComponent(Graphics);
    g.clear();
    g.fillColor = colorFromHex('#f2c97e');
    g.roundRect(-w / 2, -h / 2, w, h, 18);
    g.fill();
    g.strokeColor = colorFromHex('#c98a4b');
    g.lineWidth = 3;
    g.roundRect(-w / 2, -h / 2, w, h, 18);
    g.stroke();
  }

  private bindClick(node: Node, onClick: () => void) {
    node.on(Node.EventType.TOUCH_END, (e: EventTouch) => {
      e.propagationStopped = true;
      onClick();
    });
  }

  private showLobby() {
    this.lobby.active = true;
    this.menu.active = false;
    this.game.active = false;
    if (this.board) this.board.running = false;
  }

  private showMenu() {
    this.lobby.active = false;
    this.menu.active = true;
    this.game.active = false;
    this.menuPage = Math.floor((this.loadProgress() - 1) / this.pageSize);
    this.refreshLevelGrid();
  }

  private async enterGame(idx: number) {
    if (idx < 1 || idx > MAX_LEVEL) {
      this.showToast('没有更多关卡了');
      return;
    }
    const lvl = await ResCache.loadBrLevel(idx);
    if (!lvl) {
      this.showToast(`关卡 ${idx} 加载失败`);
      return;
    }
    this.lobby.active = false;
    this.menu.active = false;
    this.game.active = true;
    this.warned15 = false;
    this.board.tools = { freeze: 2, magnet: 2, slicer: 3, teleport: 1 };
    this.board.setActiveTool(null);
    await this.board.startLevel(idx, lvl);
    this.refreshToolUI();
    this.refreshHud();
    this.refreshGoals();
  }

  private refreshHud() {
    if (!this.board) return;
    this.hudLevel.string = `第${this.board.levelIndex}关`;
    const t = Math.max(0, Math.ceil(this.board.timeLeft));
    const mm = String(Math.floor(t / 60)).padStart(2, '0');
    const ss = String(t % 60).padStart(2, '0');
    this.hudTimer.string = this.board.frozenTimer > 0 ? `❄${mm}:${ss}` : `${mm}:${ss}`;
    this.hudTimer.color = t <= 15 ? colorFromHex('#ff8a65') : colorFromHex('#fff8e7');
    this.hudProgress.string = `图 ${this.board.remainingPictures()}`;
  }

  private async refreshGoals() {
    if (!this.goalBar || !this.board) return;
    const kids = this.goalBar.children.slice();
    for (const c of kids) c.destroy();
    const goals = this.board.goals();
    const [goalFrame, goalFrameBack] = await Promise.all([
      ResCache.uiBr('UI_ingame_BG_Frame'),
      ResCache.uiBr('UI_ingame_BG_Frame_back'),
    ]);
    const gap = 58;
    const startX = -((goals.length - 1) * gap) / 2;
    for (let i = 0; i < goals.length; i++) {
      const g = goals[i];
      const item = makeNode('g', this.goalBar, 52, 52);
      item.setPosition(startX + i * gap, 0, 0);
      const frame = g.done ? goalFrameBack : goalFrame;
      if (frame) {
        setSprite(item, frame);
      } else {
        const bg = item.addComponent(Graphics);
        bg.fillColor = colorFromHex(g.done ? '#c8e6c9' : '#fff6e4');
        bg.roundRect(-26, -26, 52, 52, 10);
        bg.fill();
        bg.strokeColor = colorFromHex(g.done ? '#43a047' : '#b87a3c');
        bg.lineWidth = 2;
        bg.roundRect(-26, -26, 52, 52, 10);
        bg.stroke();
      }
      if (!g.done) {
        const sf = await ResCache.loadSprite(g.path);
        if (sf) setSprite(makeNode('i', item, 34, 34), sf);
      }
      if (g.done) addLabel(makeNode('ok', item, 40, 24), '✓', 22, '#2e7d32');
    }
  }

  private refreshToolUI() {
    if (!this.board) return;
    for (const k of Object.keys(this.toolNodes)) {
      const left = (this.board.tools as any)[k] as number;
      this.toolNodes[k].cnt.string = String(left);
      const active = this.board.activeTool === k;
      const g = this.toolNodes[k].node.getComponent(Graphics)!;
      g.clear();
      g.fillColor = colorFromHex('#f2d19a');
      g.roundRect(-40, -40, 80, 80, 18);
      g.fill();
      g.strokeColor = colorFromHex(active ? '#e05030' : '#a86a32');
      g.lineWidth = active ? 5 : 4;
      g.roundRect(-40, -40, 80, 80, 18);
      g.stroke();
      this.toolNodes[k].node.setScale(left > 0 ? 1 : 0.85, left > 0 ? 1 : 0.85, 1);
    }
  }

  private onWin() {
    SoundMgr.play('win');
    this.saveProgress(this.board.levelIndex + 1);
    this.winText.string = `第 ${this.board.levelIndex} 关完成！`;
    this.winOverlay.active = true;
    this.winOverlay.setSiblingIndex(this.game.children.length - 1);
    this.winPanel.setScale(0.35, 0.35, 1);
    const op = this.winPanel.getComponent(UIOpacity) || this.winPanel.addComponent(UIOpacity);
    op.opacity = 0;
    tween(this.winPanel)
      .parallel(
        tween().to(0.42, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }),
        tween(op).to(0.25, { opacity: 255 }),
      )
      .start();
    this.spawnWinConfetti();
  }

  private spawnWinConfetti() {
    for (const c of this.winConfettiRoot.children) c.destroy();
    const colors = ['#e53935', '#43a047', '#1e88e5', '#fdd835', '#8e24aa', '#fb8c00'];
    for (let i = 0; i < 28; i++) {
      const n = makeNode(`c${i}`, this.winConfettiRoot, 8, 24);
      const x = (Math.random() - 0.5) * DESIGN_W * 0.9;
      const y = DESIGN_H / 2 + 40 + Math.random() * 80;
      n.setPosition(x, y, 0);
      n.angle = Math.random() * 360;
      const g = n.addComponent(Graphics);
      g.fillColor = colorFromHex(colors[i % colors.length]);
      g.rect(-4, -12, 8, 24);
      g.fill();
      const op = n.addComponent(UIOpacity);
      op.opacity = 230;
      const dur = 1.2 + Math.random() * 0.8;
      tween(n)
        .parallel(
          tween().to(dur, { position: new Vec3(x + (Math.random() - 0.5) * 120, -DESIGN_H / 2 - 80, 0) }),
          tween().by(dur, { angle: 180 + Math.random() * 360 }),
          tween(op).delay(dur * 0.55).to(dur * 0.45, { opacity: 0 }),
        )
        .call(() => { if (n.isValid) n.destroy(); })
        .start();
    }
  }

  private onLose(reason: 'time' | 'bomb') {
    this.loseTitle.string = reason === 'bomb' ? '炸弹爆炸！' : '时间到';
    this.loseOverlay.active = true;
  }

  private showToast(msg: string) {
    this.toast.string = msg;
    this.toastNode.active = true;
    this.toastTimer = 1.6;
  }

  private loadProgress(): number {
    try {
      const v = sys.localStorage.getItem(PROGRESS_KEY);
      return Math.max(1, Math.min(MAX_LEVEL, parseInt(v || '1', 10) || 1));
    } catch {
      return 1;
    }
  }

  private saveProgress(nextUnlock: number) {
    this.maxLevel = Math.max(this.maxLevel, Math.min(MAX_LEVEL + 1, nextUnlock));
    try { sys.localStorage.setItem(PROGRESS_KEY, String(this.maxLevel)); } catch (_) { /* */ }
  }
}
