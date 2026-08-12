import {
  _decorator, BlockInputEvents, Color, Node,
} from 'cc';
import { DESIGN_H, DESIGN_W, STORY_ORDER } from '../utils/Constants';
import {
  addLabel, bindTouchEnd, fullWidget, makeButton, makeNode, paintRect, paintRoundRect,
} from '../utils/UIFactory';
import { PopupBase } from '../ui/PopupBase';
import { SoundMgr } from '../utils/SoundMgr';

const { ccclass } = _decorator;

export type StorySelectHandler = (storyName: string) => void;

/**
 * 剧情选择弹窗（按需创建，挂在 Main/root 下）。
 */
@ccclass('StorySelectPopup')
export class StorySelectPopup extends PopupBase {
  private onSelect: StorySelectHandler | null = null;

  static create(parent: Node): StorySelectPopup {
    const root = makeNode('StorySelectPopup', parent, DESIGN_W, DESIGN_H);
    fullWidget(root);
    root.addComponent(BlockInputEvents);

    const mask = makeNode('mask', root, DESIGN_W, DESIGN_H);
    fullWidget(mask);
    paintRect(mask, -DESIGN_W / 2, -DESIGN_H / 2, DESIGN_W, DESIGN_H, new Color(0, 0, 0, 160));

    const listH = Math.max(280, STORY_ORDER.length * 100 + 120);
    const panelH = Math.min(DESIGN_H * 0.7, listH + 160);
    const panel = makeNode('panel', root, 640, panelH);
    paintRoundRect(panel, -320, -panelH / 2, 640, panelH, 28, new Color(255, 248, 230, 245));

    const popup = root.addComponent(StorySelectPopup);
    popup.maskNode = mask;
    popup.panelNode = panel;
    popup.buildContent(panel, panelH);
    bindTouchEnd(mask, () => {
      SoundMgr.play('click');
      popup.close();
    });
    root.active = false;
    return popup;
  }

  setSelectHandler(handler: StorySelectHandler | null) {
    this.onSelect = handler;
  }

  private buildContent(panel: Node, panelH: number) {
    const title = makeNode('title', panel, 500, 60);
    title.setPosition(0, panelH / 2 - 70, 0);
    addLabel(title, '选择剧情', 48, '#5b341a');

    const startY = panelH / 2 - 160;
    for (let i = 0; i < STORY_ORDER.length; i++) {
      const name = STORY_ORDER[i];
      const label = `剧情 ${i + 1}（${name}）`;
      makeButton(panel, `btn_${name}`, 420, 88, label, () => {
        SoundMgr.play('click');
        this.close();
        this.onSelect?.(name);
      }).setPosition(0, startY - i * 100, 0);
    }

    makeButton(panel, 'btnClose', 280, 72, '关闭', () => {
      SoundMgr.play('click');
      this.close();
    }).setPosition(0, -panelH / 2 + 70, 0);
  }
}
