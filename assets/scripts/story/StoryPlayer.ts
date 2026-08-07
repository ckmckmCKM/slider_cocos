import {
  _decorator, BlockInputEvents, Component, EventTouch, Node, Sprite, SpriteFrame, Tween, UIOpacity, UITransform, tween,
} from 'cc';
import { DESIGN_H, DESIGN_W } from '../utils/Constants';
import { ResCache } from '../utils/ResCache';
import { fullWidget, makeNode, setSprite } from '../utils/UIFactory';
import { isStorySubview, StoryStep, StoryStepSubview } from './StoryTypes';

const { ccclass } = _decorator;

const FADE_SEC = 0.28;

@ccclass('StoryPlayer')
export class StoryPlayer extends Component {
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
  }

  onDestroy() {
    this.node.off(Node.EventType.TOUCH_END, this.onTap, this);
    Tween.stopAllByTarget(this._frameAOpacity);
    Tween.stopAllByTarget(this._frameBOpacity);
    Tween.stopAllByTarget(this._subOpacity);
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
    this._subRoot.active = false;

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
    this.node.active = false;
    this._busy = false;
    this._steps = [];
    this._onFinished = null;
    this._frameFrontIsA = true;
    this._frameA.active = true;
    this._frameB.active = false;
    this._frameAOpacity.opacity = 255;
    this._frameBOpacity.opacity = 255;
    this._subRoot.active = false;
    this._subOpacity.opacity = 255;
  }

  private onTap(e: EventTouch) {
    e.propagationStopped = true;
    if (this._busy || !this.node.active) return;
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

    if (isStorySubview(next)) {
      this._index = nextIndex;
      await this.presentSubview(next);
    } else if (isStorySubview(prev)) {
      await this.fadeOpacity(this._subOpacity, 0);
      this._subRoot.active = false;
      this._subOpacity.opacity = 255;
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
    if (isStorySubview(step)) {
      if (!isFirst && !isStorySubview(this._steps[index - 1])) {
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
    this._subRoot.active = false;
    const front = this.frontFrame();
    const sf = await ResCache.storyStepSprite(this._storyName, name);
    this.applyFullscreenSprite(front.node, sf);
    front.node.active = true;
    front.opacity.opacity = 0;
    await this.fadeOpacity(front.opacity, 255);
  }

  /** 一级界面切换：当前图渐隐，下一张渐现 */
  private async crossfadeFrame(name: string) {
    this.logStep(this._index);
    this._subRoot.active = false;
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
  }

  /** 二级界面叠在一级之上 */
  private async presentSubview(step: StoryStepSubview) {
    this.logStep(this._index);
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
    } else {
      console.log(`[Story:${this._storyName}] step ${index}: sprite/step/${step}`);
    }
  }

  private finish() {
    const cb = this._onFinished;
    this.hide();
    if (cb) cb();
  }
}
