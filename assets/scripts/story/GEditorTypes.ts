/** GEditor 导出格式 geditor-cocos（见 GEditor/app.js buildCocosExport） */

export type GEditorTransitionType = 'fade' | string;

export type GEditorTextPos = 'bottom' | 'top' | string;

export type GEditorEffectType = 'fade' | string;

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

export interface GEditorPopup {
  nodeId: string;
  textureFile: string | null;
  speaker: string;
  text: string;
  textPos: GEditorTextPos;
  audioFile: string | null;
  trigger: GEditorPopupTrigger | null;
  /** 可选黑底（与 exec popup 一致） */
  bgFile?: string | null;
  iconFile?: string | null;
}

export interface GEditorAutoSkip {
  effect: GEditorAutoSkipEffect;
  durationSec: number;
}

export interface GEditorDialogueLine {
  speaker: string;
  text: string;
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
  audioFile: string | null;
  inEffect: GEditorEffectType;
  outEffect: GEditorEffectType;
  holdSec: number;
  autoSkip: GEditorAutoSkip | null;
  popup: GEditorPopup | null;
  dialogueChain?: GEditorDialogueLine[] | null;
}

export interface GEditorGameNode extends GEditorNodeBase {
  kind: 'game';
  levelId?: number | string;
  gateFrame?: string | null;
  gateTip?: string;
  gateBtn?: string | null;
  gateBtnMarginX?: number;
  gateBtnMarginY?: number;
  gateBtnSize?: number;
}

/** exec 链上的 Popup（自动弹出，原 Subview） */
export interface GEditorPopupNode extends GEditorNodeBase {
  kind: 'popup';
  mode: 'auto';
  bgFile: string | null;
  iconFile: string | null;
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

/** exec popup / 旧 subview 节点的黑底与 icon 文件名 */
export function geditorPopupExecBg(node: GEditorPopupNode): string | null {
  const raw = node.bgFile;
  return raw ? String(raw) : null;
}

export function geditorPopupExecIcon(node: GEditorPopupNode): string | null {
  const raw = node.iconFile;
  return raw ? String(raw) : null;
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
): GEditorPopupNode {
  return {
    id: base.id,
    name: base.name,
    order: base.order,
    next: base.next,
    nextExplicit: base.nextExplicit,
    kind: 'popup',
    mode: 'auto',
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

/** 修补导出 JSON：popup/subview / gameGate 字段缺失时仍可播放 */
export function normalizeGEditorStoryConfig(cfg: GEditorStoryConfig): GEditorStoryConfig {
  const nodes = cfg.nodes.map((node) => {
    const rawKind = (node as { kind?: string }).kind;
    if (rawKind === 'subview') {
      const legacy = node as GEditorPopupNode & {
        subviewBg?: string | null;
        subviewIcon?: string | null;
      };
      return toPopupExecNode(
        legacy,
        legacy.bgFile || legacy.subviewBg || null,
        legacy.iconFile || legacy.subviewIcon || null,
      );
    }

    if (isGEditorPopupExecNode(node)) return node;

    if (isGEditorGameNode(node)) {
      const tipByName: Record<string, string> = {
        game_1_6: '需要找到钥匙才能进入',
        game_1_16: '需要灵牌',
        game_1_28: '需要符纸',
      };
      const tip = node.gateTip || tipByName[node.name] || '';
      return {
        ...node,
        gateFrame: node.gateFrame || '3.png',
        gateBtn: node.gateBtn || 'gametubiao.png',
        gateTip: tip,
        gateBtnMarginX: resolveGateBtnLayout(node).marginX,
        gateBtnMarginY: resolveGateBtnLayout(node).marginY,
        gateBtnSize: resolveGateBtnLayout(node).size,
      };
    }

    if (!isGEditorFrameNode(node)) return node;

    const frame = node as GEditorFrameNode & {
      subviewBg?: string | null;
      subviewIcon?: string | null;
      popupBg?: string | null;
      popupIcon?: string | null;
    };
    const bg = frame.popupBg || frame.subviewBg || null;
    const icon = frame.popupIcon || frame.subviewIcon || null;
    if (bg || icon) {
      return toPopupExecNode(frame, bg, icon);
    }

    const inferred = inferPopupExecFromLegacyFrameName(frame.name);
    if (inferred) {
      return toPopupExecNode(frame, inferred.bg, inferred.icon);
    }

    return node;
  });

  return { ...cfg, nodes };
}
