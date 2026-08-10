/**
 * 旧版剧情播放器（已屏蔽：GameApp 仅挂载 GEditorStoryPlayer）。
 * 保留源码便于对照 / 日后恢复；勿在入口重新 addComponent。
 */
import {
  _decorator, BlockInputEvents, Component, EventTouch, instantiate, Node, Sprite, SpriteFrame, Tween, UIOpacity, UITransform, tween,
} from 'cc';
import { DialogueView } from '../dialogue/DialogueView';
import { DESIGN_H, DESIGN_W, STORY_ORDER } from '../utils/Constants';
import { ResCache } from '../utils/ResCache';
import { fullWidget, makeNode, setSprite, disableSpriteTrimSubtree, bindTouchEnd } from '../utils/UIFactory';
import { TipPopup } from '../ui/TipPopup';
import {
  isStoryDialogue, isStoryGameGate, isStorySubview,
  StoryStep, StoryStepDialogue, StoryStepGameGate, StoryStepSubview,
} from './StoryTypes';
import { GEditorStoryPlayback } from './GEditorStoryPlayback';

const { ccclass } = _decorator;

const FADE_SEC = 0.28;
const GATE_BTN_SIZE = 200;
const GATE_BTN_MARGIN_X = 120;
const GATE_BTN_MARGIN_Y = 140;

@ccclass('StoryPlayer')
export class StoryPlayer extends Component implements GEditorStoryPlayback {
  private _storyName = 'story1';
  private _steps: StoryStep[] = [];
  private _index = 0;
  private _busy = false;
  private _frameLayer!: Node;
  private _frameA!: Node;
  private _frameB!: Node;
  private _frameAOpacity!: UIOpacity;
  private _frameBOpacity!: UIOpacity;
  /** true 表示 frameA 为当前可见的一级图 */
  private _frameFrontIsA = true;
  private _subRoot!: Node;
  private _subOpacity!: UIOpacity;
  private _subBg!: Node;
  private _subIcon!: Node;
  private _dialogueView: DialogueView | null = null;
  private _tipPopup: TipPopup | null = null;
  private _gateRoot: Node | null = null;
  private _gateTapCatcher: Node | null = null;
  private _gateBtn: Node | null = null;
  private _gateActive = false;
  private _gateStep: StoryStepGameGate | null = null;
  private _onGameRequest: ((level: number, onWin: () => void) => void) | null = null;
  private _onSubviewClose: (() => void) | null = null;
  private _onFinished: (() => void) | null = null;

  onLoad() {
    const block = this.node.getComponent(BlockInputEvents) || this.node.addComponent(BlockInputEvents);
    block.enabled = true;
    this.node.on(Node.EventType.TOUCH_END, this.onTap, this);

    this._frameLayer = makeNode('frameLayer', this.node, DESIGN_W, DESIGN_H);
    fullWidget(this._frameLayer);

    this._frameA = makeNode('frameA', this._frameLayer, DESIGN_W, DESIGN_H);
    fullWidget(this._frameA);
    setSprite(this._frameA, null);
    this._frameAOpacity = this._frameA.addComponent(UIOpacity);
    this._frameAOpacity.opacity = 255;

    this._frameB = makeNode('frameB', this._frameLayer, DESIGN_W, DESIGN_H);
    fullWidget(this._frameB);
    setSprite(this._frameB, null);
    this._frameBOpacity = this._frameB.addComponent(UIOpacity);
    this._frameBOpacity.opacity = 255;
    this._frameB.active = false;

    this._subRoot = makeNode('subview', this.node, DESIGN_W, DESIGN_H);
    fullWidget(this._subRoot);
    this._subRoot.active = false;
    this._subOpacity = this._subRoot.getComponent(UIOpacity) || this._subRoot.addComponent(UIOpacity);
    this._subOpacity.opacity = 255;

    this._subBg = makeNode('bg', this._subRoot, DESIGN_W, DESIGN_H);
    fullWidget(this._subBg);
    setSprite(this._subBg, null);

    this._subIcon = makeNode('icon', this._subRoot, DESIGN_W, DESIGN_H);
    setSprite(this._subIcon, null);

    const subBlock = this._subRoot.getComponent(BlockInputEvents) || this._subRoot.addComponent(BlockInputEvents);
    subBlock.enabled = true;
    bindTouchEnd(this._subRoot, () => this.onSubviewTap());

    bindTouchEnd(this._frameLayer, () => this.onFrameTap());

    disableSpriteTrimSubtree(this._frameLayer);
    disableSpriteTrimSubtree(this._subRoot);
  }

  onDestroy() {
    this.node.off(Node.EventType.TOUCH_END, this.onTap, this);
    if (this._gateTapCatcher) {
      this._gateTapCatcher.off(Node.EventType.TOUCH_END, this.onGateBgTap, this);
    }
    Tween.stopAllByTarget(this._frameAOpacity);
    Tween.stopAllByTarget(this._frameBOpacity);
    Tween.stopAllByTarget(this._subOpacity);
  }

  /** 注册剧情内请求进入关卡的回调（由 GameApp 注入） */
  setGameRequestHandler(handler: ((level: number, onWin: () => void) => void) | null) {
    this._onGameRequest = handler;
  }

  /** 关闭 subview 时回调（用于一并关闭剧情内 Game） */
  setSubviewCloseHandler(handler: (() => void) | null) {
    this._onSubviewClose = handler;
  }

  private hideMountedStoryGame() {
    if (this._onSubviewClose) this._onSubviewClose();
  }

  /** Game 节点应插入的位置：frameLayer 与 subview 之间 */
  getGameSiblingIndex(): number {
    return this._frameLayer.getSiblingIndex() + 1;
  }

  /** 开始播放指定剧情（默认 story1） */
  async play(storyName = 'story1', onFinished?: () => void) {
    this._storyName = storyName;
    this._onFinished = onFinished || null;
    this._busy = true;
    this.node.active = true;
    this._index = 0;
    this._frameFrontIsA = true;
    this._frameA.active = true;
    this._frameB.active = false;
    this._frameAOpacity.opacity = 255;
    this._frameBOpacity.opacity = 255;
    this.hideSubview();
    this.hideDialogue();
    this.hideGameGate();

    const cfg = await ResCache.loadStoryConfig(storyName);
    if (!cfg || !cfg.steps.length) {
      console.error('story config empty', storyName);
      this.finish();
      return;
    }
    this._steps = cfg.steps;
    await this.presentStep(0, true);
    this._busy = false;
  }

  hide() {
    Tween.stopAllByTarget(this._frameAOpacity);
    Tween.stopAllByTarget(this._frameBOpacity);
    Tween.stopAllByTarget(this._subOpacity);
    this.hideDialogue();
    this.hideGameGate();
    this.node.active = false;
    this._busy = false;
    this._steps = [];
    this._onFinished = null;
    this._frameFrontIsA = true;
    this._frameA.active = true;
    this._frameB.active = false;
    this._frameAOpacity.opacity = 255;
    this._frameBOpacity.opacity = 255;
    this.hideSubview();
  }

  /** 关闭二级界面并清空 icon 上的 SpriteFrame */
  private hideSubview() {
    setSprite(this._subIcon, null);
    Tween.stopAllByTarget(this._subOpacity);
    this._subRoot.active = false;
    this._subOpacity.opacity = 255;
    this.hideMountedStoryGame();
  }

  private onTap(e: EventTouch) {
    e.propagationStopped = true;
    this.onStoryAdvance();
  }

  /** subview 全屏挡板：点击继续（避免触摸落到下层 Game） */
  private onSubviewTap() {
    if (!this._subRoot.active) return;
    this.onStoryAdvance();
  }

  /** 一级图点击继续（subview 未打开时） */
  private onFrameTap() {
    if (this._subRoot.active) return;
    this.onStoryAdvance();
  }

  private onStoryAdvance() {
    if (this._busy || !this.node.active) return;
    if (this._dialogueView?.isOpen()) return;
    if (this._tipPopup?.isOpen()) return;
    if (this._gateActive) {
      void this.showStoryTip(this._gateStep?.tip ?? '123');
      return;
    }
    void this.next();
  }

  private async next() {
    if (this._busy) return;
    if (this._index >= this._steps.length - 1) {
      this.finish();
      return;
    }
    this._busy = true;

    const prev = this._steps[this._index];
    const nextIndex = this._index + 1;
    const next = this._steps[nextIndex];

    if (isStoryDialogue(next)) {
      this._index = nextIndex;
      await this.presentDialogue(next);
    } else if (isStoryGameGate(next)) {
      this._index = nextIndex;
      await this.presentGameGate(next);
    } else if (isStorySubview(next)) {
      this._index = nextIndex;
      await this.presentSubview(next);
    } else if (isStoryDialogue(prev)) {
      await this.leaveDialogueToStep(nextIndex);
    } else if (isStorySubview(prev)) {
      await this.fadeOpacity(this._subOpacity, 0);
      this.hideSubview();
      this._index = nextIndex;
      await this.crossfadeFrame(next as string);
    } else {
      this._index = nextIndex;
      await this.crossfadeFrame(next as string);
    }

    this._busy = false;
  }

  private async presentStep(index: number, isFirst = false) {
    const step = this._steps[index];
    if (isStoryDialogue(step)) {
      await this.presentDialogue(step);
    } else if (isStoryGameGate(step)) {
      await this.presentGameGate(step);
    } else if (isStorySubview(step)) {
      if (!isFirst && !isStorySubview(this._steps[index - 1]) && !isStoryDialogue(this._steps[index - 1])) {
        await this.presentSubview(step);
        return;
      }
      await this.presentSubview(step);
    } else if (isFirst) {
      await this.fadeInFrame(step as string);
    } else {
      await this.crossfadeFrame(step as string);
    }
  }

  private frontFrame() {
    return this._frameFrontIsA
      ? { node: this._frameA, opacity: this._frameAOpacity }
      : { node: this._frameB, opacity: this._frameBOpacity };
  }

  private backFrame() {
    return this._frameFrontIsA
      ? { node: this._frameB, opacity: this._frameBOpacity }
      : { node: this._frameA, opacity: this._frameAOpacity };
  }

  /** 首张一级图渐现 */
  private async fadeInFrame(name: string) {
    this.logStep(this._index);
    this.hideSubview();
    this.hideDialogue();
    this.hideGameGate();
    const front = this.frontFrame();
    const sf = await ResCache.storyStepSprite(this._storyName, name);
    this.applyFullscreenSprite(front.node, sf);
    front.node.active = true;
    front.opacity.opacity = 0;
    await this.fadeOpacity(front.opacity, 255);
    disableSpriteTrimSubtree(this._frameLayer);
    await this.maybeChainDialogueAfterFrame();
  }

  /** 一级界面切换：当前图渐隐，下一张渐现 */
  private async crossfadeFrame(name: string) {
    this.logStep(this._index);
    this.hideSubview();
    this.hideDialogue();
    this.hideGameGate();
    this._frameLayer.active = true;

    const sf = await ResCache.storyStepSprite(this._storyName, name);
    const front = this.frontFrame();
    const back = this.backFrame();

    this.applyFullscreenSprite(back.node, sf);
    back.node.active = true;
    back.opacity.opacity = 0;

    Tween.stopAllByTarget(front.opacity);
    Tween.stopAllByTarget(back.opacity);

    await new Promise<void>((resolve) => {
      let done = 0;
      const onDone = () => {
        done += 1;
        if (done >= 2) resolve();
      };
      tween(front.opacity)
        .to(FADE_SEC, { opacity: 0 })
        .call(onDone)
        .start();
      tween(back.opacity)
        .to(FADE_SEC, { opacity: 255 })
        .call(onDone)
        .start();
    });

    front.node.active = false;
    front.opacity.opacity = 255;
    this._frameFrontIsA = !this._frameFrontIsA;
    disableSpriteTrimSubtree(this._frameLayer);
    await this.maybeChainDialogueAfterFrame();
  }

  /** 一级图渐现完成后，若下一步为对话则自动渐现对话框并逐字打出 */
  private async maybeChainDialogueAfterFrame(): Promise<void> {
    const nextIdx = this._index + 1;
    if (nextIdx >= this._steps.length) return;
    const next = this._steps[nextIdx];
    if (!isStoryDialogue(next)) return;
    this._index = nextIdx;
    await this.presentDialogue(next, { fadeInBeforeTyping: true });
  }

  /** 二级界面叠在一级之上 */
  private async presentSubview(step: StoryStepSubview) {
    this.logStep(this._index);
    this.hideDialogue();
    this.hideGameGate();
    this._frameLayer.active = true;
    this.frontFrame().node.active = true;
    this._subRoot.active = true;

    const [bgSf, iconSf] = await Promise.all([
      ResCache.storyStepSprite(this._storyName, step.bg),
      ResCache.storyStepSprite(this._storyName, step.icon),
    ]);

    this.applyFullscreenSprite(this._subBg, bgSf);
    this.applyNativeSprite(this._subIcon, iconSf);
    this._subIcon.setPosition(0, 0, 0);

    this._subOpacity.opacity = 0;
    await this.fadeOpacity(this._subOpacity, 255);
    disableSpriteTrimSubtree(this._subRoot);
    this.riseSubviewOverlay();
  }

  /** subview 叠在 Game 之上并优先接收点击 */
  private riseSubviewOverlay() {
    if (!this._subRoot.active) return;
    this._subRoot.setSiblingIndex(this.node.children.length - 1);
    this.syncOverlaySiblingOrder();
  }

  /** 一级界面 + 游戏入口：通关后继续剧情 */
  private async presentGameGate(step: StoryStepGameGate): Promise<void> {
    this.logStep(this._index);
    this.hideDialogue();
    this.hideSubview();
    this._gateStep = step;
    this._gateActive = true;

    const sf = await ResCache.storyStepSprite(this._storyName, step.frame);
    const front = this.frontFrame();
    this.applyFullscreenSprite(front.node, sf);
    front.node.active = true;
    front.opacity.opacity = 255;
    this._frameLayer.active = true;

    await this.setupGameGateButton(step);
  }

  /** 关卡通关后由 GameApp 回调 */
  completeGameGate() {
    if (!this._gateActive) return;
    this._gateActive = false;
    this._gateStep = null;
    this.hideGameGateButton();

    const nextIdx = this._index + 1;
    if (nextIdx >= this._steps.length) {
      this.finish();
      return;
    }
    void this.leaveDialogueToStep(nextIdx);
  }

  private onGateBgTap(e: EventTouch) {
    e.propagationStopped = true;
    if (!this._gateActive) return;
    void this.showStoryTip(this._gateStep?.tip ?? '123');
  }

  private async setupGameGateButton(step: StoryStepGameGate) {
    if (!this._gateRoot) {
      this._gateRoot = makeNode('gameGateLayer', this.node, DESIGN_W, DESIGN_H);
      fullWidget(this._gateRoot);
    }
    this._gateRoot.active = true;

    if (!this._gateTapCatcher) {
      this._gateTapCatcher = makeNode('gateTapCatcher', this._gateRoot, DESIGN_W, DESIGN_H);
      fullWidget(this._gateTapCatcher);
      this._gateTapCatcher.on(Node.EventType.TOUCH_END, this.onGateBgTap, this);
    }
    this._gateTapCatcher.active = true;

    if (this._gateBtn) {
      this._gateBtn.off(Node.EventType.TOUCH_END);
      this._gateBtn.destroy();
      this._gateBtn = null;
    }

    const btnName = step.btn || 'gametubiao';
    const sf = await ResCache.storyStepSprite(this._storyName, btnName);
    const btn = makeNode('gameEntryBtn', this._gateRoot, GATE_BTN_SIZE, GATE_BTN_SIZE);
    btn.setPosition(
      DESIGN_W / 2 - GATE_BTN_MARGIN_X,
      -DESIGN_H / 2 + GATE_BTN_MARGIN_Y,
      0,
    );
    if (sf) {
      setSprite(btn, sf, Sprite.SizeMode.TRIMMED);
      const ut = btn.getComponent(UITransform);
      if (ut) {
        const maxDim = Math.max(sf.width, sf.height);
        const scale = GATE_BTN_SIZE / maxDim;
        btn.setScale(scale, scale, 1);
      }
    }
    btn.on(Node.EventType.TOUCH_END, (e: EventTouch) => {
      e.propagationStopped = true;
      if (!this._gateActive || !this._onGameRequest) {
        console.error('game gate handler missing');
        return;
      }
      this.hideGameGateLayerOnly();
      this._onGameRequest(step.level, () => this.completeGameGate());
    });
    this._gateBtn = btn;
    this.syncOverlaySiblingOrder();
    this._gateTapCatcher.setSiblingIndex(0);
    btn.setSiblingIndex(1);
  }

  /** gameGateLayer 在 Tip 之上（提示不挡住游戏入口） */
  private syncOverlaySiblingOrder() {
    const tipNode = this._tipPopup?.node;
    const gateNode = this._gateRoot;
    const tipOnTree = tipNode?.parent === this.node;
    const gateOnTree = gateNode?.parent === this.node;

    if (tipOnTree && gateOnTree) {
      gateNode!.setSiblingIndex(this.node.children.length - 1);
      tipNode!.setSiblingIndex(this.node.children.length - 2);
    } else if (gateOnTree && gateNode?.active) {
      gateNode.setSiblingIndex(this.node.children.length - 1);
    } else if (tipOnTree) {
      tipNode!.setSiblingIndex(this.node.children.length - 1);
    }
  }

  private hideGameGateButton() {
    if (this._gateBtn) {
      this._gateBtn.off(Node.EventType.TOUCH_END);
      this._gateBtn.destroy();
      this._gateBtn = null;
    }
    if (this._gateRoot) this._gateRoot.active = false;
    if (this._gateTapCatcher) this._gateTapCatcher.active = false;
  }

  /** 进入局内：仅隐藏 gameGateLayer，保留 gate 状态供通关后 completeGameGate */
  hideGameGateLayerOnly() {
    if (this._gateRoot) this._gateRoot.active = false;
    if (this._tipPopup?.isOpen()) this._tipPopup.hide();
  }

  /** 进局失败时恢复 gameGateLayer */
  showGameGateLayerOnly() {
    if (!this._gateActive || !this._gateRoot) return;
    this._gateRoot.active = true;
    if (this._gateTapCatcher) this._gateTapCatcher.active = true;
    this.syncOverlaySiblingOrder();
  }

  private hideGameGate() {
    this._gateActive = false;
    this._gateStep = null;
    this.hideGameGateButton();
    if (this._tipPopup?.isOpen()) this._tipPopup.hide();
  }

  private async showStoryTip(text: string) {
    const tip = await this.ensureTipPopup();
    if (!tip) return;
    tip.showTip(text);
    this.syncOverlaySiblingOrder();
  }

  private async ensureTipPopup(): Promise<TipPopup | null> {
    if (this._tipPopup) return this._tipPopup;
    const prefab = await ResCache.loadComPrefab('prefab/Tip');
    if (!prefab) {
      console.error('Tip prefab missing in com bundle');
      return null;
    }
    const node = instantiate(prefab);
    node.name = 'Tip';
    this.node.addChild(node);
    fullWidget(node);
    node.active = false;
    this._tipPopup = node.getComponent(TipPopup) || node.addComponent(TipPopup);
    return this._tipPopup;
  }

  /** 通用对话弹窗（com/duihuakuang + mingzi），叠在当前一级图之上 */
  private async presentDialogue(
    step: StoryStepDialogue,
    opts?: { fadeInBeforeTyping?: boolean },
  ): Promise<void> {
    this.logStep(this._index);
    this._frameLayer.active = true;
    this.frontFrame().node.active = true;

    const view = await this.ensureDialogueView();
    if (!view) return;

    const onDialogueClose = () => {
      const nextIdx = this._index + 1;
      if (nextIdx >= this._steps.length) {
        this.finish();
        return Promise.resolve();
      }
      return this.leaveDialogueToStep(nextIdx);
    };

    if (opts?.fadeInBeforeTyping) {
      return new Promise((resolve) => {
        void view.showAfterFade(step.speaker, step.text, () => {
          void onDialogueClose().then(() => resolve());
        });
      });
    }

    return new Promise((resolve) => {
      view.show(step.speaker, step.text, () => {
        void onDialogueClose().then(() => resolve());
      });
    });
  }

  /** 关闭对话并展示后续剧情步 */
  private async leaveDialogueToStep(nextIndex: number): Promise<void> {
    this.hideDialogue();
    this.hideGameGate();
    this._index = nextIndex;
    const step = this._steps[nextIndex];
    if (isStorySubview(step)) {
      await this.presentSubview(step);
    } else {
      this.hideMountedStoryGame();
      if (isStoryGameGate(step)) {
        await this.presentGameGate(step);
      } else if (isStoryDialogue(step)) {
        await this.presentDialogue(step);
      } else {
        await this.crossfadeFrame(step as string);
      }
    }
  }

  private async ensureDialogueView(): Promise<DialogueView | null> {
    if (this._dialogueView) return this._dialogueView;
    const prefab = await ResCache.loadComPrefab('prefab/Dialogue');
    if (!prefab) {
      console.error('Dialogue prefab missing in com bundle');
      return null;
    }
    const node = instantiate(prefab);
    node.name = 'Dialogue';
    this.node.addChild(node);
    fullWidget(node);
    node.active = false;
    this._dialogueView = node.getComponent(DialogueView) || node.addComponent(DialogueView);
    return this._dialogueView;
  }

  private hideDialogue() {
    if (this._dialogueView) {
      this._dialogueView.hide();
    }
  }

  private applyFullscreenSprite(node: Node, sf: SpriteFrame | null) {
    setSprite(node, sf, Sprite.SizeMode.CUSTOM);
    const ut = node.getComponent(UITransform);
    if (ut) ut.setContentSize(DESIGN_W, DESIGN_H);
  }

  private applyNativeSprite(node: Node, sf: SpriteFrame | null) {
    setSprite(node, sf, Sprite.SizeMode.TRIMMED);
    if (sf) {
      const ut = node.getComponent(UITransform);
      if (ut) ut.setContentSize(sf.width, sf.height);
    }
  }

  private fadeOpacity(target: UIOpacity, opacity: number): Promise<void> {
    return new Promise((resolve) => {
      Tween.stopAllByTarget(target);
      tween(target)
        .to(FADE_SEC, { opacity })
        .call(() => resolve())
        .start();
    });
  }

  /** 打印当前步下标与资源名 */
  private logStep(index: number) {
    const step = this._steps[index];
    if (!step) return;
    if (isStorySubview(step)) {
      console.log(
        `[Story:${this._storyName}] step ${index}: subview bg=sprite/step/${step.bg}, icon=sprite/step/${step.icon}`,
      );
    } else if (isStoryDialogue(step)) {
      console.log(
        `[Story:${this._storyName}] step ${index}: dialogue speaker="${step.speaker}" text="${step.text}" (com/duihuakuang, com/mingzi)`,
      );
    } else if (isStoryGameGate(step)) {
      console.log(
        `[Story:${this._storyName}] step ${index}: gameGate frame=sprite/step/${step.frame}, btn=sprite/step/${step.btn || 'gametubiao'}, level=${step.level}`,
      );
    } else {
      console.log(`[Story:${this._storyName}] step ${index}: sprite/step/${step}`);
    }
  }

  private finish() {
    void this.finishWithComingSoon();
  }

  /** 当前剧情播完：有下一章则续播，否则弹提示并停留（不跳转大厅） */
  private async finishWithComingSoon() {
    if (this._busy) return;
    this._busy = true;

    const nextName = this.nextStoryName(this._storyName);
    if (nextName) {
      const nextCfg = await ResCache.loadStoryConfig(nextName).catch(() => null);
      if (nextCfg?.steps?.length) {
        this._busy = false;
        await this.play(nextName, this._onFinished || undefined);
        return;
      }
    }

    const tip = await this.ensureTipPopup();
    if (tip) {
      tip.showTip('敬请期待', () => {
        this._busy = false;
      });
      this.syncOverlaySiblingOrder();
    } else {
      this._busy = false;
    }
  }

  private nextStoryName(current: string): string | null {
    // 只串联 STORY_ORDER 中已有的剧情，避免探测不存在的 story2 刷预览错误
    const i = STORY_ORDER.indexOf(current);
    if (i < 0 || i >= STORY_ORDER.length - 1) return null;
    return STORY_ORDER[i + 1];
  }
}
