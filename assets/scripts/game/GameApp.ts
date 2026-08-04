import {
  _decorator, Component, Node, Label, Graphics, Color, sys, UITransform,
  view, ResolutionPolicy,
} from 'cc';
import { BoardController } from '../game/BoardController';
import { DESIGN_H, DESIGN_W, PROGRESS_KEY } from '../utils/Constants';
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
  private loseOverlay!: Node;
  private winText!: Label;

  private toolNodes: Record<string, { node: Node; cnt: Label }> = {};
  private maxLevel = 1;
  private warned15 = false;
  private toastTimer = 0;

  async onLoad() {
    view.setDesignResolutionSize(DESIGN_W, DESIGN_H, ResolutionPolicy.SHOW_ALL);
    this.maxLevel = this.loadProgress();
    await ResCache.loadLevels();
    await SoundMgr.init(this.node);
    await this.buildUI();
    this.showLobby();
  }

  update(dt: number) {
    if (this.board) {
      this.board.tick(dt);
      if (this.board.levelDone && this.board.timeLeft <= 0 && !this.loseOverlay.active && !this.winOverlay.active) {
        this.loseOverlay.active = true;
      }
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

    const ver = makeNode('ver', root, 200, 30);
    ver.setPosition(0, -DESIGN_H / 2 + 40, 0);
    addLabel(ver, 'v2.0 Cocos 2D', 18, '#5b341a99');
  }

  private async buildMenu(root: Node) {
    const bg = makeNode('bg', root, DESIGN_W, DESIGN_H);
    fullWidget(bg);
    const bgSf = await ResCache.ui('gk_bj');
    if (bgSf) setSprite(bg, bgSf);

    const top = makeNode('top', root, DESIGN_W, 140);
    top.setPosition(0, DESIGN_H / 2 - 90, 0);
    const logoSf = await ResCache.ui('logo');
    if (logoSf) {
      const logo = makeNode('logo', top, 320, 100);
      setSprite(logo, logoSf);
    }

    const scroll = makeNode('grid', root, DESIGN_W - 40, DESIGN_H - 280);
    scroll.setPosition(0, -20, 0);
    (root as any)._levelGrid = scroll;

    makeButton(root, 'back', 200, 56, '‹ 返回大厅', () => {
      SoundMgr.play('click');
      this.showLobby();
    }).setPosition(0, -DESIGN_H / 2 + 70, 0);
  }

  private refreshLevelGrid() {
    const grid: Node = (this.menu as any)._levelGrid;
    if (!grid) return;
    grid.removeAllChildren();
    const keys = ResCache.levelKeys();
    this.maxLevel = this.loadProgress();
    const cols = 5;
    const cellW = 110, cellH = 70, gap = 12;
    const startX = -((cols - 1) * (cellW + gap)) / 2;
    const startY = (DESIGN_H - 320) / 2 - 40;
    keys.forEach((idx, i) => {
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
      // Label 必须挂子节点，否则会被同节点 Graphics 盖住
      const txt = makeNode('txt', btn, cellW - 8, cellH - 8);
      addLabel(txt, String(idx), 28, locked ? '#8a7355' : '#7a4518');
      btn.on(Node.EventType.TOUCH_END, () => {
        if (locked) { this.showToast('先通关前面的关卡解锁'); return; }
        SoundMgr.play('click');
        this.enterGame(idx);
      });
    });
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
      onToast: (m) => this.showToast(m),
    });

    // HUD（置于棋盘之上）
    const hud = makeNode('HUD', root, DESIGN_W - 20, 160);
    hud.setPosition(0, DESIGN_H / 2 - 100, 0);
    hud.setSiblingIndex(root.children.length - 1);

    const lvNode = makeNode('level', hud, 180, 44);
    lvNode.setPosition(-250, 40, 0);
    this.hudLevel = addLabel(lvNode, '第1关', 32);

    const timerWrap = makeNode('timer', hud, 170, 48);
    timerWrap.setPosition(0, 40, 0);
    const tg = timerWrap.addComponent(Graphics);
    tg.fillColor = new Color(70, 40, 18, 230);
    tg.roundRect(-85, -24, 170, 48, 22);
    tg.fill();
    const clockSf = await ResCache.img('gk_djs');
    if (clockSf) {
      const c = makeNode('clk', timerWrap, 34, 34);
      c.setPosition(-52, 0, 0);
      setSprite(c, clockSf);
    }
    const timerLbl = makeNode('t', timerWrap, 100, 40);
    timerLbl.setPosition(20, 0, 0);
    this.hudTimer = addLabel(timerLbl, '05:00', 28, '#fff8e7');

    const prog = makeNode('prog', hud, 140, 44);
    prog.setPosition(250, 40, 0);
    const pg = prog.addComponent(Graphics);
    pg.fillColor = new Color(255, 240, 210, 230);
    pg.roundRect(-70, -22, 140, 44, 12);
    pg.fill();
    pg.strokeColor = colorFromHex('#c98a4b');
    pg.lineWidth = 2;
    pg.roundRect(-70, -22, 140, 44, 12);
    pg.stroke();
    this.hudProgress = addLabel(makeNode('txt', prog, 130, 36), '剩余 0', 22, '#6b3f1a');

    this.goalBar = makeNode('goals', hud, DESIGN_W - 60, 64);
    this.goalBar.setPosition(0, -36, 0);
    const goalBg = this.goalBar.addComponent(Graphics);
    goalBg.fillColor = new Color(120, 70, 30, 55);
    goalBg.roundRect(-(DESIGN_W - 60) / 2, -32, DESIGN_W - 60, 64, 12);
    goalBg.fill();

    // tools
    const tools = makeNode('tools', root, DESIGN_W, 110);
    tools.setPosition(0, -DESIGN_H / 2 + 100, 0);
    await this.buildTools(tools);

    const tipN = makeNode('tip', root, 560, 40);
    tipN.setPosition(0, -DESIGN_H / 2 + 185, 0);
    const tipg = tipN.addComponent(Graphics);
    tipg.fillColor = new Color(90, 52, 26, 170);
    tipg.roundRect(-280, -20, 560, 40, 14);
    tipg.fill();
    this.tip = addLabel(makeNode('txt', tipN, 540, 36), '拖动滑块，将图案拼完整即可消除', 20, '#ffe9c4');

    this.toastNode = makeNode('toast', root, 360, 56);
    this.toastNode.active = false;
    const tostg = this.toastNode.addComponent(Graphics);
    tostg.fillColor = new Color(90, 52, 26, 230);
    tostg.roundRect(-180, -28, 360, 56, 14);
    tostg.fill();
    this.toast = addLabel(makeNode('txt', this.toastNode, 340, 48), '', 24, '#ffe9c4');

    this.winOverlay = makeOverlay(root, 'win');
    {
      const h1 = makeNode('h1', this.winOverlay, 400, 50);
      h1.setPosition(0, 140, 0);
      addLabel(h1, '干的漂亮', 42, '#ffe9c4');
      const h2 = makeNode('h2', this.winOverlay, 400, 40);
      h2.setPosition(0, 70, 0);
      this.winText = addLabel(h2, '', 24, '#ffd84d');
      makeButton(this.winOverlay, 'home', 240, 64, '返回主页', () => {
        SoundMgr.play('click');
        this.showLobby();
      }).setPosition(0, -20, 0);
      makeButton(this.winOverlay, 'next', 240, 64, '下一关', () => {
        SoundMgr.play('click');
        this.enterGame(this.board.levelIndex + 1);
      }).setPosition(0, -100, 0);
    }

    this.loseOverlay = makeOverlay(root, 'lose');
    {
      const h1 = makeNode('h1', this.loseOverlay, 400, 50);
      h1.setPosition(0, 120, 0);
      addLabel(h1, '时间到', 42, '#ffe9c4');
      const h2 = makeNode('h2', this.loseOverlay, 400, 40);
      h2.setPosition(0, 50, 0);
      addLabel(h2, '再试一次吧', 24, '#ffd84d');
      makeButton(this.loseOverlay, 'retry', 240, 64, '再来一次', () => {
        SoundMgr.play('click');
        this.enterGame(this.board.levelIndex);
      }).setPosition(0, -30, 0);
      makeButton(this.loseOverlay, 'menu', 200, 56, '选关', () => {
        SoundMgr.play('click');
        this.showMenu();
      }).setPosition(0, -110, 0);
    }
  }

  private async buildTools(parent: Node) {
    const defs: { key: string; img: string; tip: string }[] = [
      { key: 'time', img: 'gk_dj_1', tip: '' },
      { key: 'hammer', img: 'gk_dj_2', tip: '请点击要敲散的滑块' },
      { key: 'magnet', img: 'gk_dj_3', tip: '点击图案，吸走所有同类' },
    ];
    const gap = 100;
    for (let i = 0; i < defs.length; i++) {
      const d = defs[i];
      const n = makeNode(d.key, parent, 80, 80);
      n.setPosition((i - 1) * gap, 0, 0);
      const g = n.addComponent(Graphics);
      g.fillColor = colorFromHex('#f2d19a');
      g.roundRect(-40, -40, 80, 80, 18);
      g.fill();
      g.strokeColor = colorFromHex('#a86a32');
      g.lineWidth = 4;
      g.roundRect(-40, -40, 80, 80, 18);
      g.stroke();
      const sf = await ResCache.img(d.img);
      if (sf) setSprite(makeNode('icon', n, 58, 58), sf);
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
        if (d.key === 'time') {
          this.board.useTimeTool();
          this.refreshToolUI();
          return;
        }
        this.board.activeTool = this.board.activeTool === d.key ? null : d.key;
        this.refreshToolUI();
        if (this.board.activeTool && d.tip) this.showToast(d.tip);
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
    this.refreshLevelGrid();
  }

  private async enterGame(idx: number) {
    const lvl = ResCache.getLevel(idx);
    if (!lvl) {
      this.showToast('该关卡数据缺失');
      return;
    }
    this.lobby.active = false;
    this.menu.active = false;
    this.game.active = true;
    this.winOverlay.active = false;
    this.loseOverlay.active = false;
    this.warned15 = false;
    this.board.tools = { hammer: 3, magnet: 2, magic: 1, time: 2 };
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
    this.hudTimer.string = `${mm}:${ss}`;
    this.hudTimer.color = t <= 15 ? colorFromHex('#ff8a65') : colorFromHex('#fff8e7');
    this.hudProgress.string = `剩余 ${this.board.remainingGroups()}`;
  }

  private async refreshGoals() {
    if (!this.goalBar || !this.board) return;
    // 保留底条 Graphics，只清目标项
    const keep = this.goalBar.getComponent(Graphics);
    this.goalBar.removeAllChildren();
    if (!keep) {
      const goalBg = this.goalBar.addComponent(Graphics);
      goalBg.fillColor = new Color(120, 70, 30, 55);
      goalBg.roundRect(-(DESIGN_W - 60) / 2, -32, DESIGN_W - 60, 64, 12);
      goalBg.fill();
    }
    const goals = this.board.goals();
    const gap = 58;
    const startX = -((goals.length - 1) * gap) / 2;
    for (let i = 0; i < goals.length; i++) {
      const g = goals[i];
      const item = makeNode('g', this.goalBar, 52, 52);
      item.setPosition(startX + i * gap, 0, 0);
      const bg = item.addComponent(Graphics);
      bg.fillColor = colorFromHex('#fff6e4');
      bg.roundRect(-26, -26, 52, 52, 10);
      bg.fill();
      bg.strokeColor = colorFromHex('#b87a3c');
      bg.lineWidth = 2;
      bg.roundRect(-26, -26, 52, 52, 10);
      bg.stroke();
      const sf = await ResCache.img(g.sprite);
      if (sf) setSprite(makeNode('i', item, 36, 36), sf);
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
    this.winText.string = `第${this.board.levelIndex}关完成！`;
    this.winOverlay.active = true;
  }

  private showToast(msg: string) {
    this.toast.string = msg;
    this.toastNode.active = true;
    this.toastTimer = 1.6;
  }

  private loadProgress(): number {
    try {
      const v = sys.localStorage.getItem(PROGRESS_KEY);
      return Math.max(1, parseInt(v || '1', 10) || 1);
    } catch {
      return 1;
    }
  }

  private saveProgress(nextUnlock: number) {
    this.maxLevel = Math.max(this.maxLevel, nextUnlock);
    try { sys.localStorage.setItem(PROGRESS_KEY, String(this.maxLevel)); } catch (_) { /* */ }
  }
}
