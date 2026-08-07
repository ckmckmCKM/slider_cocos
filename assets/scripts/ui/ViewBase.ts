import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

/**
 * 全屏界面基类：统一 open / close / hide（关卡、剧情等）。
 * 预制体结构请参照 com/prefab/PopupTemplate（mask + panel + content），脚本继承 ViewBase。
 * 弹窗类请用 PopupBase。
 */
@ccclass('ViewBase')
export class ViewBase extends Component {
  private _onClose: (() => void) | null = null;

  isOpen(): boolean {
    return this.node.active;
  }

  open(onClose?: () => void) {
    this._onClose = onClose ?? null;
    this.node.active = true;
    this.onOpen();
  }

  close() {
    if (!this.node.active) return;
    this.onClose();
    this.node.active = false;
    const cb = this._onClose;
    this._onClose = null;
    if (cb) cb();
  }

  hide() {
    this.node.active = false;
    this._onClose = null;
  }

  protected onOpen() {}

  protected onClose() {}
}
