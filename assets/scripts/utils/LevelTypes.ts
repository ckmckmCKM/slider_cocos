export interface Vec3Like { x: number; y?: number; z: number; }
export interface Vec2Like { x: number; y: number; }

export interface BlockInstance {
  spriteName?: string;
  materialName?: string;
  position: Vec3Like;
  size?: Vec2Like;
  offset?: Vec2Like;
  groupId?: number;
  directName?: string;
  directPos?: Vec3Like;
  IceTime?: number;
  icePos?: Vec3Like;
  key?: number;
  chain?: number;
}

export interface BlockGroup {
  name: string;
  blockInstances: BlockInstance[];
}

export interface BorderData {
  name: string;
  positions: Vec3Like[];
}

export interface LevelData {
  levelIndex: number;
  time: number;
  camera?: {
    position: Vec3Like;
    rotation?: Vec3Like;
    size?: number;
  };
  borders?: BorderData[];
  blocks?: BlockGroup[];
}

export type LevelsMap = Record<string, LevelData>;
