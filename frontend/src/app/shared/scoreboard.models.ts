export interface Shortcut {
  key: string;
  score: number;
}

export interface Throw {
  score: number;
  at: Date;
  player: number;
}

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  { key: '1', score: 1 },
  { key: '2', score: 2 },
  { key: '3', score: 3 },
  { key: '4', score: 4 },
  { key: '5', score: 5 },
  { key: '6', score: 6 },
  { key: '7', score: 7 },
  { key: '8', score: 8 },
  { key: '9', score: 9 },
  { key: '0', score: 0 },
];
