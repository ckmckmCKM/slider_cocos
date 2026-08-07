import { _decorator, Label } from 'cc';
import { PopupBase } from './PopupBase';

const { ccclass, property } = _decorator;

const AUTO_CLOSE_SEC = 1;

/** 通用文字提示弹窗（com/prefab/Tip），约 1 秒后自动关闭 */
@ccclass('TipPopup')
export class TipPopup extends PopupBase {
  @property(Label)
  textLabel: Label | null = null;

  protected bindNodes() {
    super.bindNodes();
    if (!this.textLabel) {
      const n = this.contentNode || this.panelNode?.getChildByName('content');
      this.textLabel = n?.getComponent(Label) || null;
    }
  }

  showTip(text: string, onClose?: () => void) {
    this.cancelAutoClose();
    this.bindNodes();
    if (this.textLabel) this.textLabel.string = text;
    this.open(onClose);
    this.scheduleOnce(this.onAutoClose, AUTO_CLOSE_SEC);
  }

  onDestroy() {
    this.cancelAutoClose();
  }

  hide() {
    this.cancelAutoClose();
    super.hide();
  }

  protected onClose() {
    this.cancelAutoClose();
  }

  private onAutoClose() {
    if (this.isOpen()) this.close();
  }

  private cancelAutoClose() {
    this.unschedule(this.onAutoClose);
  }
}
