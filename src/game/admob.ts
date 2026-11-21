export interface AdMobConfig {
  appId: string;
  interstitialId: string;
  bannerId: string;
  rewardedId: string;
}

export interface AndroidAdMobInterface {
  showInterstitial?: (adUnitId: string) => boolean | Promise<boolean>;
  showRewarded?: (adUnitId: string) => boolean | Promise<boolean>;
  showBanner?: (adUnitId: string) => void;
  hideBanner?: () => void;
}

interface CapacitorAdMobPlugin {
  initialize?: (options?: Record<string, unknown>) => Promise<void>;
  prepareInterstitial?: (options: { adId: string; isTesting?: boolean }) => Promise<void>;
  showInterstitial?: () => Promise<void>;
  prepareRewardVideoAd?: (options: { adId: string; isTesting?: boolean }) => Promise<void>;
  showRewardVideoAd?: () => Promise<{ type?: string; amount?: number }>;
  showBanner?: (options: { adId: string; position?: string; isTesting?: boolean }) => Promise<void>;
  hideBanner?: () => Promise<void>;
}

declare global {
  interface Window {
    AndroidAdMob?: AndroidAdMobInterface;
    Capacitor?: {
      Plugins?: {
        AdMob?: CapacitorAdMobPlugin;
      };
    };
  }
}

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export const ADMOB_CONFIG: AdMobConfig = {
  appId: env.VITE_ADMOB_APP_ID || 'ca-app-pub-3940256099942544~3347511713',
  interstitialId:
    env.VITE_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-3940256099942544/1033173712',
  bannerId: env.VITE_ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111',
  rewardedId: env.VITE_ADMOB_REWARDED_ID || 'ca-app-pub-3940256099942544/5224354917',
};

let capacitorInitialized = false;

async function ensureCapacitorInit(plugin: CapacitorAdMobPlugin): Promise<void> {
  if (capacitorInitialized || !plugin.initialize) return;
  await plugin.initialize({
    initializeForTesting: true,
  });
  capacitorInitialized = true;
}

export function isNativeAdMobAvailable(win: Partial<Window> | undefined = typeof window !== 'undefined' ? window : undefined): boolean {
  if (!win) return false;
  return Boolean(win.AndroidAdMob || win.Capacitor?.Plugins?.AdMob);
}

/**
 * Triggers an AdMob Interstitial using the configured unit ID
 * (`ca-app-pub-3940256099942544/1033173712`).
 * Returns `{ handledNatively: true }` when running inside a Play Store Android WebView
 * or Capacitor shell; returns `{ handledNatively: false }` in web browser preview so the
 * in-app simulated interstitial modal is shown instead.
 */
export async function triggerInterstitialAd(
  adUnitId = ADMOB_CONFIG.interstitialId,
  win: Partial<Window> | undefined = typeof window !== 'undefined' ? window : undefined,
): Promise<{ handledNatively: boolean }> {
  if (!win) return { handledNatively: false };

  if (win.AndroidAdMob?.showInterstitial) {
    try {
      const shown = await win.AndroidAdMob.showInterstitial(adUnitId);
      if (shown !== false) return { handledNatively: true };
    } catch {
      return { handledNatively: false };
    }
  }

  const capAdMob = win.Capacitor?.Plugins?.AdMob;
  if (capAdMob?.prepareInterstitial && capAdMob?.showInterstitial) {
    try {
      await ensureCapacitorInit(capAdMob);
      await capAdMob.prepareInterstitial({ adId: adUnitId, isTesting: true });
      await capAdMob.showInterstitial();
      return { handledNatively: true };
    } catch {
      return { handledNatively: false };
    }
  }

  return { handledNatively: false };
}

/**
 * Triggers an AdMob Rewarded ad via native bridge if available,
 * otherwise falls back to the 3s simulated rewarded modal.
 */
export async function triggerRewardedAd(
  adUnitId = ADMOB_CONFIG.rewardedId,
  win: Partial<Window> | undefined = typeof window !== 'undefined' ? window : undefined,
): Promise<{ handledNatively: boolean; rewarded: boolean }> {
  if (!win) return { handledNatively: false, rewarded: false };

  if (win.AndroidAdMob?.showRewarded) {
    try {
      const rewarded = await win.AndroidAdMob.showRewarded(adUnitId);
      return { handledNatively: true, rewarded: Boolean(rewarded) };
    } catch {
      return { handledNatively: false, rewarded: false };
    }
  }

  const capAdMob = win.Capacitor?.Plugins?.AdMob;
  if (capAdMob?.prepareRewardVideoAd && capAdMob?.showRewardVideoAd) {
    try {
      await ensureCapacitorInit(capAdMob);
      await capAdMob.prepareRewardVideoAd({ adId: adUnitId, isTesting: true });
      const res = await capAdMob.showRewardVideoAd();
      return { handledNatively: true, rewarded: Boolean(res) };
    } catch {
      return { handledNatively: false, rewarded: false };
    }
  }

  return { handledNatively: false, rewarded: false };
}

/**
 * Syncs native banner visibility when running inside an Android wrapper.
 */
export async function syncNativeBanner(
  visible: boolean,
  adUnitId = ADMOB_CONFIG.bannerId,
  win: Partial<Window> | undefined = typeof window !== 'undefined' ? window : undefined,
): Promise<void> {
  if (!win) return;

  if (win.AndroidAdMob) {
    try {
      if (visible) win.AndroidAdMob.showBanner?.(adUnitId);
      else win.AndroidAdMob.hideBanner?.();
    } catch {
      // Ignore native bridge error cleanly
    }
    return;
  }

  const capAdMob = win.Capacitor?.Plugins?.AdMob;
  if (capAdMob) {
    try {
      await ensureCapacitorInit(capAdMob);
      if (visible) {
        await capAdMob.showBanner?.({
          adId: adUnitId,
          position: 'BOTTOM_CENTER',
          isTesting: true,
        });
      } else {
        await capAdMob.hideBanner?.();
      }
    } catch {
      // Ignore native bridge error cleanly
    }
  }
}
