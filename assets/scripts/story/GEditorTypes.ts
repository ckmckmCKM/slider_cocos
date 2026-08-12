/** GEditor 导出格式 geditor-cocos（见 GEditor/app.js buildCocosExport） */

export type GEditorTransitionType = 'fade' | string;

export type GEditorTextPos = 'bottom' | 'top' | string;

export type GEditorEffectType = 'fade' | 'slide-left' | 'slide-up' | 'zoom' | 'none' | string;

export type GEditorFrameTransitionEffect = 'fade' | 'slide-left' | 'slide-up' | 'zoom' | 'none';

export const DEFAULT_FRAME_EFFECT_SEC = 0.5;
export const FRAME_EFFECT_SEC_MAX = 5;

export function resolveFrameTransitionEffect(
  raw: string | null | undefined,
  fallback: GEditorFrameTransitionEffect = 'fade',
): GEditorFrameTransitionEffect {
  const s = String(raw ?? '').trim();
  if (s === 'fade' || s === 'slide-left' || s === 'slide-up' || s === 'zoom' || s === 'none') {
    return s;
  }
  return fallback;
}

export function resolveFrameInDurationSec(
  effectRaw: string | null | undefined,
  durationRaw: number | null | undefined,
  fallbackSec = DEFAULT_FRAME_EFFECT_SEC,
): number {
  const effect = resolveFrameTransitionEffect(effectRaw, 'fade');
  if (effect === 'none') return 0;
  const n = Number(durationRaw);
  if (!Number.isFinite(n) || n < 0) return fallbackSec;
  if (n === 0) return 0;
  return Math.min(FRAME_EFFECT_SEC_MAX, Math.round(n * 100) / 100);
}

export function resolveFrameOutDurationSec(
  effectRaw: string | null | undefined,
  durationRaw: number | null | undefined,
  fallbackSec = DEFAULT_FRAME_EFFECT_SEC,
): number {
  return resolveFrameInDurationSec(effectRaw, durationRaw, fallbackSec);
}

export type GEditorAutoSkipEffect = 'blur' | 'mosaic';

export interface GEditorTransition {
  type: GEditorTransitionType;
  durationMs: number;
}

export interface GEditorAssets {
  textures: string[];
  audios: string[];
}

export interface GEditorPopupTrigger {
  x: number;
  y: number;
  radius: number;
}

export type GEditorPopupMode = 'auto' | 'trigger';

export interface GEditorPopup {
  nodeId: string;
  textureFile: string | null;
  speaker: string;
  text: string;
  textPos: GEditorTextPos;
  /** 台词逐字显示速度（字/秒） */
  textSpeed?: number | null;
  audioFile: string | null;
  trigger: GEditorPopupTrigger | null;
  /** auto=帧呈现后自动叠层；trigger=点击热点打开 */
  mode?: GEditorPopupMode | string | null;
  /** trigger 模式下点空白提示文案；缺省「点击高亮区域继续」 */
  missTip?: string | null;
  /** Popup 打开时播放（Sound 引脚）；与 audioFile（台词语音）独立 */
  sounds?: GEditorExecSoundEntry[] | null;
  /** @deprecated 单音频遗留字段 */
  soundNodeId?: string | null;
  soundMode?: 'bgm' | 'sfx' | string | null;
  soundFile?: string | null;
  bgNodeId?: string | null;
  iconNodeId?: string | null;
  bgFile?: string | null;
  iconFile?: string | null;
  inEffect?: string;
  inDurationSec?: number;
}

export interface GEditorAutoSkip {
  effect: GEditorAutoSkipEffect;
  durationSec: number;
}

export interface GEditorDialogueLine {
  speaker: string;
  text: string;
  textSpeed?: number | null;
}

export const DEFAULT_TEXT_SPEED = 18;
export const TEXT_SPEED_MIN = 1;
export const TEXT_SPEED_MAX = 120;

/** 台词逐字显示速度（字/秒） */
export function resolveTextSpeed(raw: number | null | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_TEXT_SPEED;
  return Math.min(TEXT_SPEED_MAX, Math.max(TEXT_SPEED_MIN, Math.round(n)));
}

export interface GEditorNodeBase {
  id: string;
  name: string;
  order: number;
  next: string | null;
  nextExplicit: boolean;
}

export interface GEditorFrameNode extends GEditorNodeBase {
  kind: 'frame';
  textureNodeId: string | null;
  textureFile: string | null;
  textNodeId: string | null;
  speaker: string;
  text: string;
  textPos: GEditorTextPos;
  /** 台词逐字显示速度（字/秒） */
  textSpeed?: number | null;
  audioFile: string | null;
  inEffect: GEditorEffectType;
  outEffect: GEditorEffectType;
  /** 入效果时长（秒）；inEffect 为 none 时不使用 */
  inDurationSec?: number;
  /** 出效果时长（秒）；outEffect 为 none 时不使用 */
  outDurationSec?: number;
  holdSec: number;
  autoSkip: GEditorAutoSkip | null;
  popup: GEditorPopup | null;
  dialogueChain?: GEditorDialogueLine[] | null;
  /** @deprecated 单音频遗留字段，请用 sounds */
  soundNodeId?: string | null;
  soundMode?: 'bgm' | 'sfx' | string | null;
  soundFile?: string | null;
  /** 本帧音频列表：最多 1 条 bgm，可多条 sfx */
  sounds?: GEditorExecSoundEntry[] | null;
}

export interface GEditorExecSoundEntry {
  soundNodeId?: string | null;
  soundFile: string;
  mode: 'bgm' | 'sfx';
  /** 仅 SFX：切到下一 exec 帧时是否停止（默认 true） */
  stopOnFrameChange?: boolean | null;
}

export interface GEditorGameNode extends GEditorNodeBase {
  kind: 'game';
  levelId?: number | string;
  /** 底图 Texture 节点 id（与 Frame.textureNodeId 同模式） */
  gateFrameNodeId?: string | null;
  /** 入口按钮 Texture 节点 id */
  gateBtnNodeId?: string | null;
  gateFrame?: string | null;
  gateTip?: string;
  gateBtn?: string | null;
  gateBtnMarginX?: number;
  gateBtnMarginY?: number;
  gateBtnSize?: number;
  /** 通关后获得道具（Texture 经 Reward 引脚） */
  winReward?: GEditorGameWinReward | null;
}

export interface GEditorGameWinReward {
  textureNodeId?: string | null;
  textureFile: string | null;
}

export function normalizeGameWinReward(
  raw: GEditorGameWinReward | null | undefined,
): GEditorGameWinReward | null {
  if (!raw || typeof raw !== 'object') return null;
  const textureFile = raw.textureFile ? String(raw.textureFile).trim() : '';
  if (!textureFile) return null;
  return {
    textureNodeId: raw.textureNodeId || null,
    textureFile,
  };
}

/** @deprecated 旧 exec 链 Popup；加载时合并进上一帧 frame.popup */
export interface GEditorPopupNode extends GEditorNodeBase {
  kind: 'popup';
  mode: 'auto';
  bgNodeId?: string | null;
  iconNodeId?: string | null;
  bgFile: string | null;
  iconFile: string | null;
  inEffect?: string;
  inDurationSec?: number;
}

export type GEditorPopupInEffect = 'fade' | 'zoom' | 'fade-zoom' | 'none';

export const DEFAULT_POPUP_IN_EFFECT: GEditorPopupInEffect = 'fade-zoom';
export const DEFAULT_POPUP_IN_SEC = 0.35;

export function resolvePopupInEffect(raw: string | null | undefined): GEditorPopupInEffect {
  const s = String(raw ?? '').trim();
  if (s === 'fade' || s === 'zoom' || s === 'fade-zoom' || s === 'none') return s;
  return DEFAULT_POPUP_IN_EFFECT;
}

export function resolvePopupInDurationSec(raw: number | null | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_POPUP_IN_SEC;
  if (n === 0) return 0;
  return Math.min(3, Math.max(0.05, Math.round(n * 100) / 100));
}

export function normalizeGEditorSoundMode(raw: string | null | undefined): 'bgm' | 'sfx' {
  return String(raw ?? '').trim().toLowerCase() === 'sfx' ? 'sfx' : 'bgm';
}

/** SFX 切帧是否停止；缺省 false（切帧不主动停，播完自然结束） */
export function normalizeSfxStopOnFrameChange(
  raw: boolean | null | undefined,
  mode: 'bgm' | 'sfx',
): boolean {
  if (mode !== 'sfx') return false;
  return raw === true;
}

export interface GEditorExecSoundSpec {
  file: string | null;
  mode: 'bgm' | 'sfx';
}

export function normalizeExecSoundEntry(
  raw: GEditorExecSoundEntry | null | undefined,
): GEditorExecSoundEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const file = raw.soundFile ? String(raw.soundFile).trim() : '';
  if (!file) return null;
  const mode = normalizeGEditorSoundMode(raw.mode);
  const entry: GEditorExecSoundEntry = {
    soundNodeId: raw.soundNodeId || null,
    soundFile: file,
    mode,
  };
  if (mode === 'sfx') {
    entry.stopOnFrameChange = normalizeSfxStopOnFrameChange(raw.stopOnFrameChange, mode);
  }
  return entry;
}

/** 归一化 frame 音频列表：最多保留 1 条 bgm，保留全部 sfx */
export function normalizeFrameSounds(
  raw: GEditorExecSoundEntry[] | null | undefined,
): GEditorExecSoundEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: GEditorExecSoundEntry[] = [];
  let hasBgm = false;
  for (const item of raw) {
    const entry = normalizeExecSoundEntry(item);
    if (!entry) continue;
    if (entry.mode === 'bgm') {
      if (hasBgm) continue;
      hasBgm = true;
    }
    out.push(entry);
  }
  return out;
}

function legacyFrameSoundEntries(frame: GEditorFrameNode): GEditorExecSoundEntry[] {
  const file = frame.soundFile ? String(frame.soundFile).trim() : '';
  if (!file) return [];
  return [{
    soundNodeId: frame.soundNodeId || null,
    soundFile: file,
    mode: normalizeGEditorSoundMode(frame.soundMode),
  }];
}

/** exec 节点上挂接的 Sound（frame；game/popup 预留同名字段） */
export function geditorNodeExecSounds(node: GEditorStoryNode): GEditorExecSoundEntry[] {
  const raw = node as GEditorFrameNode & GEditorGameNode & GEditorPopupNode & {
    sounds?: GEditorExecSoundEntry[] | null;
    soundFile?: string | null;
    soundMode?: string | null;
    soundNodeId?: string | null;
  };
  const fromList = normalizeFrameSounds(raw.sounds);
  if (fromList.length) return fromList;
  if (isGEditorFrameNode(node)) return legacyFrameSoundEntries(node);
  const file = raw.soundFile ? String(raw.soundFile).trim() : '';
  if (!file) return [];
  return [{
    soundNodeId: raw.soundNodeId || null,
    soundFile: file,
    mode: normalizeGEditorSoundMode(raw.soundMode),
  }];
}

/** @deprecated 使用 geditorNodeExecSounds */
export function geditorNodeExecSound(node: GEditorStoryNode): GEditorExecSoundSpec | null {
  const list = geditorNodeExecSounds(node);
  if (!list.length) return null;
  const first = list[0];
  return { file: first.soundFile, mode: first.mode };
}

export type GEditorStoryNode = GEditorFrameNode | GEditorGameNode | GEditorPopupNode;

export interface GEditorTextureNode {
  id: string;
  file: string | null;
  target: string | null;
}

export interface GEditorTextNode {
  id: string;
  speaker: string;
  text: string;
  textPos: GEditorTextPos;
  /** 台词逐字显示速度（字/秒） */
  textSpeed?: number | null;
  audioFile: string | null;
  target: string | null;
}

export interface GEditorSoundNode {
  id: string;
  mode: 'bgm' | 'sfx' | string;
  audioFile: string | null;
  target: string | null;
}

export interface GEditorStoryConfig {
  format: 'geditor-cocos';
  version: number;
  name: string;
  exportedAt?: string;
  transition: GEditorTransition;
  assets: GEditorAssets;
  entry: string | null;
  sequence: string[];
  nodes: GEditorStoryNode[];
  textureNodes: GEditorTextureNode[];
  textNodes: GEditorTextNode[];
  soundNodes?: GEditorSoundNode[];
}

export function isGEditorStoryConfig(data: unknown): data is GEditorStoryConfig {
  return Boolean(
    data &&
    typeof data === 'object' &&
    (data as GEditorStoryConfig).format === 'geditor-cocos' &&
    Array.isArray((data as GEditorStoryConfig).sequence) &&
    Array.isArray((data as GEditorStoryConfig).nodes),
  );
}

export function isGEditorFrameNode(node: GEditorStoryNode): node is GEditorFrameNode {
  return node.kind === 'frame';
}

export function isGEditorGameNode(node: GEditorStoryNode): node is GEditorGameNode {
  return node.kind === 'game';
}

export function isGEditorPopupExecNode(node: GEditorStoryNode): node is GEditorPopupNode {
  return node.kind === 'popup';
}

/** 兼容旧导出 kind:subview */
export function isGEditorSubviewNode(node: GEditorStoryNode): node is GEditorPopupNode {
  return isGEditorPopupExecNode(node);
}

/** sprite/step 资源名：去掉扩展名，与现有 story bundle 路径一致 */
export function geditorTextureStepName(textureFile: string | null | undefined): string {
  const raw = String(textureFile || '').trim();
  if (!raw) return '';
  const base = raw.split(/[\\/]/).pop() || raw;
  return base.replace(/\.(png|jpg|jpeg|webp)$/i, '');
}

export function geditorNodeHasCaption(node: GEditorFrameNode): boolean {
  return Boolean(node.speaker.trim() || node.text.trim());
}

export function geditorPopupBg(popup: GEditorPopup | null | undefined): string | null {
  const raw = popup?.bgFile;
  return raw ? String(raw) : null;
}

export function geditorPopupIcon(popup: GEditorPopup | null | undefined): string | null {
  const raw = popup?.iconFile || popup?.textureFile;
  return raw ? String(raw) : null;
}

export function geditorPopupIsAuto(popup: GEditorPopup | null | undefined): boolean {
  if (!popup) return false;
  if (String(popup.mode || '').trim() === 'trigger') return false;
  if (String(popup.mode || '').trim() === 'auto') return true;
  return !popup.trigger && Boolean(geditorPopupBg(popup) || geditorPopupIcon(popup));
}

export const DEFAULT_TRIGGER_MISS_TIP = '点击高亮区域继续';

/** trigger 未点中提示；缺省默认文案 */
export function geditorPopupMissTip(popup: GEditorPopup | null | undefined): string {
  const tip = String(popup?.missTip || '').trim();
  return tip || DEFAULT_TRIGGER_MISS_TIP;
}

/** Popup 引脚 Sound（打开时播放） */
export function geditorPopupSounds(popup: GEditorPopup | null | undefined): GEditorExecSoundEntry[] {
  if (!popup) return [];
  const fromList = normalizeFrameSounds(popup.sounds);
  if (fromList.length) return fromList;
  const file = popup.soundFile ? String(popup.soundFile).trim() : '';
  if (!file) return [];
  return [{
    soundNodeId: popup.soundNodeId || null,
    soundFile: file,
    mode: normalizeGEditorSoundMode(popup.soundMode),
  }];
}

/** @deprecated 使用 geditorPopupBg */
export function geditorPopupExecBg(node: GEditorPopupNode): string | null {
  return geditorPopupBg(node as unknown as GEditorPopup);
}

/** @deprecated 使用 geditorPopupIcon */
export function geditorPopupExecIcon(node: GEditorPopupNode): string | null {
  return geditorPopupIcon(node as unknown as GEditorPopup);
}

function popupFromLegacyExecNode(node: GEditorPopupNode): GEditorPopup {
  return {
    nodeId: node.id,
    textureFile: node.iconFile,
    bgFile: node.bgFile,
    iconFile: node.iconFile,
    bgNodeId: node.bgNodeId || null,
    iconNodeId: node.iconNodeId || null,
    inEffect: resolvePopupInEffect(node.inEffect),
    inDurationSec: resolvePopupInDurationSec(node.inDurationSec),
    mode: 'auto',
    speaker: '',
    text: '',
    textPos: 'bottom',
    audioFile: null,
    trigger: null,
    missTip: null,
    sounds: null,
    soundNodeId: null,
    soundMode: null,
    soundFile: null,
  };
}

function normalizeFramePopup(raw: GEditorPopup | null | undefined): GEditorPopup | null {
  if (!raw || typeof raw !== 'object') return null;
  const iconFile = raw.iconFile || raw.textureFile || null;
  const bgFile = raw.bgFile || null;
  if (!iconFile && !bgFile && !raw.speaker?.trim() && !raw.text?.trim()) return null;
  const modeRaw = String(raw.mode ?? '').trim();
  const mode: GEditorPopupMode = modeRaw === 'trigger' ? 'trigger' : 'auto';
  const sounds = normalizeFrameSounds(raw.sounds);
  const primary = sounds[0] || null;
  return {
    nodeId: raw.nodeId || '',
    textureFile: iconFile,
    bgFile,
    iconFile,
    bgNodeId: raw.bgNodeId || null,
    iconNodeId: raw.iconNodeId || null,
    inEffect: resolvePopupInEffect(raw.inEffect),
    inDurationSec: resolvePopupInDurationSec(raw.inDurationSec),
    mode,
    speaker: raw.speaker || '',
    text: raw.text || '',
    textPos: raw.textPos || 'bottom',
    textSpeed: resolveTextSpeed(raw.textSpeed),
    audioFile: raw.audioFile || null,
    trigger: raw.trigger || null,
    missTip: String(raw.missTip || '').trim() || null,
    sounds: sounds.length ? sounds : null,
    soundNodeId: primary?.soundNodeId || raw.soundNodeId || null,
    soundMode: primary?.mode || raw.soundMode || null,
    soundFile: primary?.soundFile || raw.soundFile || null,
  };
}

/** 旧导出/同步工程把 popup 写成无 texture 的 frame（name=subview_xxx 或 popup_xxx） */
export function inferPopupExecFromLegacyFrameName(name: string): { bg: string; icon: string } | null {
  const base = geditorTextureStepName(name);
  let iconStem = '';
  if (base.startsWith('subview_')) iconStem = base.slice('subview_'.length);
  else if (base.startsWith('popup_')) iconStem = base.slice('popup_'.length);
  else return null;
  if (!iconStem) return null;
  return {
    icon: `${iconStem}.png`,
    bg: `${iconStem}heidi.png`,
  };
}

/** @deprecated 使用 inferPopupExecFromLegacyFrameName */
export function inferSubviewFromLegacyFrameName(name: string): { bg: string; icon: string } | null {
  return inferPopupExecFromLegacyFrameName(name);
}

function toPopupExecNode(
  base: GEditorNodeBase,
  bg: string | null,
  icon: string | null,
  bgNodeId: string | null = null,
  iconNodeId: string | null = null,
): GEditorPopupNode {
  return {
    id: base.id,
    name: base.name,
    order: base.order,
    next: base.next,
    nextExplicit: base.nextExplicit,
    kind: 'popup',
    mode: 'auto',
    bgNodeId,
    iconNodeId,
    bgFile: bg,
    iconFile: icon,
  };
}

export const DEFAULT_GATE_BTN_MARGIN_X = 120;
export const DEFAULT_GATE_BTN_MARGIN_Y = 140;
export const DEFAULT_GATE_BTN_SIZE = 200;

/** 与 GEditor/app.js normalizeGateBtn* 对齐 */
export function resolveGateBtnLayout(node: {
  gateBtnMarginX?: number | null;
  gateBtnMarginY?: number | null;
  gateBtnSize?: number | null;
  gate_btn_margin_x?: number | null;
  gate_btn_margin_y?: number | null;
  gate_btn_size?: number | null;
}): { marginX: number; marginY: number; size: number } {
  const nx = Number(node.gateBtnMarginX ?? node.gate_btn_margin_x);
  const ny = Number(node.gateBtnMarginY ?? node.gate_btn_margin_y);
  const ns = Number(node.gateBtnSize ?? node.gate_btn_size);
  return {
    marginX: Number.isFinite(nx) && nx >= 0 ? Math.round(nx) : DEFAULT_GATE_BTN_MARGIN_X,
    marginY: Number.isFinite(ny) && ny >= 0 ? Math.round(ny) : DEFAULT_GATE_BTN_MARGIN_Y,
    size: Number.isFinite(ns) && ns > 0 ? Math.round(ns) : DEFAULT_GATE_BTN_SIZE,
  };
}

/** 修补导出 JSON：旧 exec popup 合并进 frame.popup */
export function normalizeGEditorStoryConfig(cfg: GEditorStoryConfig): GEditorStoryConfig {
  const texById = new Map((cfg.textureNodes || []).map((t) => [t.id, t]));
  const sndById = new Map((cfg.soundNodes || []).map((s) => [s.id, s]));
  const resolveTexFile = (
    nodeId: string | null | undefined,
    fallback: string | null | undefined,
  ): string | null => {
    if (nodeId) {
      const file = texById.get(nodeId)?.file;
      if (file) return file;
    }
    return fallback ? String(fallback) : null;
  };

  const nodeById = new Map(cfg.nodes.map((n) => [n.id, n]));
  const mergedPopupByHost = new Map<string, GEditorPopup>();

  for (let i = 0; i < cfg.sequence.length; i += 1) {
    const id = cfg.sequence[i];
    const node = nodeById.get(id);
    if (!node || !isGEditorPopupExecNode(node)) continue;
    const hostId = i > 0 ? cfg.sequence[i - 1] : null;
    const host = hostId ? nodeById.get(hostId) : null;
    if (!host || !isGEditorFrameNode(host)) continue;
    const popup = popupFromLegacyExecNode({
      ...node,
      bgFile: resolveTexFile(node.bgNodeId, node.bgFile),
      iconFile: resolveTexFile(node.iconNodeId, node.iconFile),
    });
    mergedPopupByHost.set(host.id, popup);
  }

  const keptIds = new Set<string>();
  const newSequence: string[] = [];
  for (const id of cfg.sequence) {
    const node = nodeById.get(id);
    if (node && isGEditorPopupExecNode(node)) continue;
    keptIds.add(id);
    newSequence.push(id);
  }

  const nodes = cfg.nodes
    .filter((node) => !isGEditorPopupExecNode(node))
    .map((node) => {
    const rawKind = (node as { kind?: string }).kind;
    if (rawKind === 'subview') {
      const legacy = node as GEditorPopupNode & {
        subviewBg?: string | null;
        subviewIcon?: string | null;
      };
      const hostId = newSequence.find((sid) => {
        const host = nodeById.get(sid);
        return host && isGEditorFrameNode(host);
      });
      if (hostId) {
        mergedPopupByHost.set(hostId, popupFromLegacyExecNode({
          ...legacy,
          id: legacy.id,
          kind: 'popup',
          mode: 'auto',
          bgFile: resolveTexFile(legacy.bgNodeId, legacy.bgFile || legacy.subviewBg || null),
          iconFile: resolveTexFile(legacy.iconNodeId, legacy.iconFile || legacy.subviewIcon || null),
        }));
      }
      return null;
    }

    if (isGEditorGameNode(node)) {
      const tipByName: Record<string, string> = {
        game_1_6: '需要找到钥匙才能进入',
        game_1_16: '需要灵牌',
        game_1_28: '需要符纸',
      };
      const tip = node.gateTip || tipByName[node.name] || '';
      const raw = node as GEditorGameNode & {
        winRewardTexId?: string | null;
      };
      const rewardTex = raw.winReward?.textureNodeId
        ? texById.get(raw.winReward.textureNodeId)?.file
        : null;
      return {
        ...node,
        gateFrameNodeId: node.gateFrameNodeId || null,
        gateBtnNodeId: node.gateBtnNodeId || null,
        gateFrame: resolveTexFile(node.gateFrameNodeId, node.gateFrame) || '3.png',
        gateBtn: resolveTexFile(node.gateBtnNodeId, node.gateBtn) || 'gametubiao.png',
        gateTip: tip,
        gateBtnMarginX: resolveGateBtnLayout(node).marginX,
        gateBtnMarginY: resolveGateBtnLayout(node).marginY,
        gateBtnSize: resolveGateBtnLayout(node).size,
        winReward: normalizeGameWinReward({
          textureNodeId: raw.winReward?.textureNodeId || null,
          textureFile: raw.winReward?.textureFile || rewardTex || null,
        }),
      };
    }

    if (!isGEditorFrameNode(node)) return node;

    const frame = node as GEditorFrameNode;
    const snd = frame.soundNodeId ? sndById.get(frame.soundNodeId) : null;
    const textById = new Map((cfg.textNodes || []).map((t) => [t.id, t]));
    const textNode = frame.textNodeId ? textById.get(frame.textNodeId) : null;
    const sounds = normalizeFrameSounds(
      frame.sounds?.length
        ? frame.sounds
        : (frame.soundFile || snd?.audioFile
          ? [{
            soundNodeId: frame.soundNodeId || snd?.id || null,
            soundFile: frame.soundFile || snd?.audioFile || '',
            mode: frame.soundMode || snd?.mode || 'bgm',
          }]
          : []),
    );
    const primary = sounds[0] || null;
    const merged = mergedPopupByHost.get(frame.id);
    const popup = normalizeFramePopup(merged || frame.popup);
    return {
      ...frame,
      textSpeed: resolveTextSpeed(frame.textSpeed ?? textNode?.textSpeed),
      sounds,
      soundFile: primary?.soundFile || null,
      soundMode: primary?.mode || null,
      soundNodeId: primary?.soundNodeId || null,
      popup,
    };
  }).filter((n): n is GEditorStoryNode => n != null);

  return { ...cfg, sequence: newSequence.length ? newSequence : cfg.sequence.filter((id) => keptIds.has(id)), nodes };
}
