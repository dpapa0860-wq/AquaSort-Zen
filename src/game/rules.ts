import type { ColorId, Tube } from './types';

export const TUBE_CAPACITY = 4;

export const INITIAL_FREE_UNDOS = 2;
export const AD_BONUS_UNDOS = 3;
export const BASE_LEVEL_COINS = 25;
export const DAILY_GIFT_COINS = 75;
export const DAILY_GIFT_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const INTERSTITIAL_INTERVAL = 3;

export function cloneTubes(tubes: Tube[]): Tube[] {
  return tubes.map((tube) => [...tube]);
}

export function isTubeComplete(tube: Tube): boolean {
  if (tube.length !== TUBE_CAPACITY) return false;
  const first = tube[0];
  for (let i = 1; i < tube.length; i++) {
    if (tube[i] !== first) return false;
  }
  return true;
}

export function isLevelWon(tubes: Tube[]): boolean {
  let hasNonEmpty = false;
  for (const tube of tubes) {
    if (tube.length === 0) continue;
    hasNonEmpty = true;
    if (!isTubeComplete(tube)) return false;
  }
  return hasNonEmpty;
}

export function getTopRun(tube: Tube): { color: ColorId; count: number } | null {
  if (tube.length === 0) return null;
  const topColor = tube[tube.length - 1];
  let count = 1;
  for (let i = tube.length - 2; i >= 0; i--) {
    if (tube[i] === topColor) {
      count++;
    } else {
      break;
    }
  }
  return { color: topColor, count };
}

export function canPour(fromTube: Tube, toTube: Tube): boolean {
  if (fromTube.length === 0) return false;
  if (isTubeComplete(fromTube)) return false;
  if (toTube.length >= TUBE_CAPACITY) return false;
  if (toTube.length === 0) return true;
  return fromTube[fromTube.length - 1] === toTube[toTube.length - 1];
}

export function executePour(
  tubes: Tube[],
  fromIdx: number,
  toIdx: number,
): {
  nextTubes: Tube[];
  movedCount: number;
  color: ColorId;
  completedTarget: boolean;
} | null {
  if (fromIdx === toIdx) return null;
  if (fromIdx < 0 || fromIdx >= tubes.length || toIdx < 0 || toIdx >= tubes.length) {
    return null;
  }
  const fromTube = tubes[fromIdx];
  const toTube = tubes[toIdx];
  if (!canPour(fromTube, toTube)) return null;

  const topRun = getTopRun(fromTube);
  if (!topRun) return null;

  const availableSpace = TUBE_CAPACITY - toTube.length;
  const movedCount = Math.min(topRun.count, availableSpace);
  if (movedCount <= 0) return null;

  const nextTubes = cloneTubes(tubes);
  for (let i = 0; i < movedCount; i++) {
    const popped = nextTubes[fromIdx].pop();
    if (popped) {
      nextTubes[toIdx].push(popped);
    }
  }

  return {
    nextTubes,
    movedCount,
    color: topRun.color,
    completedTarget: isTubeComplete(nextTubes[toIdx]),
  };
}

export function isUniformTube(tube: Tube): boolean {
  if (tube.length === 0) return false;
  return tube.every((c) => c === tube[0]);
}

export function hasAnyValidMoves(tubes: Tube[]): boolean {
  for (let i = 0; i < tubes.length; i++) {
    if (tubes[i].length === 0 || isTubeComplete(tubes[i])) continue;
    for (let j = 0; j < tubes.length; j++) {
      if (i === j) continue;
      if (!canPour(tubes[i], tubes[j])) continue;
      // Moving an already-uniform tube into a completely empty tube is a no-op
      if (tubes[j].length === 0 && isUniformTube(tubes[i])) continue;
      return true;
    }
  }
  return false;
}

export function findHintMove(tubes: Tube[]): { fromIdx: number; toIdx: number } | null {
  // Prioritize moves that complete a tube or merge non-empty matching tubes
  for (let i = 0; i < tubes.length; i++) {
    if (tubes[i].length === 0 || isTubeComplete(tubes[i])) continue;
    for (let j = 0; j < tubes.length; j++) {
      if (i === j || tubes[j].length === 0) continue;
      if (canPour(tubes[i], tubes[j])) {
        return { fromIdx: i, toIdx: j };
      }
    }
  }
  // Fallback: pour a non-uniform tube into an empty tube
  for (let i = 0; i < tubes.length; i++) {
    if (tubes[i].length === 0 || isTubeComplete(tubes[i]) || isUniformTube(tubes[i])) continue;
    for (let j = 0; j < tubes.length; j++) {
      if (i !== j && tubes[j].length === 0 && canPour(tubes[i], tubes[j])) {
        return { fromIdx: i, toIdx: j };
      }
    }
  }
  return null;
}
