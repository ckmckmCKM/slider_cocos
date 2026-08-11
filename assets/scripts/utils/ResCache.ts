import {
  AssetManager, AudioClip, ImageAsset, JsonAsset, Prefab, SpriteFrame, TextAsset, Texture2D, assetManager, resources,
} from 'cc';
import { LevelParser } from '../blocky/LevelParser';
import { LevelConfig } from '../blocky/LevelTypes';
import { LevelsMap } from './LevelTypes';
import { StoryConfig } from '../story/StoryTypes';
import { GEditorStoryConfig, isGEditorStoryConfig, normalizeGEditorStoryConfig } from '../story/GEditorTypes';

export class ResCache {
  private static _levels: LevelsMap | null = null;
  private static _brLevels = new Map<number, LevelConfig>();
  private static _sf: Record<string, SpriteFrame> = {};
  private static _audioClips: Record<string, AudioClip> = {};
  private static _prefab: Record<string, Prefab> = {};
  private static _maxBrLevel = 0;
  private static _brCatalogReady = false;
  private static _gameBundle: AssetManager.Bundle | null = null;
  private static _gameBundleLoading: Promise<AssetManager.Bundle> | null = null;
  private static _comBundle: AssetManager.Bundle | null = null;
  private static _comBundleLoading: Promise<AssetManager.Bundle> | null = null;
  private static _homeBundle: AssetManager.Bundle | null = null;
  private static _homeBundleLoading: Promise<AssetManager.Bundle> | null = null;
  private static _storyBundles = new Map<string, AssetManager.Bundle>();
  private static _storyBundleLoading = new Map<string, Promise<AssetManager.Bundle>>();
  private static _storyJson: Record<string, StoryConfig> = {};
  private static _geditorStoryJson: Record<string, GEditorStoryConfig> = {};
  private static _storyDocRaw: Record<string, unknown> = {};

  static maxBrLevel() { return this._maxBrLevel; }

  /** 扫描 game bundle 内 levels_br 目录，得到实际关卡总数（最大 Lv 编号） */
  static async ensureBrLevelCatalog(): Promise<void> {
    if (this._brCatalogReady) return;
    const bundle = await this.loadGameBundle();
    const infos = bundle.getDirWithPath('levels_br', TextAsset);
    let max = 0;
    for (const info of infos) {
      const m = info.path.match(/Lv_(\d+)/i);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    this._maxBrLevel = max;
    this._brCatalogReady = true;
  }

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

  /** 加载 home Asset Bundle（大厅 / 选关） */
  static loadHomeBundle(): Promise<AssetManager.Bundle> {
    if (this._homeBundle) return Promise.resolve(this._homeBundle);
    if (this._homeBundleLoading) return this._homeBundleLoading;
    this._homeBundleLoading = new Promise((resolve, reject) => {
      assetManager.loadBundle('home', (err, bundle) => {
        this._homeBundleLoading = null;
        if (err || !bundle) {
          reject(err || new Error('home bundle missing'));
          return;
        }
        this._homeBundle = bundle;
        resolve(bundle);
      });
    });
    return this._homeBundleLoading;
  }

  /** home bundle 下图，path 不含扩展名 */
  static async homeSprite(name: string): Promise<SpriteFrame | null> {
    const path = `sprite/${name}`;
    if (this._sf[`home:${path}`]) return this._sf[`home:${path}`];
    const bundle = await this.loadHomeBundle();
    const sf = await this.loadSpriteFromBundle(bundle, path);
    if (sf) this._sf[`home:${path}`] = sf;
    return sf;
  }

  /** home bundle 预制体，如 prefab/Lobby */
  static async loadHomePrefab(path: string): Promise<Prefab | null> {
    const key = `home:${path}`;
    if (this._prefab[key]) return this._prefab[key];
    const bundle = await this.loadHomeBundle();
    return new Promise((resolve) => {
      bundle.load(path, Prefab, (err, prefab) => {
        if (err || !prefab) {
          console.error('load home prefab failed', path, err);
          resolve(null);
          return;
        }
        this._prefab[key] = prefab;
        resolve(prefab);
      });
    });
  }

  /** 加载 com Asset Bundle（公共 UI / 对话等） */
  static loadComBundle(): Promise<AssetManager.Bundle> {
    if (this._comBundle) return Promise.resolve(this._comBundle);
    if (this._comBundleLoading) return this._comBundleLoading;
    this._comBundleLoading = new Promise((resolve, reject) => {
      assetManager.loadBundle('com', (err, bundle) => {
        this._comBundleLoading = null;
        if (err || !bundle) {
          reject(err || new Error('com bundle missing'));
          return;
        }
        this._comBundle = bundle;
        resolve(bundle);
      });
    });
    return this._comBundleLoading;
  }

  /** com bundle 下图集，path 不含扩展名，如 duihuakuang / mingzi */
  static async comSprite(name: string): Promise<SpriteFrame | null> {
    const path = `sprite/${name}`;
    if (this._sf[path]) return this._sf[path];
    const bundle = await this.loadComBundle();
    return this.loadSpriteFromBundle(bundle, path);
  }

  /** 加载剧情 Asset Bundle（如 story1） */
  static loadStoryBundle(name = 'story1'): Promise<AssetManager.Bundle> {
    const cached = this._storyBundles.get(name);
    if (cached) return Promise.resolve(cached);
    const loading = this._storyBundleLoading.get(name);
    if (loading) return loading;
    const p = new Promise<AssetManager.Bundle>((resolve, reject) => {
      assetManager.loadBundle(name, (err, bundle) => {
        this._storyBundleLoading.delete(name);
        if (err || !bundle) {
          reject(err || new Error(`${name} bundle missing`));
          return;
        }
        this._storyBundles.set(name, bundle);
        resolve(bundle);
      });
    });
    this._storyBundleLoading.set(name, p);
    return p;
  }

  /** 加载 story.json 原始文档（自动识别 geditor-cocos / 旧 steps 格式） */
  static async loadStoryDocument(name = 'story1'): Promise<unknown | null> {
    if (this._storyDocRaw[name] !== undefined) return this._storyDocRaw[name];
    const bundle = await this.loadStoryBundle(name);
    return new Promise((resolve) => {
      bundle.load('story', JsonAsset, (err, asset) => {
        if (err || !asset) {
          console.error('load story.json failed', name, err);
          resolve(null);
          return;
        }
        const data = asset.json;
        this._storyDocRaw[name] = data;
        if (isGEditorStoryConfig(data)) {
          this._geditorStoryJson[name] = normalizeGEditorStoryConfig(data);
        } else {
          this._storyJson[name] = data as StoryConfig;
        }
        resolve(data);
      });
    });
  }

  static async isGEditorStoryFormat(name = 'story1'): Promise<boolean> {
    const doc = await this.loadStoryDocument(name);
    return isGEditorStoryConfig(doc);
  }

  /** GEditor 导出：geditor-cocos */
  static async loadGEditorStoryConfig(name = 'story1'): Promise<GEditorStoryConfig | null> {
    if (this._geditorStoryJson[name]) return this._geditorStoryJson[name];
    const doc = await this.loadStoryDocument(name);
    if (!isGEditorStoryConfig(doc)) return null;
    const normalized = normalizeGEditorStoryConfig(doc);
    this._geditorStoryJson[name] = normalized;
    return normalized;
  }

  /** 剧情顺序 JSON：bundle 根目录 story.json（旧 steps 格式） */
  static async loadStoryConfig(name = 'story1'): Promise<StoryConfig | null> {
    if (this._storyJson[name]) return this._storyJson[name];
    const doc = await this.loadStoryDocument(name);
    if (!doc || isGEditorStoryConfig(doc)) return null;
    return doc as StoryConfig;
  }

  /** 剧情 step 图：sprite/step/{stepName} */
  static async storyStepSprite(storyName: string, stepName: string): Promise<SpriteFrame | null> {
    const path = `sprite/step/${stepName}`;
    const key = `${storyName}:${path}`;
    if (this._sf[key]) return this._sf[key];
    const bundle = await this.loadStoryBundle(storyName);
    const sf = await this.loadSpriteFromBundle(bundle, path);
    if (sf) this._sf[key] = sf;
    return sf;
  }

  /** 剧情音频：audio/{fileName}（可带扩展名，会再尝试去扩展名路径） */
  static async storyAudioClip(storyName: string, fileName: string): Promise<AudioClip | null> {
    const raw = String(fileName || '').trim();
    if (!raw) return null;
    const base = raw.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '');
    const path = `audio/${base}`;
    const key = `${storyName}:${path}`;
    if (this._audioClips[key]) return this._audioClips[key];
    const bundle = await this.loadStoryBundle(storyName);
    return new Promise((resolve) => {
      bundle.load(path, AudioClip, (err, clip) => {
        if (!err && clip) {
          this._audioClips[key] = clip;
          resolve(clip);
          return;
        }
        const altPath = `audio/${raw}`;
        bundle.load(altPath, AudioClip, (err2, clip2) => {
          if (!err2 && clip2) {
            this._audioClips[key] = clip2;
            resolve(clip2);
            return;
          }
          console.warn('[ResCache] story audio load failed', storyName, raw, err2 || err);
          resolve(null);
        });
      });
    });
  }

  /** com bundle 预制体，如 prefab/Dialogue */
  static async loadComPrefab(path: string): Promise<Prefab | null> {
    const key = `com:${path}`;
    if (this._prefab[key]) return this._prefab[key];
    const bundle = await this.loadComBundle();
    return new Promise((resolve) => {
      bundle.load(path, Prefab, (err, prefab) => {
        if (err || !prefab) {
          console.error('load com prefab failed', path, err);
          resolve(null);
          return;
        }
        this._prefab[key] = prefab;
        resolve(prefab);
      });
    });
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
    return path.startsWith('sprite/')
      || path.startsWith('levels_br/')
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

  /** 大厅 / 选关 UI 图（home bundle） */
  static ui(name: string) { return this.homeSprite(name); }
  static uiBr(name: string) { return this.loadSprite(`sprite/ui_br/${name}`); }

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
