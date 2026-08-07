import { _decorator, Node, Label } from 'cc';
import { DESIGN_H, MAX_LEVEL } from '../utils/Constants';
import { SoundMgr } from '../utils/SoundMgr';
import {
  addLabel, bindTouchEnd, makeNode, mustChild, mustLabel, paintRoundCell,
} from '../utils/UIFactory';
import { ViewBase } from '../ui/ViewBase';

const { ccclass } = _decorator;
const OWNER = 'Menu';

export interface MenuHandlers {
  onBack: () => void;
  onEnterLevel: (level: number) => void;
  onLockedLevel: () => void;
  getMaxLevel: () => number;
}

/**
 * home/prefab/Menu 选关界面。
 */
@ccclass('MenuView')
export class MenuView extends ViewBase {
  private handlers: MenuHandlers | null = null;
  private pageLbl!: Label;
  private grid!: Node;
  private menuPage = 0;
  private readonly pageSize = 50;
  private _bound = false;

  setHandlers(handlers: MenuHandlers | null) {
    this.handlers = handlers;
  }

  async setup() {
    if (this._bound) return;
    this._bound = true;

    this.grid = mustChild(this.node, 'grid', OWNER);
    this.pageLbl = mustLabel(this.node, 'pager/page', OWNER);

    bindTouchEnd(mustChild(this.node, 'pager/prev', OWNER), () => {
      if (this.menuPage > 0) {
        this.menuPage--;
        this.refreshLevelGrid();
      }
    });
    bindTouchEnd(mustChild(this.node, 'pager/next', OWNER), () => {
      const maxPage = Math.ceil(MAX_LEVEL / this.pageSize) - 1;
      if (this.menuPage < maxPage) {
        this.menuPage++;
        this.refreshLevelGrid();
      }
    });
    bindTouchEnd(mustChild(this.node, 'back', OWNER), () => {
      SoundMgr.play('click');
      this.handlers?.onBack();
    });
  }

  showPageForProgress(progress: number) {
    this.menuPage = Math.floor((progress - 1) / this.pageSize);
    this.refreshLevelGrid();
  }

  protected onOpen() {
    const progress = this.handlers?.getMaxLevel() ?? 1;
    this.menuPage = Math.floor((progress - 1) / this.pageSize);
    this.refreshLevelGrid();
  }

  refreshLevelGrid() {
    if (!this.grid) return;
    this.grid.removeAllChildren();
    const maxLevel = this.handlers?.getMaxLevel() ?? 1;
    const cols = 5;
    const cellW = 158;
    const cellH = 92;
    const gap = 14;
    const startX = -((cols - 1) * (cellW + gap)) / 2;
    const startY = (DESIGN_H - 518) / 2 - 29;
    const from = this.menuPage * this.pageSize + 1;
    const to = Math.min(MAX_LEVEL, from + this.pageSize - 1);
    if (this.pageLbl) this.pageLbl.string = `${from}-${to} / ${MAX_LEVEL}`;

    for (let idx = from; idx <= to; idx++) {
      const i = idx - from;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const locked = idx > maxLevel;
      const btn = makeNode(`lv${idx}`, this.grid, cellW, cellH);
      btn.setPosition(startX + col * (cellW + gap), startY - row * (cellH + gap), 0);
      paintRoundCell(
        btn, cellW, cellH,
        locked ? '#c8b086' : '#f2c97e',
        '#c98a4b',
      );
      const txt = makeNode('txt', btn, cellW - 12, cellH - 12);
      addLabel(txt, String(idx), 37, locked ? '#8a7355' : '#7a4518');
      bindTouchEnd(btn, () => {
        if (locked) {
          this.handlers?.onLockedLevel();
          return;
        }
        SoundMgr.play('click');
        this.handlers?.onEnterLevel(idx);
      });
    }
  }
}
