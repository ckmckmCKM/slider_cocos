import {
  _decorator, Component, Node, Graphics, sys, UITransform, view, ResolutionPolicy, instantiate,
} from 'cc';
import { DESIGN_H, DESIGN_W, MAX_LEVEL, PROGRESS_KEY } from '../utils/Constants';
import { colorFromHex } from '../utils/Helpers';
import { ResCache } from '../utils/ResCache';
import { SoundMgr } from '../utils/SoundMgr';
import { fullWidget, makeNode } from '../utils/UIFactory';
import { StoryPlayer } from '../story/StoryPlayer';
import { SliderGameView } from './SliderGameView';
import { LobbyView } from '../home/LobbyView';
import { MenuView } from '../home/MenuView';

const { ccclass } = _decorator;

@ccclass('GameApp')
export class GameApp extends Component {
  private lobbyView!: LobbyView;
  private menuView!: MenuView;
  private gameNode: Node | null = null;
  private sliderGame: SliderGameView | null = null;
  private storyRoot!: Node;
  private storyPlayer!: StoryPlayer;

  private maxLevel = 1;

  async onLoad() {
    view.setDesignResolutionSize(DESIGN_W, DESIGN_H, ResolutionPolicy.SHOW_ALL);
    this.maxLevel = this.loadProgress();
    await SoundMgr.init(this.node);
    await this.buildUI();
    void this.enterStory('story1');
  }

  update(dt: number) {
    this.sliderGame?.tick(dt);
  }

  private async buildUI() {
    const canvas = this.node;
    let ut = canvas.getComponent(UITransform);
    if (!ut) ut = canvas.addComponent(UITransform);
    ut.setContentSize(DESIGN_W, DESIGN_H);
    fullWidget(canvas);

    const lobbyPrefab = await ResCache.loadHomePrefab('prefab/Lobby');
    if (!lobbyPrefab) throw new Error('home/prefab/Lobby missing');
    const lobbyNode = instantiate(lobbyPrefab);
    lobbyNode.name = 'Lobby';
    canvas.addChild(lobbyNode);
    fullWidget(lobbyNode);
    this.lobbyView = lobbyNode.getComponent(LobbyView) || lobbyNode.addComponent(LobbyView);
    this.lobbyView.setHandlers({
      onStart: () => void this.enterGame(this.loadProgress()),
      onSelect: () => this.showMenu(),
      onStory: () => void this.enterStory('story1'),
    });
    await this.lobbyView.setup();
    this.lobbyView.hide();

    const menuPrefab = await ResCache.loadHomePrefab('prefab/Menu');
    if (!menuPrefab) throw new Error('home/prefab/Menu missing');
    const menuNode = instantiate(menuPrefab);
    menuNode.name = 'Menu';
    canvas.addChild(menuNode);
    fullWidget(menuNode);
    menuNode.active = false;
    this.menuView = menuNode.getComponent(MenuView) || menuNode.addComponent(MenuView);
    this.menuView.setHandlers({
      onBack: () => this.showLobby(),
      onEnterLevel: (level) => void this.enterGame(level),
      onLockedLevel: () => {
        void this.ensureSliderGameOnCanvas().then((g) => {
          g.showToast('先通关前面的关卡解锁');
        });
      },
      getMaxLevel: () => this.loadProgress(),
    });
    await this.menuView.setup();

    this.storyRoot = makeNode('Story', canvas, DESIGN_W, DESIGN_H);
    fullWidget(this.storyRoot);
    this.storyRoot.active = false;
    const storyBg = makeNode('bg', this.storyRoot, DESIGN_W, DESIGN_H);
    fullWidget(storyBg);
    const g = storyBg.addComponent(Graphics);
    g.fillColor = colorFromHex('#000000');
    g.rect(-DESIGN_W / 2, -DESIGN_H / 2, DESIGN_W, DESIGN_H);
    g.fill();
    this.storyPlayer = this.storyRoot.addComponent(StoryPlayer);
    this.storyPlayer.setSubviewCloseHandler(() => this.hideStoryGameIfMounted());
    this.storyPlayer.setStoryGameOverlayHandler((blocked) => {
      if (this.gameNode?.parent === this.storyRoot) {
        this.sliderGame?.setStoryOverlayBlocked(blocked);
      }
    });
  }

  /** 首次需要时再创建 SliderGame 预制体 */
  private async ensureSliderGame(): Promise<SliderGameView> {
    if (this.sliderGame) return this.sliderGame;

    const gamePrefab = await ResCache.loadPrefab('prefab/SliderGame');
    if (!gamePrefab) throw new Error('prefab/SliderGame missing');
    const gameNode = instantiate(gamePrefab);
    gameNode.name = 'Game';
    gameNode.active = false;
    this.gameNode = gameNode;
    this.sliderGame = gameNode.getComponent(SliderGameView) || gameNode.addComponent(SliderGameView);
    this.sliderGame.setNavigationHandlers({
      onLobby: () => this.showLobby(),
      onMenu: () => this.showMenu(),
      onNextLevel: (level) => void this.enterGame(level),
    });
    this.sliderGame.setProgressHandlers({
      load: () => this.loadProgress(),
      save: (n) => this.saveProgress(n),
    });
    await this.sliderGame.setup();
    return this.sliderGame;
  }

  private mountSliderGame(parent: Node, siblingIndex?: number) {
    if (!this.gameNode) return;
    fullWidget(this.gameNode);
    if (this.gameNode.parent !== parent) {
      parent.addChild(this.gameNode);
    }
    if (siblingIndex !== undefined) {
      this.gameNode.setSiblingIndex(siblingIndex);
    }
  }

  private async ensureSliderGameOnCanvas(): Promise<SliderGameView> {
    const game = await this.ensureSliderGame();
    this.mountSliderGame(this.node);
    return game;
  }

  private async ensureSliderGameOnStory(): Promise<SliderGameView> {
    const game = await this.ensureSliderGame();
    this.mountSliderGame(this.storyRoot, this.storyPlayer.getGameSiblingIndex());
    return game;
  }

  /** subview 关闭时隐藏挂在 Story 下的 Game（保留节点，供下次 subview 复用） */
  private hideStoryGameIfMounted() {
    this.sliderGame?.setStoryOverlayBlocked(false);
    if (this.gameNode?.parent === this.storyRoot) {
      this.sliderGame?.hide();
    }
  }

  private detachGameFromStory() {
    if (this.gameNode?.parent === this.storyRoot) {
      this.sliderGame?.hide();
      this.mountSliderGame(this.node);
    }
  }

  private showLobby() {
    this.lobbyView.open();
    this.menuView.hide();
    this.detachGameFromStory();
    this.sliderGame?.hide();
    if (this.storyRoot) this.storyRoot.active = false;
    this.sliderGame?.setStoryWinHandler(null);
  }

  private showMenu() {
    this.lobbyView.hide();
    this.menuView.open();
    this.detachGameFromStory();
    this.sliderGame?.hide();
    if (this.storyRoot) this.storyRoot.active = false;
    this.sliderGame?.setStoryWinHandler(null);
  }

  private async enterStory(storyName = 'story1') {
    this.lobbyView.hide();
    this.menuView.hide();
    this.detachGameFromStory();
    this.sliderGame?.hide();
    this.sliderGame?.setStoryWinHandler(null);
    this.storyRoot.active = true;
    this.storyPlayer.setGameRequestHandler((level, onWin) => {
      void this.enterGameFromStory(level, onWin);
    });
    await this.storyPlayer.play(storyName, () => {
      this.storyPlayer.setGameRequestHandler(null);
      this.detachGameFromStory();
      this.showLobby();
    });
  }

  private async enterGameFromStory(level: number, onWin: () => void) {
    const game = await this.ensureSliderGameOnStory();
    game.setStoryWinHandler(() => {
      onWin();
    });
    const ok = await game.startLevel(level);
    if (!ok) {
      game.setStoryWinHandler(null);
      this.storyPlayer.showGameGateLayerOnly();
      return;
    }
    this.lobbyView.hide();
    this.menuView.hide();
    game.setStoryOverlayBlocked(false);
    game.open();
  }

  private async enterGame(idx: number) {
    const game = await this.ensureSliderGameOnCanvas();
    game.setStoryWinHandler(null);
    const ok = await game.startLevel(idx);
    if (!ok) return;
    this.lobbyView.hide();
    this.menuView.hide();
    if (this.storyRoot) this.storyRoot.active = false;
    game.open();
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
    try { sys.localStorage.setItem(PROGRESS_KEY, String(this.maxLevel)); } catch { /* */ }
  }
}
