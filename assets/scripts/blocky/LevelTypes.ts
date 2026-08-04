import {
  ArrowDirection, Difficulty, GameColor, MechanicType, ShapeType, ShapeWoodenBox, TypeEnvironment,
} from './Enums';

export interface Vec2I { x: number; y: number; }

export interface PictureData {
  id: number;
  width: number;
  height: number;
  nameFilePicture: string;
  color: GameColor;
  isPencil: boolean;
  isFlipX: boolean;
  isFlipY: boolean;
}

export interface ShapePictureData {
  id: number;
  rotation: number;
  posRelative: Vec2I[];
  listPos: Vec2I[];
  listIndexPicture: number[];
  shapeType: ShapeType;
  idPanelPicture: number;
  color: GameColor;
  mechanic: MechanicType | number;
  arrowDirection: ArrowDirection;
  isObstacle: boolean;
  numberIce: number;
  numberLock: number;
  listPosKey: Vec2I[];
  idCombineds: number[];
  idLayered: number;
  timeBomb: number;
  colorBlock: GameColor;
  numberMystery: number;
}

export interface PortalData {
  rot: number;
  size: number;
  pos: Vec2I;
  dir: Vec2I;
  color: GameColor;
}

export interface WoodenBoxData {
  numberBox: number;
  pos: Vec2I;
  shapeWoodenBox: ShapeWoodenBox;
  canMoveVertical: boolean;
  canMoveHorizontal: boolean;
}

export interface GrinderData {
  pos: Vec2I;
  up: number;
  down: number;
  left: number;
  right: number;
}

export interface TunnelData {
  pos: Vec2I;
  rot: number;
  dir: Vec2I;
  listIdBlock: number[];
}

export interface ColorPathData {
  pos: Vec2I;
  color: GameColor;
}

export interface RollerDoorData {
  number: number;
  pos: Vec2I;
  size: Vec2I;
}

export interface WallIceData {
  pos: Vec2I;
  num: number;
}

export interface RotatorData {
  pos: Vec2I;
  up: number;
  down: number;
  left: number;
  right: number;
}

export interface LevelConfig {
  id: number;
  levelId: string;
  difficulty: Difficulty;
  timeLimit: number;
  /** board[row][col] — TypeEnvironment */
  board: TypeEnvironment[][];
  listPictureData: PictureData[];
  listShapePictureData: ShapePictureData[];
  listPortalData: PortalData[];
  listWoodenBoxData: WoodenBoxData[];
  listGrinderData: GrinderData[];
  listTunnelData: TunnelData[];
  listColorPathData: ColorPathData[];
  listRollerDoorData: RollerDoorData[];
  listWallIceData: WallIceData[];
  listRotatorData: RotatorData[];
}
