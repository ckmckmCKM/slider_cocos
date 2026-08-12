import {
  _decorator, Component, EventTouch, Node, sys, UITransform, Vec3,
} from 'cc';
import { DESIGN_H, DESIGN_W } from '../utils/Constants';
import { GameSwitches } from '../utils/GameSwitches';
import { SoundMgr } from '../utils/SoundMgr';
import { addLabel, makeNode, paintRoundButton } from '../utils/UIFactory';
import { GmPopup } from './GmPopup';
import { StorySelectPopup } from './StorySelectPopup';

const { ccclass } = _decorator;

const GM_BTN_W = 120;
const GM_BTN_H = 72;
const GM_BTN_POS_KEY = 'gm_btn_pos';
const DRAG_CLICK_THRESHOLD = 10;

export interface GmEntryHandlers {
  onOpenMenu: () => void;
  onSelectStory: (storyName: string) => void;
}

/**
 * GM 入口：挂在 Main 场景 Canvas/root 下，始终置于 root 子节点最上层。
 * GM 按钮可拖动；松手未拖动时按需打开 GmPopup。
 */
@ccclass('GmEntry')
export class GmEntry extends Component {
  private _gmBtn: Node | null = null;
  private _gmPopup: GmPopup | null = null;
  private _storySelectPopup: StorySelectPopup | null = null;
  private _onOpenMenu: (() => void) | null = null;
  private _onSelectStory: ((storyName: string) => void) | null = null;
  private _dragOffsetX = 0;
  private _dragOffsetY = 0;
  private _touchStartUiX = 0;
  private _touchStartUiY = 0;
  private _touchMoved = false;

  async setup(handlers: GmEntryHandlers): Promise<void> {
    this._onOpenMenu = handlers.onOpenMenu;
    this._onSelectStory = handlers.onSelectStory;
    if (this._gmBtn) return;

    const switches = await GameSwitches.load();
    this._gmBtn = makeNode('gmBtn', this.node, GM_BTN_W, GM_BTN_H);
    paintRoundButton(this._gmBtn, GM_BTN_W, GM_BTN_H);
    const txt = makeNode('txt', this._gmBtn, GM_BTN_W - 29, GM_BTN_H - 14);
    addLabel(txt, 'GM', Math.min(40, Math.floor(GM_BTN_H * 0.38)), '#5b341a');
    this.bindGmBtnDrag(this._gmBtn);

    const saved = this.loadGmBtnPos();
    if (saved) {
      this._gmBtn.setPosition(saved.x, saved.y, 0);
    } else {
      this._gmBtn.setPosition(DESIGN_W / 2 - 90, DESIGN_H / 2 - 200, 0);
    }
    this._gmBtn.active = switches.showGm;
    this.bringToFront();
  }

  closePopupIfOpen() {
    if (this._gmPopup?.isOpen()) this._gmPopup.close();
    if (this._storySelectPopup?.isOpen()) this._storySelectPopup.close();
  }

  onDestroy() {
    this.unbindGmBtnDrag();
    this._gmBtn = null;
    this._gmPopup = null;
    this._storySelectPopup = null;
    this._onOpenMenu = null;
    this._onSelectStory = null;
  }

  private unbindGmBtnDrag() {
    const btn = this._gmBtn;
    if (!btn || !btn.isValid) return;
    btn.off(Node.EventType.TOUCH_START, this.onGmBtnTouchStart, this);
    btn.off(Node.EventType.TOUCH_MOVE, this.onGmBtnTouchMove, this);
    btn.off(Node.EventType.TOUCH_END, this.onGmBtnTouchEnd, this);
    btn.off(Node.EventType.TOUCH_CANCEL, this.onGmBtnTouchEnd, this);
  }

  private bindGmBtnDrag(btn: Node) {
    btn.on(Node.EventType.TOUCH_START, this.onGmBtnTouchStart, this);
    btn.on(Node.EventType.TOUCH_MOVE, this.onGmBtnTouchMove, this);
    btn.on(Node.EventType.TOUCH_END, this.onGmBtnTouchEnd, this);
    btn.on(Node.EventType.TOUCH_CANCEL, this.onGmBtnTouchEnd, this);
  }

  private onGmBtnTouchStart(e: EventTouch) {
    if (!this._gmBtn) return;
    e.propagationStopped = true;
    const ui = e.getUILocation();
    this._touchStartUiX = ui.x;
    this._touchStartUiY = ui.y;
    this._touchMoved = false;
    const local = this.uiToRootLocal(ui.x, ui.y);
    this._dragOffsetX = this._gmBtn.position.x - local.x;
    this._dragOffsetY = this._gmBtn.position.y - local.y;
  }

  private onGmBtnTouchMove(e: EventTouch) {
    if (!this._gmBtn) return;
    e.propagationStopped = true;
    const ui = e.getUILocation();
    if (Math.hypot(ui.x - this._touchStartUiX, ui.y - this._touchStartUiY) > DRAG_CLICK_THRESHOLD) {
      this._touchMoved = true;
    }
    const local = this.uiToRootLocal(ui.x, ui.y);
    const p = this.clampGmBtnPos(local.x + this._dragOffsetX, local.y + this._dragOffsetY);
    this._gmBtn.setPosition(p.x, p.y, 0);
  }

  private onGmBtnTouchEnd(e: EventTouch) {
    if (!this._gmBtn) return;
    e.propagationStopped = true;
    if (this._touchMoved) {
      this.saveGmBtnPos(this._gmBtn.position.x, this._gmBtn.position.y);
      return;
    }
    SoundMgr.play('click');
    void this.openGm();
  }

  private uiToRootLocal(uiX: number, uiY: number): Vec3 {
    const ut = this.node.getComponent(UITransform);
    if (!ut) return new Vec3(uiX, uiY, 0);
    return ut.convertToNodeSpaceAR(new Vec3(uiX, uiY, 0));
  }

  private clampGmBtnPos(x: number, y: number) {
    const halfW = DESIGN_W / 2;
    const halfH = DESIGN_H / 2;
    return {
      x: Math.min(halfW - GM_BTN_W / 2, Math.max(-halfW + GM_BTN_W / 2, x)),
      y: Math.min(halfH - GM_BTN_H / 2, Math.max(-halfH + GM_BTN_H / 2, y)),
    };
  }

  private loadGmBtnPos(): { x: number; y: number } | null {
    try {
      const raw = sys.localStorage.getItem(GM_BTN_POS_KEY);
      if (!raw) return null;
      const j = JSON.parse(raw) as { x?: number; y?: number };
      if (typeof j.x !== 'number' || typeof j.y !== 'number') return null;
      return this.clampGmBtnPos(j.x, j.y);
    } catch {
      return null;
    }
  }

  private saveGmBtnPos(x: number, y: number) {
    try {
      const p = this.clampGmBtnPos(x, y);
      sys.localStorage.setItem(GM_BTN_POS_KEY, JSON.stringify(p));
    } catch { /* */ }
  }

  private async ensureGmPopup(): Promise<GmPopup> {
    if (this._gmPopup) return this._gmPopup;
    this._gmPopup = GmPopup.create(this.node);
    this._gmPopup.setOpenMenuHandler(() => {
      this._onOpenMenu?.();
    });
    this._gmPopup.setOpenStorySelectHandler(() => {
      void this.openStorySelect();
    });
    this.bringToFront();
    return this._gmPopup;
  }

  private async ensureStorySelectPopup(): Promise<StorySelectPopup> {
    if (this._storySelectPopup) return this._storySelectPopup;
    this._storySelectPopup = StorySelectPopup.create(this.node);
    this._storySelectPopup.setSelectHandler((storyName) => {
      this._onSelectStory?.(storyName);
    });
    this.bringToFront();
    return this._storySelectPopup;
  }

  private async openGm() {
    const popup = await this.ensureGmPopup();
    this.bringToFront();
    popup.open();
  }

  private async openStorySelect() {
    const popup = await this.ensureStorySelectPopup();
    this.bringToFront();
    popup.open();
  }

  /** 保证 GM 弹窗与按钮在 root 最上层 */
  bringToFront() {
    if (!this.node?.isValid) return;
    const parent = this.node;
    const top = parent.children.length - 1;
    let raised = 0;
    if (this._gmPopup?.node?.isValid) {
      this._gmPopup.node.setSiblingIndex(top);
      raised++;
    }
    if (this._storySelectPopup?.node?.isValid) {
      this._storySelectPopup.node.setSiblingIndex(top);
      raised++;
    }
    if (this._gmBtn?.isValid) {
      this._gmBtn.setSiblingIndex(Math.max(0, top - raised));
    }
  }

  lateUpdate() {
    if (!this.node?.isValid) return;
    this.bringToFront();
  }
}
