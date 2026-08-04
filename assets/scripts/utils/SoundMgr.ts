import { AudioClip, AudioSource, Node, resources } from 'cc';
import { AUDIO_MAP } from './Constants';

export class SoundMgr {
  private static _clips: Record<string, AudioClip> = {};
  private static _sfx: AudioSource | null = null;
  private static _bgm: AudioSource | null = null;
  private static _ready = false;

  static async init(host: Node) {
    if (this._ready) return;
    this._sfx = host.addComponent(AudioSource);
    this._bgm = host.addComponent(AudioSource);
    this._bgm.loop = true;
    this._bgm.volume = 0.28;
    const names = Object.keys(AUDIO_MAP);
    await Promise.all(names.map((k) => new Promise<void>((resolve) => {
      resources.load(AUDIO_MAP[k], AudioClip, (err, clip) => {
        if (!err && clip) this._clips[k] = clip;
        resolve();
      });
    })));
    this._ready = true;
  }

  static play(name: string) {
    const clip = this._clips[name];
    if (!clip || !this._sfx) return;
    this._sfx.playOneShot(clip, (name === 'win') ? 0.55 : 0.45);
  }

  static playMove(mat: string) {
    if (/Wood/i.test(mat || '')) return this.play('moveWood');
    if (/Stone/i.test(mat || '')) return this.play('moveStone');
    const arr = ['move1', 'move2', 'move3'];
    this.play(arr[Math.floor(Math.random() * arr.length)]);
  }

  static startBgm() {
    const clip = this._clips.bgm;
    if (!clip || !this._bgm) return;
    if (this._bgm.playing) return;
    this._bgm.clip = clip;
    this._bgm.play();
  }
}
