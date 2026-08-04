import { Color } from 'cc';
import { COLORS, SHAPE_DEFAULT } from './Constants';

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function shadeHex(hex: string, f: number): string {
  if (!hex || hex[0] !== '#') return hex || '#888';
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.min(255, Math.max(0, Math.round(r * f)));
  g = Math.min(255, Math.max(0, Math.round(g * f)));
  b = Math.min(255, Math.max(0, Math.round(b * f)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function colorFromHex(hex: string, a = 255): Color {
  if (!hex || hex[0] !== '#') return new Color(136, 136, 136, a);
  const n = parseInt(hex.slice(1), 16);
  return new Color((n >> 16) & 255, (n >> 8) & 255, n & 255, a);
}

export function resolveFootprint(shapeName: string, size?: { x: number; y: number }): [number, number] {
  if (SHAPE_DEFAULT[shapeName]) return SHAPE_DEFAULT[shapeName].slice() as [number, number];
  const sx = size?.x || 0, sy = size?.y || 0;
  if (sx > 0 && sy > 0) return [sx, sy];
  return [1, 1];
}

export function resolveAnimalSize(spriteName: string, size?: { x: number; y: number }): [number, number] {
  if (size && size.x > 0 && size.y > 0) return [size.x, size.y];
  const m = String(spriteName || '').match(/^(\d)(\d)/);
  if (m) return [parseInt(m[1], 10), parseInt(m[2], 10)];
  return [1, 1];
}

export function parseDirect(name?: string): { axis: 'x' | 'z' | null } {
  if (!name || name === 'None') return { axis: null };
  if (/Horiz/i.test(name)) return { axis: 'x' };
  if (/Vert/i.test(name)) return { axis: 'z' };
  return { axis: null };
}

export function materialColor(matName: string): Color {
  return colorFromHex(COLORS[matName] || COLORS.Blue);
}
