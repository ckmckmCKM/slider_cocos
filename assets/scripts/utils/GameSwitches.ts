import { JsonAsset, resources } from 'cc';

/** resources/config/switches.json — 项目开关配置 */
export interface GameSwitchesData {
  /** Story 下 GM 入口按钮是否显示 */
  showGm: boolean;
}

const DEFAULTS: GameSwitchesData = {
  showGm: false,
};

/**
 * 加载并缓存 resources 下的开关配置。
 * 路径：`config/switches`
 */
export class GameSwitches {
  private static _data: GameSwitchesData | null = null;

  static async load(): Promise<GameSwitchesData> {
    if (this._data) return this._data;
    return new Promise((resolve) => {
      resources.load('config/switches', JsonAsset, (err, asset) => {
        if (err || !asset?.json) {
          console.warn('[GameSwitches] load failed, using defaults', err);
          this._data = { ...DEFAULTS };
          resolve(this._data);
          return;
        }
        const raw = asset.json as Partial<GameSwitchesData>;
        this._data = {
          showGm: raw.showGm === true,
        };
        resolve(this._data);
      });
    });
  }

  /** 同步读取（需先 await load） */
  static get(): GameSwitchesData {
    return this._data ?? { ...DEFAULTS };
  }
}
