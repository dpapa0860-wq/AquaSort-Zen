import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canPour,
  executePour,
  findHintMove,
  getTopRun,
  hasAnyValidMoves,
  isLevelWon,
  isTubeComplete,
} from './rules';
import {
  generateLevel,
  getLevelDifficultyParams,
  isBoardSolvable,
} from './generator';
import {
  canClaimDailyGift,
  formatCooldown,
  hasAdFreeVip,
  sanitizeProgress,
} from './storage';
import {
  ADMOB_CONFIG,
  triggerInterstitialAd,
  triggerRewardedAd,
} from './admob';
import type { Tube } from './types';

test('top run and pour validation rules work accurately', () => {
  const t1: Tube = ['coral', 'ocean', 'ocean'];
  const t2: Tube = ['amber', 'ocean'];
  const empty: Tube = [];
  const full: Tube = ['coral', 'coral', 'coral', 'coral'];

  assert.deepEqual(getTopRun(t1), { color: 'ocean', count: 2 });
  assert.equal(getTopRun(empty), null);

  assert.equal(canPour(t1, t2), true);
  assert.equal(canPour(t1, empty), true);
  assert.equal(canPour(t2, t1), true);
  assert.equal(canPour(full, empty), false); // Completed tubes are locked
  assert.equal(canPour(empty, t1), false);

  const res = executePour([t1, t2, empty], 0, 1);
  assert.ok(res);
  assert.equal(res.movedCount, 2);
  assert.equal(res.color, 'ocean');
  assert.deepEqual(res.nextTubes[0], ['coral']);
  assert.deepEqual(res.nextTubes[1], ['amber', 'ocean', 'ocean', 'ocean']);
  assert.equal(res.completedTarget, false);
});

test('completing a 4-segment matching tube locks it and detects win', () => {
  const tubes: Tube[] = [
    ['jade', 'jade', 'jade'],
    ['jade'],
    ['coral', 'coral', 'coral', 'coral'],
    [],
  ];
  assert.equal(isLevelWon(tubes), false);

  const res = executePour(tubes, 1, 0);
  assert.ok(res);
  assert.equal(res.completedTarget, true);
  assert.equal(isTubeComplete(res.nextTubes[0]), true);
  assert.equal(isLevelWon(res.nextTubes), true);
  assert.equal(canPour(res.nextTubes[0], res.nextTubes[3]), false);
});

test('deadlock detection distinguishes stuck boards from playable ones', () => {
  const stuck: Tube[] = [
    ['coral', 'ocean', 'amber', 'jade'],
    ['ocean', 'amber', 'jade', 'coral'],
    ['amber', 'jade', 'coral', 'ocean'],
    ['jade', 'coral', 'ocean', 'amber'],
  ];
  assert.equal(hasAnyValidMoves(stuck), false);
  assert.equal(findHintMove(stuck), null);

  const playable: Tube[] = [
    ['coral', 'ocean', 'amber', 'jade'],
    ['ocean', 'amber', 'jade', 'coral'],
    [],
  ];
  assert.equal(hasAnyValidMoves(playable), true);
  assert.ok(findHintMove(playable));
});

test('level difficulty scales from 3 colors / 5 tubes up to 10+ colors / 12+ tubes', () => {
  const l1 = getLevelDifficultyParams(1);
  assert.equal(l1.numColors, 3);
  assert.equal(l1.numColors + l1.emptyTubes, 5);

  const l25 = getLevelDifficultyParams(25);
  assert.equal(l25.numColors, 10);
  assert.equal(l25.numColors + l25.emptyTubes, 12);

  const l55 = getLevelDifficultyParams(55);
  assert.equal(l55.numColors, 12);
  assert.equal(l55.numColors + l55.emptyTubes, 14);
});

test('procedural generator is deterministic and produces solvable boards for levels 1..40', () => {
  for (let lvl = 1; lvl <= 40; lvl++) {
    const a = generateLevel(lvl);
    const b = generateLevel(lvl);
    assert.deepEqual(a, b, `Level ${lvl} must be deterministic`);
    assert.equal(a.tubes.length, a.numColors + a.emptyTubes);

    // Every color must appear exactly 4 times
    const counts = new Map<string, number>();
    for (const tube of a.tubes) {
      assert.equal(isTubeComplete(tube), false, `Level ${lvl} should not start with a solved tube`);
      for (const c of tube) {
        counts.set(c, (counts.get(c) ?? 0) + 1);
      }
    }
    assert.equal(counts.size, a.numColors);
    for (const [color, count] of counts) {
      assert.equal(count, 4, `Color ${color} on level ${lvl} must have 4 segments`);
    }

    assert.equal(isBoardSolvable(a.tubes, 12000), true, `Level ${lvl} must be solvable`);
  }
});

test('storage helpers sanitize saves, handle 24h daily gift cooldown, and check VIP', () => {
  const clean = sanitizeProgress({ level: -5, coins: 'bad', selectedTheme: 'unknown' });
  assert.equal(clean.level, 1);
  assert.equal(clean.coins, 50);
  assert.equal(clean.selectedTheme, 'sage');
  assert.equal(clean.selectedTubeStyle, 'classic');

  assert.equal(canClaimDailyGift(null, 1000000), true);
  assert.equal(canClaimDailyGift(1000000, 1000000 + 3600000), false);
  assert.equal(
    canClaimDailyGift(1000000, 1000000 + 24 * 60 * 60 * 1000),
    true,
  );
  assert.equal(formatCooldown(3661000), '01:01:01');

  assert.equal(hasAdFreeVip({ isVip: false, testVipMode: false }), false);
  assert.equal(hasAdFreeVip({ isVip: true, testVipMode: false }), true);
  assert.equal(hasAdFreeVip({ isVip: false, testVipMode: true }), true);
});

test('AdMob configuration uses the requested test interstitial ID and bridges cleanly', async () => {
  assert.equal(ADMOB_CONFIG.interstitialId, 'ca-app-pub-3940256099942544/1033173712');

  const webFallback = await triggerInterstitialAd(ADMOB_CONFIG.interstitialId, {});
  assert.equal(webFallback.handledNatively, false);

  let receivedInterstitialId = '';
  const nativeRes = await triggerInterstitialAd(ADMOB_CONFIG.interstitialId, {
    AndroidAdMob: {
      showInterstitial: (id: string) => {
        receivedInterstitialId = id;
        return true;
      },
    },
  });
  assert.equal(nativeRes.handledNatively, true);
  assert.equal(receivedInterstitialId, 'ca-app-pub-3940256099942544/1033173712');

  const rewardedRes = await triggerRewardedAd(ADMOB_CONFIG.rewardedId, {
    AndroidAdMob: {
      showRewarded: () => true,
    },
  });
  assert.deepEqual(rewardedRes, { handledNatively: true, rewarded: true });
});
