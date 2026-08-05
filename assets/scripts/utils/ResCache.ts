import { JsonAsset, SpriteFrame, Texture2D, resources, ImageAsset, TextAsset } from 'cc';
import { LevelParser } from '../blocky/LevelParser';
import { LevelConfig } from '../blocky/LevelTypes';
import { LevelsMap } from './LevelTypes';

export class ResCache {
  private static _levels: LevelsMap | null = null;
  private static _brLevels = new Map<number, LevelConfig>();
  private static _sf: Record<string, SpriteFrame> = {};
  private static _maxBrLevel = 650;

  static maxBrLevel() { return this._maxBrLevel; }

  /** 旧版 all.json（兼容） */
  static async loadLevels(): Promise<LevelsMap> {
    if (this._levels) return this._levels;
    return new Promise((resolve, reject) => {
      resources.load('levels/all', JsonAsset, (err, asset) => {
        if (err || !asset) {
          reject(err || new Error('levels/all missing'));
          return;
        }
        this._levels = asset.json as LevelsMap;
        resolve(this._levels);
      });
    });
  }

  static levelKeys(): number[] {
    if (!this._levels) return [];
    return Object.keys(this._levels).map(Number).sort((a, b) => a - b);
  }

  static getLevel(idx: number) {
    return this._levels?.[String(idx)] || null;
  }

  /** Block Reveal：按需加载 Lv_XXXX.txt */
  static async loadBrLevel(idx: number): Promise<LevelConfig | null> {
    if (this._brLevels.has(idx)) return this._brLevels.get(idx)!;
    const name = `levels_br/Lv_${String(idx).padStart(4, '0')}`;
    return new Promise((resolve) => {
      resources.load(name, TextAsset, (err, asset) => {
        if (err || !asset) {
          resolve(null);
          return;
        }
        try {
          const cfg = LevelParser.parse(asset.text);
          this._brLevels.set(idx, cfg);
          resolve(cfg);
        } catch (e) {
          console.error('parse level failed', idx, e);
          resolve(null);
        }
      });
    });
  }

  /** path without extension, under resources */
  static loadSprite(path: string): Promise<SpriteFrame | null> {
    if (this._sf[path]) return Promise.resolve(this._sf[path]);
    return new Promise((resolve) => {
      resources.load(`${path}/spriteFrame`, SpriteFrame, (err, sf) => {
        if (!err && sf) {
          this._sf[path] = sf;
          resolve(sf);
          return;
        }
        resources.load(path, SpriteFrame, (err2, sf2) => {
          if (!err2 && sf2) {
            this._sf[path] = sf2;
            resolve(sf2);
            return;
          }
          resources.load(path, ImageAsset, (err3, img) => {
            if (err3 || !img) {
              resolve(null);
              return;
            }
            const tex = new Texture2D();
            tex.image = img;
            const frame = new SpriteFrame();
            frame.texture = tex;
            this._sf[path] = frame;
            resolve(frame);
          });
        });
      });
    });
  }

  static img(name: string) { return this.loadSprite(`img/${name}`); }

  static ui(name: string) { return this.loadSprite(`ui/${name}`); }
  static uiBr(name: string) { return this.loadSprite(`ui_br/${name}`); }
}
