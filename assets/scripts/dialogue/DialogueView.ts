import {
  _decorator, Label, Node, Sprite, EventTouch, UIOpacity, tween, Tween,
} from 'cc';
import { ResCache } from '../utils/ResCache';
import { PopupBase } from '../ui/PopupBase';

const { ccclass, property } = _decorator;

const ADVANCE_AFTER_SKIP_SEC = 0.2;
const DIALOGUE_FADE_SEC = 0.28;
const DEFAULT_CHARS_PER_SECOND = 18;
const MIN_CHARS_PER_SECOND = 1;
const MAX_CHARS_PER_SECOND = 120;

@ccclass('DialogueView')
export class DialogueView extends PopupBase {
  @property(Label)
  speakerLabel: Label | null = null;

  @property(Label)
  contentLabel: Label | null = null;

  @property(Sprite)
  boxSprite: Sprite | null = null;

  @property(Sprite)
  namePlateSprite: Sprite | null = null;

  private _fullText = '';
  private _charIndex = 0;
  private _typing = false;
  private _typeAcc = 0;
  private _charsPerSecond = DEFAULT_CHARS_PER_SECOND;
  private _onTypingComplete: (() => void) | null = null;
  private _pendingAdvance = false;
  private _fadingIn = false;

  onLoad() {
    super.onLoad();
    this.node.on(Node.EventType.TOUCH_END, this.onTap, this);
    this.loadArt();
  }

  onDestroy() {
    this.node.off(Node.EventType.TOUCH_END, this.onTap, this);
    this.cancelPendingAdvance();
  }

  protected bindNodes() {
    super.bindNodes();
    if (!this.panelNode) this.panelNode = this.node.getChildByName('box');
    if (!this.contentNode) this.contentNode = this.node.getChildByName('content');
    if (!this.speakerLabel) {
      const n = this.node.getChildByName('namePlate')?.getChildByName('speaker');
      this.speakerLabel = n?.getComponent(Label) || null;
    }
    if (!this.contentLabel) {
      const n = this.contentNode || this.node.getChildByName('content');
      this.contentLabel = n?.getComponent(Label) || null;
    }
    if (!this.boxSprite) {
      this.boxSprite = this.panelNode?.getComponent(Sprite)
        || this.node.getChildByName('box')?.getComponent(Sprite) || null;
    }
    if (!this.namePlateSprite) {
      this.namePlateSprite = this.node.getChildByName('namePlate')?.getComponent(Sprite) || null;
    }
  }

  private async loadArt() {
    const boxSf = await ResCache.comSprite('duihuakuang');
    const nameSf = await ResCache.comSprite('mingzi');
    if (boxSf && this.boxSprite && !this.boxSprite.spriteFrame) {
      this.boxSprite.spriteFrame = boxSf;
    }
    if (nameSf && this.namePlateSprite && !this.namePlateSprite.spriteFrame) {
      this.namePlateSprite.spriteFrame = nameSf;
    }
  }

  /** 显示对话：说话人 + 全文（逐字打出）；onClose 在玩家点击关闭时触发 */
  show(speaker: string, text: string, onClose?: () => void, charsPerSecond?: number) {
    this.applyTypingSpeed(charsPerSecond);
    this.prepareContent(speaker, text);
    this.open(onClose);
    this.startTyping();
  }

  /**
   * 先渐现对话框，再开始逐字打出（用于一级界面渐现后自动衔接对话）
   */
  async showAfterFade(speaker: string, text: string, onClose?: () => void, charsPerSecond?: number) {
    this.applyTypingSpeed(charsPerSecond);
    this.prepareContent(speaker, text);
    this.open(onClose);
    this._fadingIn = true;
    await this.fadeIn();
    this._fadingIn = false;
    this.startTyping();
  }

  hide() {
    this.cancelPendingAdvance();
    this.stopTyping();
    this._onTypingComplete = null;
    this._fadingIn = false;
    Tween.stopAllByTarget(this.getFadeTarget());
    super.hide();
  }

  protected onClose() {
    this.cancelPendingAdvance();
    this.stopTyping();
    this._onTypingComplete = null;
  }

  private prepareContent(speaker: string, text: string) {
    this.cancelPendingAdvance();
    if (this.speakerLabel) this.speakerLabel.string = speaker;
    this._fullText = text || '';
    this._charIndex = 0;
    this._typing = false;
    this._typeAcc = 0;
    this._onTypingComplete = null;
    if (this.contentLabel) this.contentLabel.string = '';
  }

  private applyTypingSpeed(charsPerSecond?: number | null) {
    const n = Number(charsPerSecond);
    if (!Number.isFinite(n) || n <= 0) {
      this._charsPerSecond = DEFAULT_CHARS_PER_SECOND;
      return;
    }
    this._charsPerSecond = Math.min(MAX_CHARS_PER_SECOND, Math.max(MIN_CHARS_PER_SECOND, Math.round(n)));
  }

  private startTyping() {
    this._typing = this._fullText.length > 0;
    this._typeAcc = 0;
  }

  private getFadeTarget(): UIOpacity {
    return this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
  }

  private fadeIn(): Promise<void> {
    const op = this.getFadeTarget();
    Tween.stopAllByTarget(op);
    op.opacity = 0;
    return new Promise((resolve) => {
      tween(op)
        .to(DIALOGUE_FADE_SEC, { opacity: 255 })
        .call(() => resolve())
        .start();
    });
  }

  isTyping() {
    return this._typing;
  }

  /** 立即显示全部文字 */
  skipTyping() {
    if (!this._typing) return;
    this._charIndex = this._fullText.length;
    if (this.contentLabel) this.contentLabel.string = this._fullText;
    this.finishTyping();
  }

  update(dt: number) {
    if (!this._typing) return;
    this._typeAcc += dt;
    const step = 1 / this._charsPerSecond;
    while (this._typeAcc >= step && this._charIndex < this._fullText.length) {
      this._typeAcc -= step;
      this._charIndex += 1;
      if (this.contentLabel) {
        this.contentLabel.string = this._fullText.slice(0, this._charIndex);
      }
    }
    if (this._charIndex >= this._fullText.length) {
      this.finishTyping();
    }
  }

  private onTap(e: EventTouch) {
    e.propagationStopped = true;
    if (!this.isOpen()) return;
    if (this._fadingIn) return;
    if (this._pendingAdvance) return;
    if (this._typing) {
      this.skipTyping();
      this.schedulePendingAdvance();
      return;
    }
    this.close();
  }

  private schedulePendingAdvance() {
    this.cancelPendingAdvance();
    this._pendingAdvance = true;
    this.scheduleOnce(this.onPendingAdvance, ADVANCE_AFTER_SKIP_SEC);
  }

  private onPendingAdvance() {
    this._pendingAdvance = false;
    this.close();
  }

  private cancelPendingAdvance() {
    this.unschedule(this.onPendingAdvance);
    this._pendingAdvance = false;
  }

  private stopTyping() {
    this._typing = false;
    this._typeAcc = 0;
  }

  private finishTyping() {
    this.stopTyping();
    if (this._onTypingComplete) {
      const fn = this._onTypingComplete;
      this._onTypingComplete = null;
      fn();
    }
  }
}
