/** Unity HalaGames.Blocky enums — 与原版数值保持一致 */

export enum Difficulty {
  Easy = 0,
  Medium = 1,
  Hard = 2,
  SuperHard = 3,
}

export enum GameColor {
  None = 0,
  Red = 1,
  Orange = 2,
  Green = 4,
  DarkGreen = 8,
  Pink = 16,
  Purple = 32,
  Chocolate = 64,
  White = 128,
  Teal = 256,
  Violet = 512,
  Yellow = 1024,
  Blue = 2048,
  Turquoise = 4096,
}

export enum ArrowDirection {
  None = 0,
  Vertical = 1,
  Horizontal = 2,
}

export enum MechanicType {
  None = 1,
  Arrow = 2,
  Wooden = 4,
  Stone = 8,
  Ice = 16,
  Pinned = 32,
  Lock = 64,
  Key = 128,
  Combined = 256,
  Layered = 512,
  Bomb = 1024,
  ColorBlock = 2048,
  Mystery = 4096,
}

export enum ShapeWoodenBox {
  Wooden_4x4 = 0,
  Wooden_4x3 = 1,
  Wooden_3x4 = 2,
  Wooden_3x3 = 3,
  Wooden_3x2 = 4,
  Wooden_2x3 = 5,
}

export enum ShapeType {
  block_1 = 0,
  block_2 = 1,
  block_3 = 2,
  block_2x3 = 3,
  block_L = 4,
  block_L2_N = 5,
  block_L2 = 6,
  block_plus = 7,
  block_T = 8,
  block_Z = 9,
  block_ZN = 10,
  block_square = 11,
  block_square3x3 = 12,
  block_U = 13,
  block_4 = 14,
  block_U2 = 15,
}

/** 0=不可玩, 1=可玩格 */
export enum TypeEnvironment {
  Block = 0,
  Ground = 1,
}

export const GAME_COLOR_HEX: Record<number, string> = {
  [GameColor.Red]: '#e53935',
  [GameColor.Orange]: '#fb8c00',
  [GameColor.Green]: '#43a047',
  [GameColor.DarkGreen]: '#2e7d32',
  [GameColor.Pink]: '#ec407a',
  [GameColor.Purple]: '#8e24aa',
  [GameColor.Chocolate]: '#6d4c41',
  [GameColor.White]: '#eceff1',
  [GameColor.Teal]: '#00897b',
  [GameColor.Violet]: '#7e57c2',
  [GameColor.Yellow]: '#fdd835',
  [GameColor.Blue]: '#1e88e5',
  [GameColor.Turquoise]: '#26c6da',
};

export function colorHex(c: number): string {
  if (!c) return '#1e88e5';
  for (const bit of Object.keys(GAME_COLOR_HEX).map(Number)) {
    if (bit && (c & bit) === bit) return GAME_COLOR_HEX[bit];
  }
  return '#1e88e5';
}

export function hasMechanic(flags: number, m: MechanicType): boolean {
  return (flags & m) === m;
}
