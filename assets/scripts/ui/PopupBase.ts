import { _decorator, BlockInputEvents, Component, Node } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 弹窗基类：统一 open / close / hide。
 * 预制体结构请参照 com/prefab/PopupTemplate（mask + panel + content）。
 * 全屏界面同样复制该模板，脚本改用 ViewBase。
 */
@ccclass('PopupBase')
export class PopupBase extends Component {
  @property(Node)
  maskNode: Node | null = null;

  @property(Node)
  panelNode: Node | null = null;

  @property(Node)
  contentNode: Node | null = null;

  private _onClose: (() => void) | null = null;

  onLoad() {
    this.bindNodes();
    const block = this.node.getComponent(BlockInputEvents) || this.node.addComponent(BlockInputEvents);
    block.enabled = true;
  }

  /** 弹窗是否处于打开状态 */
  isOpen(): boolean {
    return this.node.active;
  }

  /** 打开弹窗 */
  open(onClose?: () => void) {
    this._onClose = onClose ?? null;
    this.node.active = true;
    this.onOpen();
  }

  /** 关闭弹窗（执行 onClose 钩子并触发关闭回调） */
  close() {
    if (!this.node.active) return;
    this.onClose();
    this.node.active = false;
    const cb = this._onClose;
    this._onClose = null;
    if (cb) cb();
  }

  /** 隐藏弹窗（不触发关闭回调） */
  hide() {
    this.node.active = false;
    this._onClose = null;
  }

  protected bindNodes() {
    if (!this.maskNode) this.maskNode = this.node.getChildByName('mask');
    if (!this.panelNode) this.panelNode = this.node.getChildByName('panel');
    if (!this.contentNode && this.panelNode) {
      this.contentNode = this.panelNode.getChildByName('content');
    }
  }

  /** 子类：打开后 */
  protected onOpen() {}

  /** 子类：关闭前 */
  protected onClose() {}
}
