import {
  _decorator, BlockInputEvents, Color, Label, Node,
} from 'cc';
import { DESIGN_H, DESIGN_W, MAX_LEVEL } from '../utils/Constants';
import {
  addLabel, bindTouchEnd, fullWidget, makeButton, makeNode, paintRect, paintRoundRect,
} from '../utils/UIFactory';
import { PopupBase } from '../ui/PopupBase';
import { SoundMgr } from '../utils/SoundMgr';

const { ccclass } = _decorator;

export type GmJumpHandler = (level: number) => void;

/**
 * GM 弹窗（代码搭建，挂在 Main/root 下）。
 * 含「选择关卡」入口；选关子面板可跳关。
 */
@ccclass('GmPopup')
export class GmPopup extends PopupBase {
  private mainContent!: Node;
  private levelPanel!: Node;
  private levelLabel!: Label;
  private pickLevel = 1;
  private onJump: GmJumpHandler | null = null;

  static create(parent: Node): GmPopup {
    const root = makeNode('GmPopup', parent, DESIGN_W, DESIGN_H);
    fullWidget(root);
    root.addComponent(BlockInputEvents);

    const mask = makeNode('mask', root, DESIGN_W, DESIGN_H);
    fullWidget(mask);
    paintRect(mask, -DESIGN_W / 2, -DESIGN_H / 2, DESIGN_W, DESIGN_H, new Color(0, 0, 0, 160));

    const panel = makeNode('panel', root, 640, 560);
    paintRoundRect(panel, -320, -280, 640, 560, 28, new Color(255, 248, 230, 245));

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

  setJumpHandler(handler: GmJumpHandler | null) {
    this.onJump = handler;
  }

  /** 打开时回到主菜单页 */
  protected onOpen() {
    this.mainContent.active = true;
    this.levelPanel.active = false;
  }

  private buildContent(panel: Node) {
    const title = makeNode('title', panel, 500, 60);
    title.setPosition(0, 200, 0);
    addLabel(title, 'GM', 48, '#5b341a');

    this.mainContent = makeNode('main', panel, 560, 360);
    this.mainContent.setPosition(0, -20, 0);

    makeButton(this.mainContent, 'btnSelectLevel', 420, 88, '选择关卡', () => {
      SoundMgr.play('click');
      this.openLevelSelect();
    }).setPosition(0, 60, 0);

    makeButton(this.mainContent, 'btnClose', 280, 72, '关闭', () => {
      SoundMgr.play('click');
      this.close();
    }).setPosition(0, -80, 0);

    this.levelPanel = makeNode('levelSelect', panel, 560, 400);
    this.levelPanel.setPosition(0, -20, 0);
    this.levelPanel.active = false;

    const lvTitle = makeNode('lvTitle', this.levelPanel, 400, 48);
    lvTitle.setPosition(0, 140, 0);
    addLabel(lvTitle, '跳转关卡', 36, '#5b341a');

    makeButton(this.levelPanel, 'btnPrev', 100, 80, '−', () => {
      SoundMgr.play('click');
      this.changePick(-1);
    }).setPosition(-180, 20, 0);

    const lvBox = makeNode('lvNum', this.levelPanel, 200, 80);
    lvBox.setPosition(0, 20, 0);
    // Label 与 Graphics 不能同节点：先挂 Label，paintRoundRect 会把底画到子节点 bg
    this.levelLabel = addLabel(lvBox, '1', 40, '#5b341a');
    paintRoundRect(lvBox, -100, -40, 200, 80, 16, new Color(255, 255, 255, 220));

    makeButton(this.levelPanel, 'btnNext', 100, 80, '+', () => {
      SoundMgr.play('click');
      this.changePick(1);
    }).setPosition(180, 20, 0);

    makeButton(this.levelPanel, 'btnJump', 320, 80, '进入关卡', () => {
      SoundMgr.play('click');
      const lv = this.pickLevel;
      this.close();
      this.onJump?.(lv);
    }).setPosition(0, -100, 0);

    makeButton(this.levelPanel, 'btnBack', 200, 64, '返回', () => {
      SoundMgr.play('click');
      this.levelPanel.active = false;
      this.mainContent.active = true;
    }).setPosition(0, -200, 0);
  }

  private openLevelSelect() {
    this.pickLevel = Math.min(MAX_LEVEL, Math.max(1, this.pickLevel));
    this.refreshLevelLabel();
    this.mainContent.active = false;
    this.levelPanel.active = true;
  }

  private changePick(delta: number) {
    this.pickLevel = Math.min(MAX_LEVEL, Math.max(1, this.pickLevel + delta));
    this.refreshLevelLabel();
  }

  private refreshLevelLabel() {
    if (this.levelLabel) this.levelLabel.string = String(this.pickLevel);
  }
}
