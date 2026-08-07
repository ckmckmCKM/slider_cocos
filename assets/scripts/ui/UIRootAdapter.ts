import {
  _decorator, Component, Layers, Node, UITransform, view, Widget,
} from 'cc';

const { ccclass } = _decorator;

/**
 * 挂在 Main 场景 Canvas/root 上：直接改本节点 UITransform 铺满当前可视区域（不用 Widget）。
 * Lobby / Menu / Story / Game / 弹窗等界面挂在此节点下。
 */
@ccclass('UIRootAdapter')
export class UIRootAdapter extends Component {
  private static _inst: UIRootAdapter | null = null;

  /** 当前 UI 根节点（未就绪时为 null） */
  static get root(): Node | null {
    return this._inst?.node ?? null;
  }

  onLoad() {
    UIRootAdapter._inst = this;
    this.node.layer = Layers.Enum.UI_2D;
    const widget = this.node.getComponent(Widget);
    if (widget) widget.destroy();
    this.applyFit();
    view.on('canvas-resize', this.applyFit, this);
  }

  onEnable() {
    this.applyFit();
  }

  onDestroy() {
    view.off('canvas-resize', this.applyFit, this);
    if (UIRootAdapter._inst === this) UIRootAdapter._inst = null;
  }

  /**
   * 按可视区域改本节点尺寸。
   * 在 FIXED_WIDTH 下长屏高度会 > 设计高，从而铺满全屏。
   */
  applyFit() {
    const ut = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
    const size = view.getVisibleSize();
    ut.setContentSize(size.width, size.height);
    ut.setAnchorPoint(0.5, 0.5);
    this.node.setPosition(0, 0, 0);
    this.node.setScale(1, 1, 1);
  }
}
