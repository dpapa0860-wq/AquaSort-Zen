import { COLOR_ORDER } from './catalog';
import {
  TUBE_CAPACITY,
  canPour,
  executePour,
  isLevelWon,
  isTubeComplete,
  isUniformTube,
} from './rules';
import type { ColorId, Tube } from './types';

export interface LevelConfig {
  level: number;
  numColors: number;
  emptyTubes: number;
  tubes: Tube[];
}

/**
 * Mulberry32 deterministic PRNG so every level number yields
 * the exact same puzzle layout across sessions and devices.
 */
export function createSeededRng(seed: number): () => number {
  let state = (seed ^ 0x6d2b79f5) >>> 0;
  return () => {
    state = Math.imul(state ^ (state >>> 15), state | 1) >>> 0;
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

export function getLevelDifficultyParams(level: number): {
  numColors: number;
  emptyTubes: number;
} {
  const safeLevel = Math.max(1, Math.floor(level));
  let numColors = 3;
  if (safeLevel === 1) numColors = 3; // 3 colors / 5 tubes
  else if (safeLevel === 2) numColors = 4; // 4 colors / 6 tubes
  else if (safeLevel <= 4) numColors = 5; // 5 colors / 7 tubes
  else if (safeLevel <= 7) numColors = 6; // 6 colors / 8 tubes
  else if (safeLevel <= 11) numColors = 7; // 7 colors / 9 tubes
  else if (safeLevel <= 16) numColors = 8; // 8 colors / 10 tubes
  else if (safeLevel <= 22) numColors = 9; // 9 colors / 11 tubes
  else if (safeLevel <= 34) numColors = 10; // 10 colors / 12 tubes
  else if (safeLevel <= 49) numColors = 11; // 11 colors / 13 tubes
  else numColors = 12; // 12 colors / 14 tubes

  return {
    numColors,
    emptyTubes: 2,
  };
}

function canonicalKey(tubes: Tube[]): string {
  return tubes
    .map((t) => t.join(','))
    .sort()
    .join('|');
}

/**
 * Fast heuristic DFS solver that verifies a generated board is solvable.
 * Uses canonical tube ordering to collapse symmetric states and prioritizes
 * moves that consolidate matching colors or complete tubes.
 */
export function isBoardSolvable(
  initialTubes: Tube[],
  maxVisited = 4500,
): boolean {
  if (isLevelWon(initialTubes)) return true;

  const visited = new Set<string>();
  visited.add(canonicalKey(initialTubes));

  const stack: Tube[][] = [initialTubes.map((t) => [...t])];

  while (stack.length > 0 && visited.size < maxVisited) {
    const current = stack.pop()!;
    if (isLevelWon(current)) return true;

    const candidates: Array<{ score: number; next: Tube[] }> = [];

    for (let i = 0; i < current.length; i++) {
      const from = current[i];
      if (from.length === 0 || isTubeComplete(from)) continue;

      const fromUniform = isUniformTube(from);
      let usedEmptyTarget = false;

      for (let j = 0; j < current.length; j++) {
        if (i === j) continue;
        const to = current[j];

        // Symmetry pruning: only consider pouring into the first empty tube
        if (to.length === 0) {
          if (fromUniform) continue; // pointless move
          if (usedEmptyTarget) continue;
          usedEmptyTarget = true;
        }

        if (!canPour(from, to)) continue;

        const res = executePour(current, i, j);
        if (!res) continue;

        const key = canonicalKey(res.nextTubes);
        if (visited.has(key)) continue;

        // Score move: higher score explored first (pushed last to DFS stack)
        let score = 0;
        if (res.completedTarget) score += 100;
        if (to.length > 0) score += 35 + to.length * 10;
        if (fromUniform && to.length > 0) score += 50;
        if (res.nextTubes[i].length === 0) score += 20;
        score += res.movedCount * 5;

        candidates.push({ score, next: res.nextTubes });
      }
    }

    candidates.sort((a, b) => a.score - b.score);
    for (const candidate of candidates) {
      const key = canonicalKey(candidate.next);
      if (!visited.has(key)) {
        visited.add(key);
        stack.push(candidate.next);
      }
    }
  }

  return false;
}

function hasAcceptableMixing(tubes: Tube[], level: number): boolean {
  let singleColorTubes = 0;
  let mixedPairs = 0;

  for (const tube of tubes) {
    if (tube.length === 0) continue;
    if (isTubeComplete(tube)) return false; // Never spawn an already-solved tube
    if (isUniformTube(tube)) singleColorTubes++;
    for (let k = 1; k < tube.length; k++) {
      if (tube[k] !== tube[k - 1]) mixedPairs++;
    }
  }

  if (singleColorTubes > 0) return false;
  // Require higher mixing entropy as levels increase
  const minTransitions = level <= 2 ? tubes.length - 2 : Math.floor((tubes.length - 2) * 1.4);
  return mixedPairs >= minTransitions;
}

function buildCandidateBoard(
  level: number,
  numColors: number,
  emptyTubes: number,
  rng: () => number,
): Tube[] {
  // Deterministic color subset rotated per level so early levels stay visually fresh
  const offset = (level - 1) % COLOR_ORDER.length;
  const palette: ColorId[] = [];
  for (let i = 0; i < numColors; i++) {
    palette.push(COLOR_ORDER[(offset + i) % COLOR_ORDER.length]);
  }

  // Create flat pool of 4 segments per color
  const pool: ColorId[] = [];
  for (const color of palette) {
    for (let s = 0; s < TUBE_CAPACITY; s++) {
      pool.push(color);
    }
  }

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  const tubes: Tube[] = [];
  for (let t = 0; t < numColors; t++) {
    tubes.push(pool.slice(t * TUBE_CAPACITY, (t + 1) * TUBE_CAPACITY));
  }
  for (let e = 0; e < emptyTubes; e++) {
    tubes.push([]);
  }

  return tubes;
}

export function generateLevel(level: number): LevelConfig {
  const safeLevel = Math.max(1, Math.floor(level));
  const { numColors, emptyTubes } = getLevelDifficultyParams(safeLevel);

  // Try deterministic salts until a well-mixed, solver-verified board is found
  for (let attempt = 0; attempt < 120; attempt++) {
    const seed = safeLevel * 7919 + attempt * 104729;
    const rng = createSeededRng(seed);
    const candidate = buildCandidateBoard(safeLevel, numColors, emptyTubes, rng);

    if (!hasAcceptableMixing(candidate, safeLevel)) continue;
    if (isBoardSolvable(candidate)) {
      return {
        level: safeLevel,
        numColors,
        emptyTubes,
        tubes: candidate,
      };
    }
  }

  // Guaranteed fallback via deterministic cyclic striping (always solvable with 2 empty tubes)
  const fallbackPalette = COLOR_ORDER.slice(0, numColors);
  const fallbackTubes: Tube[] = Array.from({ length: numColors }, () => []);
  for (let layer = 0; layer < TUBE_CAPACITY; layer++) {
    for (let t = 0; t < numColors; t++) {
      fallbackTubes[t].push(fallbackPalette[(t + layer) % numColors]);
    }
  }
  for (let e = 0; e < emptyTubes; e++) {
    fallbackTubes.push([]);
  }

  return {
    level: safeLevel,
    numColors,
    emptyTubes,
    tubes: fallbackTubes,
  };
}
