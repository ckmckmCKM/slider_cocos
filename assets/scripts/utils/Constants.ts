export const COLORS: Record<string, string> = {
  Red: '#e53935', RedDark: '#b71c1c',
  Blue: '#1e88e5', BlueDark: '#0d47a1',
  Green: '#43a047', GreenDark: '#1b5e20', GreenLight: '#81c784', GreenLightDark: '#388e3c',
  Purple: '#8e24aa', PurpleDark: '#4a148c',
  Orange: '#fb8c00', OrangeDark: '#e65100',
  Pink: '#ec407a', PinkDark: '#880e4f',
  yellow: '#fdd835', Yellow: '#fdd835', YellowDark: '#f57f17',
  Turquoise: '#26c6da', TurquoiseDark: '#00838f', TurquoiseLight: '#4dd0e1', TurquoiseLightDark: '#00838f',
  Brown: '#8d6e63', BrownDark: '#4e342e',
  Gray: '#9e9e9e', GrayDark: '#424242',
  Border: '#8a4a2a', BorderDark: '#5d2e14',
  Wood: '#a67c52', WoodDark: '#6d4c2e', Wood2: '#8d6e4a', Wood2Dark: '#5d4630',
  Stone: '#78909c', StoneDark: '#455a64', Stone2: '#90a4ae', Stone2Dark: '#546e7a',
  pink2: '#f06292', pink2Dark: '#ad1457',
  'Orange 1': '#ff9800', 'Orange 1Dark': '#e65100',
  BlueLight: '#64b5f6', BlueLightDark: '#1565c0',
};

export const SHAPE_DEFAULT: Record<string, [number, number]> = {
  Single: [1, 1], DoubleHoriz: [2, 1], DoubleVert: [1, 2],
  TripleHoriz: [3, 1], TripleVert: [1, 3], Square: [2, 2],
  'Inner Obstacle': [1, 1],
  CornerLB: [2, 2], CornerLT: [2, 2], CornerRB: [2, 2], CornerRT: [2, 2],
  LTypeLB1: [2, 3], LTypeLT1: [2, 3], LTypeRB1: [2, 3], LTypeRT1: [2, 3],
  LTypeLB2: [3, 2], LTypeLT2: [3, 2], LTypeRB2: [3, 2], LTypeRT2: [3, 2],
  TTypeT: [3, 2], TTypeB: [3, 2], TTypeL: [2, 3], TTypeR: [2, 3],
  CTypeL: [2, 3], CTypeT: [3, 2], CTypeB: [3, 2],
  Cross: [3, 3], ZTypeHorizT: [3, 2], ZTypeVertL: [2, 3], ZTypeVertR: [2, 3],
};

export const AUDIO_MAP: Record<string, string> = {
  click: 'audio/anniu',
  match: 'audio/jinbi',
  win: 'audio/Victory',
  lose: 'audio/shibai',
  hammer: 'audio/chuizi',
  magnet: 'audio/citie',
  time: 'audio/nandujiesuo',
  move1: 'audio/yidonghuakuai1',
  move2: 'audio/yidonghuakuai2',
  move3: 'audio/yidonghuakuai3',
  moveWood: 'audio/yidongmukuai',
  moveStone: 'audio/yidongshikuai',
  ice: 'audio/jisuibingkuai',
  warn: 'audio/shijiandaole',
  bgm: 'audio/Bgm',
};

/** 格子视觉尺寸（宽/高） */
export const CELL_SIZE = 150;
/** 格子间隙 */
export const CELL_GAP = 5;
/** 格子中心距 = 尺寸 + 间隙（布局/坐标用） */
export const CELL = CELL_SIZE + CELL_GAP;
export const DESIGN_W = 1080;
export const DESIGN_H = 1920;
/** @deprecated 棋盘已按 CELL_SIZE/CELL_GAP 固定计算，不再缩放 */
export const BOARD_MAX_W = 980;
export const BOARD_MAX_H = 1120;
export const EPS = 0.02;
export const PROGRESS_KEY = 'block_reveal_max';
export const MAX_LEVEL = 650;
/** 已接入的剧情 bundle 名（按播放顺序）；新增 storyN 时在此追加 */
export const STORY_ORDER = ['story1', 'story2'];
