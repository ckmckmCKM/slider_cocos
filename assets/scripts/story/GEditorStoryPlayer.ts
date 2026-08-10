/**
 * GEditor 剧情播放器（geditor-cocos 格式）
 *
 * 骨架能力：sequence 主链、frame 渐隐渐现、同帧对话、popup 热点、game 关卡节点。
 * 待补：autoSkip blur/mosaic 视觉效果、语音 audioFile、非 fade 转场、popup 黑底 heidi 配对。
 */
import {
  _decorator, BlockInputEvents, Component, EventTouch, instantiate, Node, Sprite, SpriteFrame, Tween, UIOpacity, UITransform, tween,
} from 'cc';
import { DialogueView } from '../dialogue/DialogueView';
import { DESIGN_H, DESIGN_W } from '../utils/Constants';
import { ResCache } from '../utils/ResCache';
import {
  fullWidget, makeNode, setSprite, disableSpriteTrimSubtree, bindTouchEnd,
} from '../utils/UIFactory';
import { TipPopup } from '../ui/TipPopup';
import { GEditorStoryPlayback } from './GEditorStoryPlayback';
import {
  GEditorFrameNode, GEditorGameNode, GEditorPopupNode, GEditorPopupTrigger, GEditorStoryConfig, GEditorStoryNode,
  geditorNodeHasCaption, geditorPopupExecBg, geditorPopupExecIcon, geditorTextureStepName,
  inferPopupExecFromLegacyFrameName, isGEditorFrameNode, isGEditorGameNode, isGEditorPopupExecNode,
  resolveGateBtnLayout,
} from './GEditorTypes';

const { ccclass } = _decorator;

const DEFAULT_FADE_SEC = 0.5;
const DEFAULT_GAME_TIP = '123';

@ccclass('GEditorStoryPlayer')
export class GEditorStoryPlayer extends Component implements GEditorStoryPlayback {
  private _storyName = 'story1';
  private _config: GEditorStoryConfig | null = null;
  private _nodeById = new Map<string, GEditorStoryNode>();
  private _sequence: string[] = [];
  private _seqIndex = 0;
  private _busy = false;
  private _fadeSec = DEFAULT_FADE_SEC;

  private _frameLayer!: Node;
  private _frameA!: Node;
  private _frameB!: Node;
  private _frameAOpacity!: UIOpacity;
  private _frameBOpacity!: UIOpacity;
  private _frameFrontIsA = true;

  private _popupRoot!: Node;
  private _popupOpacity!: UIOpacity;
  private _popupIcon!: Node;
  private _popupOpen = false;
  private _popupHostFrameId: string | null = null;
  private _popupShownForHost = false;

  private _subRoot!: Node;
  private _subOpacity!: UIOpacity;
  private _subBg!: Node;
  private _subIcon!: Node;
  private _subviewActive = false;

  private _dialogueView: DialogueView | null = null;
  private _tipPopup: TipPopup | null = null;

  private _gateRoot: Node | null = null;
  private _gateTapCatcher: Node | null = null;
  private _gateBtn: Node | null = null;
  private _gameActive = false;
  private _gameLevel = 1;
  private _gameTip = DEFAULT_GAME_TIP;
  private _gateBtnName = 'gametubiao';
  private _gateBtnMarginX = 120;
  private _gateBtnMarginY = 140;
  private _gateBtnSize = 200;

  private _holdTimer: ReturnType<typeof setTimeout> | null = null;
  private _autoSkipTimer: ReturnType<typeof setTimeout> | null = null;
  private _fadeResolvers = new Map<UIOpacity, () => void>();

  private _onGameRequest: ((level: number, onWin: () => void) => void) | null = null;
  private _onSubviewClose: (() => void) | null = null;
  private _onFinished: (() => void) | null = null;

  onLoad() {
    const block = this.node.getComponent(BlockInputEvents) || this.node.addComponent(BlockInputEvents);
    block.enabled = true;
    this.node.on(Node.EventType.TOUCH_END, this.onRootTap, this);

    this._frameLayer = makeNode('geditorFrameLayer', this.node, DESIGN_W, DESIGN_H);
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

    this._popupRoot = makeNode('geditorPopup', this.node, DESIGN_W, DESIGN_H);
    fullWidget(this._popupRoot);
    this._popupRoot.active = false;
    this._popupOpacity = this._popupRoot.getComponent(UIOpacity) || this._popupRoot.addComponent(UIOpacity);
    this._popupOpacity.opacity = 255;
    this._popupIcon = makeNode('icon', this._popupRoot, DESIGN_W, DESIGN_H);
    setSprite(this._popupIcon, null);
    bindTouchEnd(this._popupRoot, () => this.onPopupTap());

    this._subRoot = makeNode('geditorSubview', this.node, DESIGN_W, DESIGN_H);
    fullWidget(this._subRoot);
    this._subRoot.active = false;
    this._subOpacity = this._subRoot.getComponent(UIOpacity) || this._subRoot.addComponent(UIOpacity);
    this._subOpacity.opacity = 255;
    this._subBg = makeNode('bg', this._subRoot, DESIGN_W, DESIGN_H);
    fullWidget(this._subBg);
    setSprite(this._subBg, null);
    this._subIcon = makeNode('icon', this._subRoot, DESIGN_W, DESIGN_H);
    setSprite(this._subIcon, null);
    bindTouchEnd(this._subRoot, () => this.onSubviewTap());

    this._frameLayer.on(Node.EventType.TOUCH_END, this.onFrameTap, this);

    disableSpriteTrimSubtree(this._frameLayer);
    disableSpriteTrimSubtree(this._popupRoot);
    disableSpriteTrimSubtree(this._subRoot);
  }

  onDestroy() {
    this.clearSchedulers();
    if (this.node?.isValid) {
      this.node.off(Node.EventType.TOUCH_END, this.onRootTap, this);
    }
    if (this._frameLayer?.isValid) {
      this._frameLayer.off(Node.EventType.TOUCH_END, this.onFrameTap, this);
    }
    if (this._gateTapCatcher?.isValid) {
      this._gateTapCatcher.off(Node.EventType.TOUCH_END, this.onGateBgTap, this);
    }
    if (this._frameAOpacity) this.stopOpacityTween(this._frameAOpacity);
    if (this._frameBOpacity) this.stopOpacityTween(this._frameBOpacity);
    if (this._popupOpacity) this.stopOpacityTween(this._popupOpacity);
    if (this._subOpacity) this.stopOpacityTween(this._subOpacity);
  }

  setGameRequestHandler(handler: ((level: number, onWin: () => void) => void) | null) {
    this._onGameRequest = handler;
  }

  setSubviewCloseHandler(handler: (() => void) | null) {
    this._onSubviewClose = handler;
  }

  getGameSiblingIndex(): number {
    return this._frameLayer.getSiblingIndex() + 1;
  }

  async play(storyName = 'story1', onFinished?: () => void) {
    this._storyName = storyName;
    this._onFinished = onFinished || null;
    this.clearSchedulers();
    this._busy = true;
    this.node.active = true;
    this.resetVisualState();

    const cfg = await ResCache.loadGEditorStoryConfig(storyName);
    if (!cfg || !cfg.sequence.length) {
      console.error('[GEditorStory] config empty', storyName);
      void this.finish();
      return;
    }

    this._config = cfg;
    this._fadeSec = Math.max(0.05, (cfg.transition?.durationMs || 500) / 1000);
    this._nodeById = new Map(cfg.nodes.map((n) => [n.id, n]));
    this._sequence = cfg.sequence.filter((id) => this._nodeById.has(id));
    if (!this._sequence.length) {
      console.error('[GEditorStory] sequence has no valid nodes', storyName);
      void this.finish();
      return;
    }

    this._seqIndex = 0;
    await this.presentSequenceIndex(0, true);
    this._busy = false;
  }

  hide() {
    this.clearSchedulers();
    this.stopOpacityTween(this._frameAOpacity);
    this.stopOpacityTween(this._frameBOpacity);
    this.stopOpacityTween(this._popupOpacity);
    this.stopOpacityTween(this._subOpacity);
    this.hideDialogue();
    this.hideGameGate();
    this.hidePopup();
    this.hideSubview();
    this.node.active = false;
    this._busy = false;
    this._config = null;
    this._nodeById.clear();
    this._sequence = [];
    this._onFinished = null;
    this._frameFrontIsA = true;
    this._frameA.active = true;
    this._frameB.active = false;
    this._frameAOpacity.opacity = 255;
    this._frameBOpacity.opacity = 255;
  }

  /** 关卡通关后由 GameApp 回调 */
  completeGameNode() {
    if (!this._gameActive) return;
    this._gameActive = false;
    this.hideGameGateButton();
    void this.advanceSequence();
  }

  showGameGateLayerOnly() {
    if (!this._gameActive || !this._gateRoot) return;
    this._gateRoot.active = true;
    if (this._gateTapCatcher) this._gateTapCatcher.active = true;
    this.syncOverlaySiblingOrder();
  }

  hideGameGateLayerOnly() {
    if (this._gateRoot) this._gateRoot.active = false;
    if (this._tipPopup?.isOpen()) this._tipPopup.hide();
  }

  private resetVisualState() {
    this._seqIndex = 0;
    this._frameFrontIsA = true;
    this._frameA.active = true;
    this._frameB.active = false;
    this._frameAOpacity.opacity = 255;
    this._frameBOpacity.opacity = 255;
    this.hidePopup();
    this.hideSubview();
    this.hideDialogue();
    this.hideGameGate();
    this._popupShownForHost = false;
    this._popupHostFrameId = null;
  }

  private currentNode(): GEditorStoryNode | null {
    const id = this._sequence[this._seqIndex];
    return id ? this._nodeById.get(id) || null : null;
  }

  private clearSchedulers() {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
    if (this._autoSkipTimer) {
      clearTimeout(this._autoSkipTimer);
      this._autoSkipTimer = null;
    }
  }

  private hideMountedStoryGame() {
    if (this._onSubviewClose) this._onSubviewClose();
  }

  private onRootTap(e: EventTouch) {
    e.propagationStopped = true;
    this.onStoryAdvance();
  }

  private onFrameTap(e: EventTouch) {
    e.propagationStopped = true;
    if (this._popupOpen) return;
    const node = this.currentNode();
    if (!node || !isGEditorFrameNode(node) || !node.popup) {
      this.onStoryAdvance();
      return;
    }

    const ui = this._frameLayer.getComponent(UITransform);
    if (!ui) {
      this.onStoryAdvance();
      return;
    }
    const local = ui.convertToNodeSpaceAR(e.getUILocation());
    if (this.hitPopupTrigger(local.x, local.y, node.popup.trigger)) {
      void this.openPopup(node);
    } else if (!this._popupShownForHost || this._popupHostFrameId !== node.id) {
      void this.showStoryTip('点击高亮区域继续');
    } else {
      this.onStoryAdvance();
    }
  }

  private onPopupTap() {
    if (this._busy || !this._popupOpen) return;
    this.hidePopup();
    this.onStoryAdvance();
  }

  private onSubviewTap() {
    if (this._busy || !this._subviewActive) return;
    this.hideSubview();
    this.onStoryAdvance();
  }

  private onStoryAdvance() {
    if (this._busy || !this.node.active) return;
    if (this._dialogueView?.isOpen()) return;
    if (this._tipPopup?.isOpen()) return;
    if (this._popupOpen) return;
    if (this._subviewActive) return;
    if (this._gameActive) {
      void this.showStoryTip(this._gameTip);
      return;
    }

    const node = this.currentNode();
    if (node && isGEditorFrameNode(node) && node.popup && !this.popupRequirementMet(node)) {
      void this.showStoryTip('点击高亮区域继续');
      return;
    }

    void this.advanceSequence();
  }

  private popupRequirementMet(frame: GEditorFrameNode): boolean {
    if (!frame.popup) return true;
    return this._popupShownForHost && this._popupHostFrameId === frame.id;
  }

  private async advanceSequence() {
    if (this._busy) return;
    this.clearSchedulers();

    if (this._seqIndex >= this._sequence.length - 1) {
      void this.finish();
      return;
    }

    this._busy = true;
    this._seqIndex += 1;
    this._popupShownForHost = false;
    this._popupHostFrameId = null;
    await this.presentSequenceIndex(this._seqIndex, false);
    this._busy = false;
  }

  private async presentSequenceIndex(index: number, isFirst: boolean) {
    const node = this._nodeById.get(this._sequence[index]);
    if (!node) {
      console.error('[GEditorStory] missing node', this._sequence[index]);
      void this.finish();
      return;
    }

    if (isGEditorGameNode(node)) {
      await this.presentGameNode(node);
      return;
    }

    if (isGEditorPopupExecNode(node)) {
      await this.presentPopupExecNode(node);
      return;
    }

    if (isGEditorFrameNode(node)) {
      const stepName = geditorTextureStepName(node.textureFile);
      if (!stepName) {
        const inferred = inferPopupExecFromLegacyFrameName(node.name);
        if (inferred) {
          await this.presentPopupExecNode({
            id: node.id,
            name: node.name,
            order: node.order,
            next: node.next,
            nextExplicit: node.nextExplicit,
            kind: 'popup',
            mode: 'auto',
            bgFile: inferred.bg,
            iconFile: inferred.icon,
          });
          return;
        }
        console.warn('[GEditorStory] frame without texture, skip', node.id);
        await this.skipToNextPresentableNode();
        return;
      }
      if (isFirst) {
        await this.fadeInFrame(stepName, node);
      } else {
        await this.crossfadeFrame(stepName, node);
      }
    }
  }

  private async skipToNextPresentableNode(): Promise<void> {
    while (this._seqIndex < this._sequence.length - 1) {
      this._seqIndex += 1;
      this._popupShownForHost = false;
      this._popupHostFrameId = null;
      const next = this.currentNode();
      if (!next) continue;

      if (isGEditorPopupExecNode(next) || isGEditorGameNode(next)) {
        await this.presentSequenceIndex(this._seqIndex, false);
        return;
      }

      if (isGEditorFrameNode(next)) {
        const stepName = geditorTextureStepName(next.textureFile);
        if (stepName) {
          await this.presentSequenceIndex(this._seqIndex, false);
          return;
        }
        const inferred = inferPopupExecFromLegacyFrameName(next.name);
        if (inferred) {
          await this.presentPopupExecNode({
            id: next.id,
            name: next.name,
            order: next.order,
            next: next.next,
            nextExplicit: next.nextExplicit,
            kind: 'popup',
            mode: 'auto',
            bgFile: inferred.bg,
            iconFile: inferred.icon,
          });
          return;
        }
      }
    }
    void this.finish();
  }

  private async presentGameNode(node: GEditorGameNode) {
    this.logNode(node);
    this.hideDialogue();
    this.hidePopup();
    this.hideSubview();
    this._gameActive = true;
    this._gameLevel = this.resolveLevelId(node.levelId);
    this._gameTip = node.gateTip?.trim() || DEFAULT_GAME_TIP;
    this._gateBtnName = geditorTextureStepName(node.gateBtn) || 'gametubiao';
    const layout = resolveGateBtnLayout(node);
    this._gateBtnMarginX = layout.marginX;
    this._gateBtnMarginY = layout.marginY;
    this._gateBtnSize = layout.size;

    const gateName = geditorTextureStepName(node.gateFrame) || '3';
    const sf = await ResCache.storyStepSprite(this._storyName, gateName);
    const front = this.frontFrame();
    this.applyFullscreenSprite(front.node, sf);
    front.node.active = true;
    front.opacity.opacity = 255;
    this._frameLayer.active = true;

    await this.setupGameGateButton();
  }

  private async presentPopupExecNode(node: GEditorPopupNode) {
    this.logNode(node);
    this.hideDialogue();
    this.hidePopup();
    this.hideGameGate();
    this._frameLayer.active = true;
    this.frontFrame().node.active = true;

    const bgName = geditorTextureStepName(geditorPopupExecBg(node));
    const iconName = geditorTextureStepName(geditorPopupExecIcon(node));
    const [bgSf, iconSf] = await Promise.all([
      bgName ? ResCache.storyStepSprite(this._storyName, bgName) : null,
      iconName ? ResCache.storyStepSprite(this._storyName, iconName) : null,
    ]);

    this.applyFullscreenSprite(this._subBg, bgSf);
    this.applyNativeSprite(this._subIcon, iconSf);
    this._subIcon.setPosition(0, 0, 0);

    this._subRoot.active = true;
    this._subviewActive = true;
    this._subOpacity.opacity = 0;
    await this.fadeOpacity(this._subOpacity, 255);
    disableSpriteTrimSubtree(this._subRoot);
    this._subRoot.setSiblingIndex(this.node.children.length - 1);
  }

  private hideSubview() {
    setSprite(this._subIcon, null);
    this.stopOpacityTween(this._subOpacity);
    this._subRoot.active = false;
    this._subOpacity.opacity = 255;
    this._subviewActive = false;
    this.hideMountedStoryGame();
  }

  private resolveLevelId(raw: number | string | undefined): number {
    if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(1, Math.floor(raw));
    if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) {
      return Math.max(1, parseInt(raw.trim(), 10));
    }
    return 1;
  }

  private async fadeInFrame(stepName: string, frame: GEditorFrameNode) {
    this.logNode(frame);
    this.hidePopup();
    this.hideSubview();
    this.hideDialogue();
    this.hideGameGate();

    const front = this.frontFrame();
    const sf = await ResCache.storyStepSprite(this._storyName, stepName);
    this.applyFullscreenSprite(front.node, sf);
    front.node.active = true;
    front.opacity.opacity = 0;
    await this.fadeOpacity(front.opacity, 255);
    disableSpriteTrimSubtree(this._frameLayer);
    await this.afterFramePresented(frame);
  }

  private async crossfadeFrame(stepName: string, frame: GEditorFrameNode) {
    this.logNode(frame);
    this.hidePopup();
    this.hideSubview();
    this.hideDialogue();
    this.hideGameGate();
    this._frameLayer.active = true;

    const sf = await ResCache.storyStepSprite(this._storyName, stepName);
    const front = this.frontFrame();
    const back = this.backFrame();

    this.applyFullscreenSprite(back.node, sf);
    back.node.active = true;
    back.opacity.opacity = 0;

    this.stopOpacityTween(front.opacity);
    this.stopOpacityTween(back.opacity);

    await new Promise<void>((resolve) => {
      let done = 0;
      const onDone = () => {
        done += 1;
        if (done >= 2) resolve();
      };
      tween(front.opacity)
        .to(this._fadeSec, { opacity: 0 })
        .call(onDone)
        .start();
      tween(back.opacity)
        .to(this._fadeSec, { opacity: 255 })
        .call(onDone)
        .start();
    });

    front.node.active = false;
    front.opacity.opacity = 255;
    this._frameFrontIsA = !this._frameFrontIsA;
    disableSpriteTrimSubtree(this._frameLayer);
    await this.afterFramePresented(frame);
  }

  private async afterFramePresented(frame: GEditorFrameNode) {
    this._popupHostFrameId = frame.popup ? frame.id : null;
    this._popupShownForHost = false;

    if (frame.autoSkip) {
      const sec = Math.max(0.1, Number(frame.autoSkip.durationSec) || 1.5);
      console.log(
        `[GEditorStory] autoSkip ${frame.autoSkip.effect} ${sec}s (visual TODO)`,
        geditorTextureStepName(frame.textureFile),
      );
      this._autoSkipTimer = setTimeout(() => {
        this._autoSkipTimer = null;
        void this.advanceSequence();
      }, sec * 1000);
      return;
    }

    if (this.frameHasDialogue(frame)) {
      await this.presentDialogueChain(frame);
      this.deferAdvanceSequence();
      return;
    }

    if (frame.holdSec > 0) {
      this._holdTimer = setTimeout(() => {
        this._holdTimer = null;
        void this.advanceSequence();
      }, frame.holdSec * 1000);
    }
  }

  private async openPopup(frame: GEditorFrameNode) {
    const popup = frame.popup;
    if (!popup?.textureFile) return;

    const stepName = geditorTextureStepName(popup.textureFile);
    const sf = await ResCache.storyStepSprite(this._storyName, stepName);
    this.applyNativeSprite(this._popupIcon, sf);
    this._popupIcon.setPosition(0, 0, 0);

    this._popupRoot.active = true;
    this._popupOpen = true;
    this._popupShownForHost = true;
    this._popupHostFrameId = frame.id;
    this._popupOpacity.opacity = 0;
    await this.fadeOpacity(this._popupOpacity, 255);
    disableSpriteTrimSubtree(this._popupRoot);
    this._popupRoot.setSiblingIndex(this.node.children.length - 1);

    if (popup.speaker.trim() || popup.text.trim()) {
      await this.presentDialogue(popup.speaker, popup.text);
    }
  }

  private hidePopup() {
    setSprite(this._popupIcon, null);
    this.stopOpacityTween(this._popupOpacity);
    this._popupRoot.active = false;
    this._popupOpacity.opacity = 255;
    this._popupOpen = false;
    this.hideMountedStoryGame();
  }

  private hitPopupTrigger(
    localX: number,
    localY: number,
    trigger: GEditorPopupTrigger | null | undefined,
  ): boolean {
    if (!trigger) return true;
    const nx = (localX + DESIGN_W / 2) / DESIGN_W;
    const ny = (DESIGN_H / 2 - localY) / DESIGN_H;
    const dx = (nx - trigger.x) * DESIGN_W;
    const dy = (ny - trigger.y) * DESIGN_H;
    const r = Math.max(8, trigger.radius || 10);
    return dx * dx + dy * dy <= r * r;
  }

  private frameHasDialogue(frame: GEditorFrameNode): boolean {
    if (geditorNodeHasCaption(frame)) return true;
    const chain = frame.dialogueChain || [];
    return chain.some((d) => Boolean(d.speaker?.trim() || d.text?.trim()));
  }

  /** 台词播完后的下一步：须延迟到当前 present 调用栈结束后再推进（对齐 StoryPlayer.leaveDialogueToStep） */
  private deferAdvanceSequence() {
    this.scheduleOnce(() => {
      void this.advanceSequence();
    }, 0);
  }

  private async presentDialogueChain(frame: GEditorFrameNode): Promise<void> {
    if (frame.speaker?.trim() || frame.text?.trim()) {
      await this.presentDialogue(frame.speaker, frame.text);
    }
    const chain = frame.dialogueChain || [];
    for (const line of chain) {
      if (!line.speaker?.trim() && !line.text?.trim()) continue;
      await this.presentDialogue(line.speaker || '', line.text || '');
    }
  }

  private async presentDialogue(speaker: string, text: string): Promise<void> {
    const view = await this.ensureDialogueView();
    if (!view) return;

    return new Promise((resolve) => {
      view.show(speaker, text, () => resolve());
    });
  }

  private async setupGameGateButton() {
    if (!this._gateRoot) {
      this._gateRoot = makeNode('geditorGameGate', this.node, DESIGN_W, DESIGN_H);
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

    const sf = await ResCache.storyStepSprite(this._storyName, this._gateBtnName);
    const btn = makeNode('gameEntryBtn', this._gateRoot, this._gateBtnSize, this._gateBtnSize);
    btn.setPosition(
      DESIGN_W / 2 - this._gateBtnMarginX,
      -DESIGN_H / 2 + this._gateBtnMarginY,
      0,
    );
    if (sf) {
      setSprite(btn, sf, Sprite.SizeMode.TRIMMED);
      const ut = btn.getComponent(UITransform);
      if (ut) {
        const maxDim = Math.max(sf.width, sf.height);
        const scale = this._gateBtnSize / maxDim;
        btn.setScale(scale, scale, 1);
      }
    }
    btn.on(Node.EventType.TOUCH_END, (e: EventTouch) => {
      e.propagationStopped = true;
      if (!this._gameActive || !this._onGameRequest) {
        console.error('[GEditorStory] game handler missing');
        return;
      }
      this.hideGameGateLayerOnly();
      this._onGameRequest(this._gameLevel, () => this.completeGameNode());
    });
    this._gateBtn = btn;
    this.syncOverlaySiblingOrder();
    this._gateTapCatcher.setSiblingIndex(0);
    btn.setSiblingIndex(1);
  }

  private onGateBgTap(e: EventTouch) {
    e.propagationStopped = true;
    if (!this._gameActive) return;
    void this.showStoryTip(this._gameTip);
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

  private hideGameGate() {
    this._gameActive = false;
    this.hideGameGateButton();
    if (this._tipPopup?.isOpen()) this._tipPopup.hide();
  }

  private async showStoryTip(text: string) {
    const tip = await this.ensureTipPopup();
    if (!tip) return;
    tip.showTip(text);
    this.syncOverlaySiblingOrder();
  }

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

  private async ensureDialogueView(): Promise<DialogueView | null> {
    if (this._dialogueView) return this._dialogueView;
    const prefab = await ResCache.loadComPrefab('prefab/Dialogue');
    if (!prefab) {
      console.error('[GEditorStory] Dialogue prefab missing');
      return null;
    }
    const node = instantiate(prefab);
    node.name = 'GEditorDialogue';
    this.node.addChild(node);
    fullWidget(node);
    node.active = false;
    this._dialogueView = node.getComponent(DialogueView) || node.addComponent(DialogueView);
    return this._dialogueView;
  }

  private async ensureTipPopup(): Promise<TipPopup | null> {
    if (this._tipPopup) return this._tipPopup;
    const prefab = await ResCache.loadComPrefab('prefab/Tip');
    if (!prefab) {
      console.error('[GEditorStory] Tip prefab missing');
      return null;
    }
    const node = instantiate(prefab);
    node.name = 'GEditorTip';
    this.node.addChild(node);
    fullWidget(node);
    node.active = false;
    this._tipPopup = node.getComponent(TipPopup) || node.addComponent(TipPopup);
    return this._tipPopup;
  }

  private hideDialogue() {
    if (this._dialogueView) this._dialogueView.hide();
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

  /** 停止透明度 tween，并唤醒仍在 await fadeOpacity 的调用方，避免 _busy 永久卡住 */
  private stopOpacityTween(target: UIOpacity | null | undefined) {
    if (!target) return;
    Tween.stopAllByTarget(target);
    const pending = this._fadeResolvers.get(target);
    if (pending) {
      this._fadeResolvers.delete(target);
      pending();
    }
  }

  private fadeOpacity(target: UIOpacity, opacity: number): Promise<void> {
    return new Promise((resolve) => {
      this.stopOpacityTween(target);
      this._fadeResolvers.set(target, resolve);
      tween(target)
        .to(this._fadeSec, { opacity })
        .call(() => {
          if (this._fadeResolvers.get(target) === resolve) {
            this._fadeResolvers.delete(target);
            resolve();
          }
        })
        .start();
    });
  }

  private logNode(node: GEditorStoryNode) {
    if (isGEditorGameNode(node)) {
      console.log(
        `[GEditorStory:${this._storyName}] seq ${this._seqIndex}: game level=${this.resolveLevelId(node.levelId)} gate=${geditorTextureStepName(node.gateFrame)} tip="${node.gateTip || ''}"`,
      );
      return;
    }
    if (isGEditorPopupExecNode(node)) {
      console.log(
        `[GEditorStory:${this._storyName}] seq ${this._seqIndex}: popup ${geditorTextureStepName(geditorPopupExecBg(node))}+${geditorTextureStepName(geditorPopupExecIcon(node))}`,
      );
      return;
    }
    const step = geditorTextureStepName(node.textureFile);
    const cap = geditorNodeHasCaption(node) ? ` "${node.speaker}"` : '';
    const pop = node.popup ? ` popup=${geditorTextureStepName(node.popup.textureFile)}` : '';
    console.log(`[GEditorStory:${this._storyName}] seq ${this._seqIndex}: ${step}${cap}${pop}`);
  }

  private async finish() {
    this._busy = true;
    const tip = await this.ensureTipPopup();
    if (tip) {
      tip.showTip('敬请期待', () => {
        this._busy = false;
        if (this._onFinished) this._onFinished();
      });
      this.syncOverlaySiblingOrder();
    } else {
      this._busy = false;
      if (this._onFinished) this._onFinished();
    }
  }
}
