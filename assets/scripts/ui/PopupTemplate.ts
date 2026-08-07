import { _decorator } from 'cc';
import { PopupBase } from './PopupBase';

const { ccclass } = _decorator;

/**
 * com/prefab/PopupTemplate 模板弹窗组件。
 * 新建弹窗：复制 PopupTemplate.prefab，替换 content 下内容，脚本继承 PopupBase。
 */
@ccclass('PopupTemplate')
export class PopupTemplate extends PopupBase {}
