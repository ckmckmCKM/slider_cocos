import { _decorator } from 'cc';
import { PopupBase } from './PopupBase';

const { ccclass } = _decorator;

/**
 * com/prefab/PopupTemplate 模板组件（弹窗与全屏界面的预制体骨架）。
 *
 * 新建 UI 预制体：在编辑器中复制 PopupTemplate.prefab → 在 content 下搭 UI。
 * - 弹窗：脚本继承 PopupBase（如 DialogueView、TipPopup）
 * - 全屏：脚本继承 ViewBase（如 LobbyView）；可隐藏 mask 或将 panel 拉满屏
 */
@ccclass('PopupTemplate')
export class PopupTemplate extends PopupBase {}
