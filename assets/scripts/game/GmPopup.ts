import {
  _decorator, BlockInputEvents, Color, Node,
} from 'cc';
import { DESIGN_H, DESIGN_W } from '../utils/Constants';
import {
  addLabel, bindTouchEnd, fullWidget, makeButton, makeNode, paintRect, paintRoundRect,
} from '../utils/UIFactory';
import { PopupBase } from '../ui/PopupBase';
import { SoundMgr } from '../utils/SoundMgr';

const { ccclass } = _decorator;

export type GmOpenMenuHandler = () => void;
export type GmOpenStorySelectHandler = () => void;

/**
 * GM 弹窗（按需创建，挂在 Main/root 下）。
 */
@ccclass('GmPopup')
export class GmPopup extends PopupBase {
  private onOpenMenu: GmOpenMenuHandler | null = null;
  private onOpenStorySelect: GmOpenStorySelectHandler | null = null;

  static create(parent: Node): GmPopup {
    const root = makeNode('GmPopup', parent, DESIGN_W, DESIGN_H);
    fullWidget(root);
    root.addComponent(BlockInputEvents);

    const mask = makeNode('mask', root, DESIGN_W, DESIGN_H);
    fullWidget(mask);
    paintRect(mask, -DESIGN_W / 2, -DESIGN_H / 2, DESIGN_W, DESIGN_H, new Color(0, 0, 0, 160));

    const panel = makeNode('panel', root, 640, 520);
    paintRoundRect(panel, -320, -260, 640, 520, 28, new Color(255, 248, 230, 245));

    const popup = root.addComponent(GmPopup);
    popup.maskNode = mask;
    popup.panelNode = panel;
    popup.buildContent(panel);
    bindTouchEnd(mask, () => {
      SoundMgr.play('click');
      popup.close();
    });
    root.active = false;
    return popup;
  }

  setOpenMenuHandler(handler: GmOpenMenuHandler | null) {
    this.onOpenMenu = handler;
  }

  setOpenStorySelectHandler(handler: GmOpenStorySelectHandler | null) {
    this.onOpenStorySelect = handler;
  }

  private buildContent(panel: Node) {
    const title = makeNode('title', panel, 500, 60);
    title.setPosition(0, 180, 0);
    addLabel(title, 'GM', 48, '#5b341a');

    const main = makeNode('main', panel, 560, 400);
    main.setPosition(0, -20, 0);

    makeButton(main, 'btnSelectLevel', 420, 88, '选择关卡', () => {
      SoundMgr.play('click');
      this.close();
      this.onOpenMenu?.();
    }).setPosition(0, 100, 0);

    makeButton(main, 'btnSelectStory', 420, 88, '选择剧情', () => {
      SoundMgr.play('click');
      this.close();
      this.onOpenStorySelect?.();
    }).setPosition(0, -10, 0);

    makeButton(main, 'btnClose', 280, 72, '关闭', () => {
      SoundMgr.play('click');
      this.close();
    }).setPosition(0, -120, 0);
  }
}
