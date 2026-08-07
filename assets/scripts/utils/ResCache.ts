import {
  AssetManager, ImageAsset, JsonAsset, Prefab, SpriteFrame, TextAsset, Texture2D, assetManager, resources,
} from 'cc';
import { LevelParser } from '../blocky/LevelParser';
import { LevelConfig } from '../blocky/LevelTypes';
import { LevelsMap } from './LevelTypes';

export class ResCache {
  private static _levels: LevelsMap | null = null;
  private static _brLevels = new Map<number, LevelConfig>();
  private static _sf: Record<string, SpriteFrame> = {};
  private static _prefab: Record<string, Prefab> = {};
  private static _maxBrLevel = 650;
  private static _gameBundle: AssetManager.Bundle | null = null;
  private static _gameBundleLoading: Promise<AssetManager.Bundle> | null = null;

  static maxBrLevel() { return this._maxBrLevel; }

  /** 加载 game Asset Bundle（关卡 / 揭图 / 局内 UI / 音效） */
  static loadGameBundle(): Promise<AssetManager.Bundle> {
    if (this._gameBundle) return Promise.resolve(this._gameBundle);
    if (this._gameBundleLoading) return this._gameBundleLoading;
    this._gameBundleLoading = new Promise((resolve, reject) => {
      assetManager.loadBundle('game', (err, bundle) => {
        this._gameBundleLoading = null;
        if (err || !bundle) {
          reject(err || new Error('game bundle missing'));
          return;
        }
        this._gameBundle = bundle;
        resolve(bundle);
      });
    });
    return this._gameBundleLoading;
  }

  /** 旧版 all.json（兼容，仍在 resources） */
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

  /** Block Reveal：按需加载 Lv_XXXX.txt（game bundle） */
  static async loadBrLevel(idx: number): Promise<LevelConfig | null> {
    if (this._brLevels.has(idx)) return this._brLevels.get(idx)!;
    const bundle = await this.loadGameBundle();
    const name = `levels_br/Lv_${String(idx).padStart(4, '0')}`;
    return new Promise((resolve) => {
      bundle.load(name, TextAsset, (err, asset) => {
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

  private static isGameAssetPath(path: string): boolean {
    return path.startsWith('levels_br/')
      || path.startsWith('pictures/')
      || path.startsWith('icon/')
      || path.startsWith('icon_bg/')
      || path.startsWith('ui_br/')
      || path.startsWith('prefab/')
      || path.startsWith('audio/');
  }

  private static loadSpriteFromBundle(bundle: AssetManager.Bundle, path: string): Promise<SpriteFrame | null> {
    return new Promise((resolve) => {
      bundle.load(`${path}/spriteFrame`, SpriteFrame, (err, sf) => {
        if (!err && sf) {
          this._sf[path] = sf;
          resolve(sf);
          return;
        }
        bundle.load(path, SpriteFrame, (err2, sf2) => {
          if (!err2 && sf2) {
            this._sf[path] = sf2;
            resolve(sf2);
            return;
          }
          bundle.load(path, ImageAsset, (err3, img) => {
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

  private static loadSpriteFromResources(path: string): Promise<SpriteFrame | null> {
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

  /** path without extension；game 资源走 game bundle，其余走 resources */
  static async loadSprite(path: string): Promise<SpriteFrame | null> {
    if (this._sf[path]) return this._sf[path];
    if (this.isGameAssetPath(path)) {
      const bundle = await this.loadGameBundle();
      return this.loadSpriteFromBundle(bundle, path);
    }
    return this.loadSpriteFromResources(path);
  }

  static img(name: string) { return this.loadSprite(`img/${name}`); }

  static ui(name: string) { return this.loadSprite(`ui/${name}`); }
  static uiBr(name: string) { return this.loadSprite(`ui_br/${name}`); }

  /** game bundle 预制体，如 prefab/SliderGame */
  static async loadPrefab(path: string): Promise<Prefab | null> {
    if (this._prefab[path]) return this._prefab[path];
    const bundle = await this.loadGameBundle();
    return new Promise((resolve) => {
      bundle.load(path, Prefab, (err, prefab) => {
        if (err || !prefab) {
          console.error('load prefab failed', path, err);
          resolve(null);
          return;
        }
        this._prefab[path] = prefab;
        resolve(prefab);
      });
    });
  }
}
