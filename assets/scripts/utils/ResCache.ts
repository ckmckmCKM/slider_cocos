import { JsonAsset, SpriteFrame, Texture2D, resources, ImageAsset } from 'cc';
import { LevelsMap } from './LevelTypes';

export class ResCache {
  private static _levels: LevelsMap | null = null;
  private static _sf: Record<string, SpriteFrame> = {};

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

  /** path without extension, under resources: img/xxx or ui/xxx */
  static loadSprite(path: string): Promise<SpriteFrame | null> {
    if (this._sf[path]) return Promise.resolve(this._sf[path]);
    return new Promise((resolve) => {
      // Prefer spriteFrame sub-asset
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
}
