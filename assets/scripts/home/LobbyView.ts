import { _decorator, Node, Sprite, UITransform } from 'cc';
import { SoundMgr } from '../utils/SoundMgr';
import {
  addLabel, bindTouchEnd, childPath, makeNode, mustChild,
} from '../utils/UIFactory';
import { ViewBase } from '../ui/ViewBase';

const { ccclass } = _decorator;
const OWNER = 'Lobby';

export interface LobbyHandlers {
  onStart: () => void;
  onSelect: () => void;
  onStory: () => void;
}

/**
 * home/prefab/Lobby 大厅界面。
 */
@ccclass('LobbyView')
export class LobbyView extends ViewBase {
  private handlers: LobbyHandlers | null = null;
  private _bound = false;

  setHandlers(handlers: LobbyHandlers | null) {
    this.handlers = handlers;
  }

  async setup() {
    if (this._bound) return;
    this._bound = true;

    bindTouchEnd(mustChild(this.node, 'content/btns/start', OWNER), () => {
      SoundMgr.play('click');
      SoundMgr.startBgm();
      this.handlers?.onStart();
    });
    bindTouchEnd(mustChild(this.node, 'content/btns/select', OWNER), () => {
      SoundMgr.play('click');
      this.handlers?.onSelect();
    });
    bindTouchEnd(mustChild(this.node, 'content/btns/story', OWNER), () => {
      SoundMgr.play('click');
      this.handlers?.onStory();
    });

    const logo = childPath(this.node, 'content/logo');
    if (logo && !logo.getComponent(Sprite)) {
      const ut = logo.getComponent(UITransform);
      const lbNode = makeNode('fallback', logo, ut?.contentSize.width ?? 420, 72);
      addLabel(lbNode, 'Block Reveal', 69, '#5b341a');
    }
  }
}
