import {
  _decorator, Node, Label, Graphics, Color, UITransform, tween, Vec3, UIOpacity, BlockInputEvents,
} from 'cc';
import { BoardController } from '../blocky/BoardController';
import { DESIGN_H, DESIGN_W, MAX_LEVEL } from '../utils/Constants';
import { colorFromHex } from '../utils/Helpers';
import { ResCache } from '../utils/ResCache';
import { SoundMgr } from '../utils/SoundMgr';
import {
  addLabel, bindTouchEnd, makeNode, mustChild, mustLabel,
  paintRect, paintRoundButton, paintRoundRect, setSprite,
} from '../utils/UIFactory';
import { ViewBase } from '../ui/ViewBase';

const { ccclass } = _decorator;
const OWNER = 'SliderGame';

export interface SliderGameNavHandlers {
  onLobby: () => void;
  onMenu: () => void;
  onNextLevel: (level: number) => void;
}

export interface SliderGameProgressHandlers {
  load: () => number;
  save: (nextUnlock: number) => void;
}

/**
 * game/prefab/SliderGame 局内界面：绑定预制体节点并驱动 BoardController。
 */
@ccclass('SliderGameView')
export class SliderGameView extends ViewBase {
  private boardRoot!: Node;
  private board!: BoardController;

  private hudLevel!: Label;
  private hudTimer!: Label;
  private hudProgress!: Label;
  private goalBar!: Node;
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
  private navHandlers: SliderGameNavHandlers | null = null;
  private progressHandlers: SliderGameProgressHandlers | null = null;
  private storyWinHandler: (() => void) | null = null;
  private warned15 = false;
  private toastTimer = 0;
  private _bound = false;

  setNavigationHandlers(handlers: SliderGameNavHandlers | null) {
    this.navHandlers = handlers;
  }

  setProgressHandlers(handlers: SliderGameProgressHandlers | null) {
    this.progressHandlers = handlers;
  }

  setStoryWinHandler(handler: (() => void) | null) {
    this.storyWinHandler = handler;
  }

  /** 剧情 subview 叠在局内时屏蔽 SliderGame 触摸（棋盘在下层仍会抢点击） */
  setStoryOverlayBlocked(block: boolean) {
    const comp = this.node.getComponent(BlockInputEvents)
      || this.node.addComponent(BlockInputEvents);
    comp.enabled = block;
  }

  getBoard(): BoardController | null {
    return this.board ?? null;
  }

  /** 绑定 SliderGame 预制体节点（实例化后调用一次） */
  async setup(): Promise<void> {
    if (this._bound) return;
    this.bindPrefab();
    this._bound = true;
  }

  async startLevel(idx: number): Promise<boolean> {
    if (idx < 1 || idx > MAX_LEVEL) {
      this.showToast('没有更多关卡了');
      return false;
    }
    const lvl = await ResCache.loadBrLevel(idx);
    if (!lvl) {
      this.showToast(`关卡 ${idx} 加载失败`);
      return false;
    }
    this.warned15 = false;
    this.board.tools = { freeze: 2, magnet: 2, slicer: 3, teleport: 1 };
    this.board.setActiveTool(null);
    await this.board.startLevel(idx, lvl);
    this.refreshToolUI();
    this.refreshHud();
    await this.refreshGoals();
    return true;
  }

  tick(dt: number) {
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

  protected onClose() {
    if (this.board) this.board.running = false;
    this.storyWinHandler = null;
    this.setStoryOverlayBlocked(false);
  }

  private bindPrefab() {
    const root = this.node;
    this.boardRoot = mustChild(root, 'Board', OWNER);
    this.board = new BoardController(this.boardRoot, {
      onHud: () => this.refreshHud(),
      onGoals: () => void this.refreshGoals(),
      onWin: () => this.onWin(),
      onLose: (reason) => this.onLose(reason),
      onToast: (m) => this.showToast(m),
    });

    this.hudLevel = mustLabel(root, 'HUD/level', OWNER);
    this.hudTimer = mustLabel(root, 'HUD/timer/t', OWNER);
    this.hudProgress = mustLabel(root, 'HUD/prog/txt', OWNER);
    this.goalBar = mustChild(root, 'HUD/goals', OWNER);

    paintRoundRect(mustChild(root, 'HUD/timer', OWNER), -122, -35, 245, 69, 32, new Color(70, 40, 18, 230));
    paintRoundRect(mustChild(root, 'HUD/prog', OWNER), -101, -32, 202, 63, 17, new Color(255, 240, 210, 230));
    paintRoundRect(this.goalBar, -(DESIGN_W - 86) / 2, -46, DESIGN_W - 86, 92, 17, new Color(120, 70, 30, 55));

    this.bindTools(mustChild(root, 'tools', OWNER));

    const tipN = mustChild(root, 'tip', OWNER);
    this.tip = mustLabel(root, 'tip/txt', OWNER);
    paintRoundRect(tipN, -446, -29, 893, 58, 20, new Color(90, 52, 26, 170));

    this.toastNode = mustChild(root, 'toast', OWNER);
    this.toast = mustLabel(root, 'toast/txt', OWNER);
    paintRoundRect(this.toastNode, -259, -40, 518, 81, 20, new Color(90, 52, 26, 230));

    this.winOverlay = mustChild(root, 'win', OWNER);
    paintRect(this.winOverlay, -DESIGN_W / 2, -DESIGN_H / 2, DESIGN_W, DESIGN_H, new Color(0, 0, 0, 170));
    this.winConfettiRoot = mustChild(root, 'win/confetti', OWNER);
    this.winPanel = mustChild(root, 'win/panel', OWNER);
    paintRoundRect(this.winPanel, -374, -302, 749, 605, 35, new Color(255, 255, 255, 18));

    const h1Label = mustLabel(root, 'win/panel/h1', OWNER);
    h1Label.enableOutline = true;
    h1Label.outlineColor = colorFromHex('#ffd54f');
    h1Label.outlineWidth = 6;
    this.winText = mustLabel(root, 'win/panel/h2', OWNER);
    const feat = mustChild(root, 'win/panel/feat', OWNER);
    paintRoundRect(feat, -230, -86, 461, 173, 23, new Color(0, 0, 0, 140));
    const fg = feat.getComponent(Graphics)!;
    fg.strokeColor = new Color(255, 255, 255, 80);
    fg.lineWidth = 3;
    fg.roundRect(-230, -86, 461, 173, 23);
    fg.stroke();
    bindTouchEnd(mustChild(root, 'win/panel/next', OWNER), () => {
      SoundMgr.play('click');
      this.winOverlay.active = false;
      this.navHandlers?.onNextLevel(this.board.levelIndex + 1);
    });
    bindTouchEnd(mustChild(root, 'win/panel/home', OWNER), () => {
      SoundMgr.play('click');
      this.winOverlay.active = false;
      this.navHandlers?.onLobby();
    });

    this.loseOverlay = mustChild(root, 'lose', OWNER);
    paintRect(this.loseOverlay, -DESIGN_W / 2, -DESIGN_H / 2, DESIGN_W, DESIGN_H, new Color(90, 52, 26, 220));
    this.loseTitle = mustLabel(root, 'lose/h1', OWNER);
    bindTouchEnd(mustChild(root, 'lose/keep', OWNER), () => {
      SoundMgr.play('click');
      this.loseOverlay.active = false;
      if (this.board.loseReason === 'bomb') this.board.keepPlayingBomb();
      else this.board.keepPlaying(60);
    });
    bindTouchEnd(mustChild(root, 'lose/retry', OWNER), () => {
      SoundMgr.play('click');
      this.navHandlers?.onNextLevel(this.board.levelIndex);
    });
    bindTouchEnd(mustChild(root, 'lose/menu', OWNER), () => {
      SoundMgr.play('click');
      this.navHandlers?.onMenu();
    });

    this.keepOverlay = mustChild(root, 'keep', OWNER);
  }

  private bindTools(parent: Node) {
    const defs: { key: string; tip: string; instant?: boolean }[] = [
      { key: 'freeze', tip: '', instant: true },
      { key: 'magnet', tip: '点击一张图，自动完成' },
      { key: 'slicer', tip: '点击要切开的方块' },
      { key: 'teleport', tip: '选择两块交换位置' },
    ];
    for (const d of defs) {
      const n = mustChild(parent, d.key, OWNER);
      paintRoundButton(n, 115, 115);
      const badge = mustChild(n, 'cnt', OWNER);
      const bg = badge.getComponent(Graphics) || badge.addComponent(Graphics);
      bg.clear();
      bg.fillColor = colorFromHex('#e05030');
      bg.circle(0, 0, 20);
      bg.fill();
      const cnt = mustLabel(n, 'cnt/txt', OWNER);
      this.toolNodes[d.key] = { node: n, cnt };
      n.on(Node.EventType.TOUCH_END, () => {
        if (!this.board?.running) return;
        const left = (this.board.tools as Record<string, number>)[d.key];
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
    const gap = 84;
    const startX = -((goals.length - 1) * gap) / 2;
    for (let i = 0; i < goals.length; i++) {
      const g = goals[i];
      const item = makeNode('g', this.goalBar, 75, 75);
      item.setPosition(startX + i * gap, 0, 0);
      const frame = g.done ? goalFrameBack : goalFrame;
      if (frame) {
        setSprite(item, frame);
      } else {
        const bg = item.addComponent(Graphics);
        bg.fillColor = colorFromHex(g.done ? '#c8e6c9' : '#fff6e4');
        bg.roundRect(-37, -37, 75, 75, 14);
        bg.fill();
        bg.strokeColor = colorFromHex(g.done ? '#43a047' : '#b87a3c');
        bg.lineWidth = 3;
        bg.roundRect(-37, -37, 75, 75, 14);
        bg.stroke();
      }
      if (!g.done) {
        const sf = await ResCache.loadSprite(g.path);
        if (sf) setSprite(makeNode('i', item, 49, 49), sf);
      }
      if (g.done) addLabel(makeNode('ok', item, 58, 35), '✓', 32, '#2e7d32');
    }
  }

  private refreshToolUI() {
    if (!this.board) return;
    for (const k of Object.keys(this.toolNodes)) {
      const left = (this.board.tools as Record<string, number>)[k];
      this.toolNodes[k].cnt.string = String(left);
      const active = this.board.activeTool === k;
      const g = this.toolNodes[k].node.getComponent(Graphics)!;
      g.clear();
      g.fillColor = colorFromHex('#f2d19a');
      g.roundRect(-58, -58, 115, 115, 26);
      g.fill();
      g.strokeColor = colorFromHex(active ? '#e05030' : '#a86a32');
      g.lineWidth = active ? 7 : 6;
      g.roundRect(-58, -58, 115, 115, 26);
      g.stroke();
      this.toolNodes[k].node.setScale(left > 0 ? 1 : 0.85, left > 0 ? 1 : 0.85, 1);
    }
  }

  private onWin() {
    if (this.storyWinHandler) {
      const cb = this.storyWinHandler;
      this.storyWinHandler = null;
      SoundMgr.play('win');
      if (this.progressHandlers) {
        this.progressHandlers.save(this.board.levelIndex + 1);
      }
      cb();
      return;
    }
    SoundMgr.play('win');
    if (this.progressHandlers) {
      this.progressHandlers.save(this.board.levelIndex + 1);
    }
    this.winText.string = `第 ${this.board.levelIndex} 关完成！`;
    this.winOverlay.active = true;
    this.winOverlay.setSiblingIndex(this.node.children.length - 1);
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
      const n = makeNode(`c${i}`, this.winConfettiRoot, 12, 35);
      const x = (Math.random() - 0.5) * DESIGN_W * 0.9;
      const y = DESIGN_H / 2 + 58 + Math.random() * 115;
      n.setPosition(x, y, 0);
      n.angle = Math.random() * 360;
      const g = n.addComponent(Graphics);
      g.fillColor = colorFromHex(colors[i % colors.length]);
      g.rect(-6, -17, 12, 35);
      g.fill();
      const op = n.addComponent(UIOpacity);
      op.opacity = 230;
      const dur = 1.2 + Math.random() * 0.8;
      tween(n)
        .parallel(
          tween().to(dur, { position: new Vec3(x + (Math.random() - 0.5) * 173, -DESIGN_H / 2 - 115, 0) }),
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

  showToast(msg: string) {
    this.toast.string = msg;
    this.toastNode.active = true;
    this.toastTimer = 1.6;
  }
}
