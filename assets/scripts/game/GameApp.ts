import {
  _decorator, Component, Node, Label, Graphics, Color, sys, UITransform,
  view, ResolutionPolicy, tween, Vec3, UIOpacity,
} from 'cc';
import { BoardController } from '../blocky/BoardController';
import { DESIGN_H, DESIGN_W, MAX_LEVEL, PROGRESS_KEY } from '../utils/Constants';
import { colorFromHex } from '../utils/Helpers';
import { ResCache } from '../utils/ResCache';
import { SoundMgr } from '../utils/SoundMgr';
import {
  addLabel, fullWidget, makeButton, makeImageButton, makeNode, makeOverlay, setSprite,
} from '../utils/UIFactory';

const { ccclass } = _decorator;

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

    this.game = makeNode('Game', canvas, DESIGN_W, DESIGN_H);
    fullWidget(this.game);
    this.game.active = false;
    await this.buildGame(this.game);
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

    const btnBox = makeNode('btns', content, DESIGN_W, 220);
    btnBox.setPosition(0, -180, 0);

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

  private async buildGame(root: Node) {
    const bg = makeNode('bg', root, DESIGN_W, DESIGN_H);
    fullWidget(bg);
    const bgSf = await ResCache.ui('gk_bj');
    if (bgSf) setSprite(bg, bgSf);

    this.boardRoot = makeNode('Board', root, DESIGN_W, DESIGN_H * 0.72);
    this.boardRoot.setPosition(0, 20, 0);
    this.board = new BoardController(this.boardRoot, {
      onHud: () => this.refreshHud(),
      onGoals: () => this.refreshGoals(),
      onWin: () => this.onWin(),
      onLose: (reason) => this.onLose(reason),
      onToast: (m) => this.showToast(m),
    });

    const hud = makeNode('HUD', root, DESIGN_W - 20, 160);
    hud.setPosition(0, DESIGN_H / 2 - 100, 0);

    const lvNode = makeNode('level', hud, 180, 44);
    lvNode.setPosition(-250, 40, 0);
    this.hudLevel = addLabel(lvNode, '第1关', 32);

    const timerWrap = makeNode('timer', hud, 170, 48);
    timerWrap.setPosition(0, 40, 0);
    const tg = timerWrap.addComponent(Graphics);
    tg.fillColor = new Color(70, 40, 18, 230);
    tg.roundRect(-85, -24, 170, 48, 22);
    tg.fill();
    const timerLbl = makeNode('t', timerWrap, 140, 40);
    this.hudTimer = addLabel(timerLbl, '03:00', 28, '#fff8e7');

    const prog = makeNode('prog', hud, 140, 44);
    prog.setPosition(250, 40, 0);
    const pg = prog.addComponent(Graphics);
    pg.fillColor = new Color(255, 240, 210, 230);
    pg.roundRect(-70, -22, 140, 44, 12);
    pg.fill();
    this.hudProgress = addLabel(makeNode('txt', prog, 130, 36), '图 0', 22, '#6b3f1a');

    this.goalBar = makeNode('goals', hud, DESIGN_W - 60, 64);
    this.goalBar.setPosition(0, -36, 0);
    const goalBg = this.goalBar.addComponent(Graphics);
    goalBg.fillColor = new Color(120, 70, 30, 55);
    goalBg.roundRect(-(DESIGN_W - 60) / 2, -32, DESIGN_W - 60, 64, 12);
    goalBg.fill();

    const tools = makeNode('tools', root, DESIGN_W, 110);
    tools.setPosition(0, -DESIGN_H / 2 + 100, 0);
    await this.buildTools(tools);

    const tipN = makeNode('tip', root, 620, 40);
    tipN.setPosition(0, -DESIGN_H / 2 + 185, 0);
    const tipg = tipN.addComponent(Graphics);
    tipg.fillColor = new Color(90, 52, 26, 170);
    tipg.roundRect(-310, -20, 620, 40, 14);
    tipg.fill();
    this.tip = addLabel(makeNode('txt', tipN, 600, 36), '拖动方块，拼完整张图片即可揭示', 20, '#ffe9c4');

    this.toastNode = makeNode('toast', root, 360, 56);
    this.toastNode.active = false;
    const tostg = this.toastNode.addComponent(Graphics);
    tostg.fillColor = new Color(90, 52, 26, 230);
    tostg.roundRect(-180, -28, 360, 56, 14);
    tostg.fill();
    this.toast = addLabel(makeNode('txt', this.toastNode, 340, 48), '', 24, '#ffe9c4');

    this.winOverlay = makeOverlay(root, 'win');
    this.winOverlay.getComponent(Graphics)!.fillColor = new Color(0, 0, 0, 170);
    this.winConfettiRoot = makeNode('confetti', this.winOverlay, DESIGN_W, DESIGN_H);
    fullWidget(this.winConfettiRoot);
    this.winPanel = makeNode('panel', this.winOverlay, 520, 420);
    {
      const panelBg = this.winPanel.addComponent(Graphics);
      panelBg.fillColor = new Color(255, 255, 255, 18);
      panelBg.roundRect(-260, -210, 520, 420, 24);
      panelBg.fill();

      const h1 = makeNode('h1', this.winPanel, 460, 70);
      h1.setPosition(0, 130, 0);
      const h1Label = addLabel(h1, 'Well Done!', 52, '#4fc3f7');
      h1Label.enableOutline = true;
      h1Label.outlineColor = colorFromHex('#ffd54f');
      h1Label.outlineWidth = 4;

      const h2 = makeNode('h2', this.winPanel, 400, 40);
      h2.setPosition(0, 50, 0);
      this.winText = addLabel(h2, '', 26, '#ffffff');

      const feat = makeNode('feat', this.winPanel, 320, 120);
      feat.setPosition(0, -30, 0);
      const fg = feat.addComponent(Graphics);
      fg.fillColor = new Color(0, 0, 0, 140);
      fg.roundRect(-160, -60, 320, 120, 16);
      fg.fill();
      fg.strokeColor = new Color(255, 255, 255, 80);
      fg.lineWidth = 2;
      fg.roundRect(-160, -60, 320, 120, 16);
      fg.stroke();
      const t1n = makeNode('t1', feat, 280, 30);
      t1n.setPosition(0, 28, 0);
      addLabel(t1n, '关卡完成', 24, '#ffffff');
      const t2n = makeNode('t2', feat, 280, 28);
      t2n.setPosition(0, -18, 0);
      addLabel(t2n, '继续挑战下一关吧', 20, '#e0e0e0');

      makeButton(this.winPanel, 'next', 280, 72, '下一关 ▶', () => {
        SoundMgr.play('click');
        this.winOverlay.active = false;
        this.enterGame(this.board.levelIndex + 1);
      }).setPosition(0, -130, 0);
      makeButton(this.winPanel, 'home', 200, 56, '返回主页', () => {
        SoundMgr.play('click');
        this.winOverlay.active = false;
        this.showLobby();
      }).setPosition(0, -210, 0);
    }

    this.loseOverlay = makeOverlay(root, 'lose');
    this.loseOverlay.active = false;
    {
      const h1 = makeNode('h1', this.loseOverlay, 400, 50);
      h1.setPosition(0, 120, 0);
      this.loseTitle = addLabel(h1, '失败', 42, '#ffe9c4');
      makeButton(this.loseOverlay, 'keep', 240, 64, '续关 (+60秒)', () => {
        SoundMgr.play('click');
        this.loseOverlay.active = false;
        if (this.board.loseReason === 'bomb') this.board.keepPlayingBomb();
        else this.board.keepPlaying(60);
      }).setPosition(0, 20, 0);
      makeButton(this.loseOverlay, 'retry', 240, 64, '再来一次', () => {
        SoundMgr.play('click');
        this.enterGame(this.board.levelIndex);
      }).setPosition(0, -60, 0);
      makeButton(this.loseOverlay, 'menu', 200, 56, '选关', () => {
        SoundMgr.play('click');
        this.showMenu();
      }).setPosition(0, -140, 0);
    }

    this.keepOverlay = makeNode('keep', root, 1, 1);
    this.keepOverlay.active = false;
  }

  private async buildTools(parent: Node) {
    const defs: { key: string; ui: string; tip: string; instant?: boolean }[] = [
      { key: 'freeze', ui: 'Ice clock_booster', tip: '', instant: true },
      { key: 'magnet', ui: 'Magnet_booster', tip: '点击一张图，自动完成' },
      { key: 'slicer', ui: 'Saw_booster', tip: '点击要切开的方块' },
      { key: 'teleport', ui: 'The bush_booster', tip: '选择两块交换位置' },
    ];
    const gap = 95;
    const start = -((defs.length - 1) * gap) / 2;
    for (let i = 0; i < defs.length; i++) {
      const d = defs[i];
      const n = makeNode(d.key, parent, 80, 80);
      n.setPosition(start + i * gap, 0, 0);
      const g = n.addComponent(Graphics);
      g.fillColor = colorFromHex('#f2d19a');
      g.roundRect(-40, -40, 80, 80, 18);
      g.fill();
      g.strokeColor = colorFromHex('#a86a32');
      g.lineWidth = 4;
      g.roundRect(-40, -40, 80, 80, 18);
      g.stroke();
      const sf = await ResCache.uiBr(d.ui);
      if (sf) setSprite(makeNode('icon', n, 58, 58), sf);
      else addLabel(makeNode('fb', n, 70, 30), d.key, 14, '#5b341a');
      const badge = makeNode('cnt', n, 28, 28);
      badge.setPosition(28, 28, 0);
      const bg = badge.addComponent(Graphics);
      bg.fillColor = colorFromHex('#e05030');
      bg.circle(0, 0, 14);
      bg.fill();
      const cnt = addLabel(makeNode('txt', badge, 28, 28), '0', 16, '#ffffff');
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
    if (this.board) this.board.running = false;
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
    this.winOverlay.active = false;
    this.loseOverlay.active = false;
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
