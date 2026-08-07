import {
  _decorator, Component, Label, Node, Sprite, UITransform, BlockInputEvents, EventTouch,
} from 'cc';
import { ResCache } from '../utils/ResCache';

const { ccclass, property } = _decorator;

@ccclass('DialogueView')
export class DialogueView extends Component {
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
  private _charsPerSecond = 18;
  private _onComplete: (() => void) | null = null;
  private _onAdvance: (() => void) | null = null;

  onLoad() {
    this.bindNodes();
    this.node.on(Node.EventType.TOUCH_END, this.onTap, this);
    const block = this.node.getComponent(BlockInputEvents) || this.node.addComponent(BlockInputEvents);
    block.enabled = true;
    this.loadArt();
  }

  onDestroy() {
    this.node.off(Node.EventType.TOUCH_END, this.onTap, this);
  }

  private bindNodes() {
    if (!this.speakerLabel) {
      const n = this.node.getChildByName('namePlate')?.getChildByName('speaker');
      this.speakerLabel = n?.getComponent(Label) || null;
    }
    if (!this.contentLabel) {
      const n = this.node.getChildByName('content');
      this.contentLabel = n?.getComponent(Label) || null;
    }
    if (!this.boxSprite) {
      this.boxSprite = this.node.getChildByName('box')?.getComponent(Sprite) || null;
    }
    if (!this.namePlateSprite) {
      this.namePlateSprite = this.node.getChildByName('namePlate')?.getComponent(Sprite) || null;
    }
  }

  private async loadArt() {
    const boxSf = await ResCache.comSprite('duihuakuang');
    const nameSf = await ResCache.comSprite('mingzi');
    if (boxSf && this.boxSprite) {
      this.boxSprite.sizeMode = Sprite.SizeMode.TRIMMED;
      this.boxSprite.spriteFrame = boxSf;
      const ut = this.boxSprite.node.getComponent(UITransform);
      if (ut) ut.setContentSize(boxSf.width, boxSf.height);
    }
    if (nameSf && this.namePlateSprite) {
      this.namePlateSprite.sizeMode = Sprite.SizeMode.TRIMMED;
      this.namePlateSprite.spriteFrame = nameSf;
      const ut = this.namePlateSprite.node.getComponent(UITransform);
      if (ut) ut.setContentSize(nameSf.width, nameSf.height);
    }
  }

  /** 显示对话：说话人 + 全文（逐字打出） */
  show(speaker: string, text: string, onComplete?: () => void) {
    this.node.active = true;
    if (this.speakerLabel) this.speakerLabel.string = speaker;
    this._fullText = text || '';
    this._charIndex = 0;
    this._typing = this._fullText.length > 0;
    this._typeAcc = 0;
    this._onComplete = onComplete || null;
    if (this.contentLabel) this.contentLabel.string = '';
    if (!this._typing && this._onComplete) this._onComplete();
  }

  /** 点击继续时若已打完，触发 advance */
  setAdvanceHandler(handler: (() => void) | null) {
    this._onAdvance = handler;
  }

  hide() {
    this.node.active = false;
    this.stopTyping();
    this._onAdvance = null;
    this._onComplete = null;
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
    if (this._typing) {
      this.skipTyping();
      return;
    }
    if (this._onAdvance) this._onAdvance();
  }

  private stopTyping() {
    this._typing = false;
    this._typeAcc = 0;
  }

  private finishTyping() {
    this.stopTyping();
    if (this._onComplete) {
      const fn = this._onComplete;
      this._onComplete = null;
      fn();
    }
  }
}
