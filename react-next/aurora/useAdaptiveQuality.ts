import { useMemo } from "react";
import type { AuroraQualityProfile, AuroraQualityTier } from "./types";

function getQualityPreset(tier: AuroraQualityTier, reducedMotion: boolean): AuroraQualityProfile {
  const safeTier: AuroraQualityTier = reducedMotion ? "low" : tier;
  if (safeTier === "high") {
    return {
      tier: "high",
      reducedMotion,
      auroraScale: 0.62,
      starScale: 0.95,
      starFrameIntervalMs: 16,
      starDensityDivisor: 7600,
      starCapMin: 90,
      starCapMax: 360,
      brightCapMin: 5,
      brightCapMax: 12,
      brightCapDivisor: 52,
      spriteSize: 108,
      flareSpriteSize: 150,
    };
  }
  if (safeTier === "low") {
    return {
      tier: "low",
      reducedMotion,
      auroraScale: 0.38,
      starScale: 0.55,
      starFrameIntervalMs: 50,
      starDensityDivisor: 16000,
      starCapMin: 48,
      starCapMax: 140,
      brightCapMin: 3,
      brightCapMax: 5,
      brightCapDivisor: 70,
      spriteSize: 64,
      flareSpriteSize: 92,
    };
  }
  return {
    tier: "medium",
    reducedMotion,
    auroraScale: 0.46,
    starScale: 0.7,
    starFrameIntervalMs: 33,
    starDensityDivisor: 11000,
    starCapMin: 64,
    starCapMax: 220,
    brightCapMin: 4,
    brightCapMax: 8,
    brightCapDivisor: 56,
    spriteSize: 88,
    flareSpriteSize: 124,
  };
}

function detectAutoTier(): AuroraQualityTier {
  if (typeof window === "undefined") return "medium";
  const n = navigator as Navigator & { deviceMemory?: number };
  const hc = navigator.hardwareConcurrency || 4;
  const dm = n.deviceMemory || 4;
  const dpr = window.devicePixelRatio || 1;
  let score = 0;
  if (hc >= 12) score += 3;
  else if (hc >= 8) score += 2;
  else if (hc >= 4) score += 1;
  if (dm >= 8) score += 2;
  else if (dm >= 4) score += 1;
  if (dpr <= 1.5) score += 1;
  if (score >= 5) return "high";
  if (score <= 1) return "low";
  return "medium";
}

export function useAdaptiveQuality(
  quality: AuroraQualityTier | "auto" | undefined,
  reducedMotion: boolean
): AuroraQualityProfile {
  return useMemo(() => {
    const tier = quality && quality !== "auto" ? quality : detectAutoTier();
    return getQualityPreset(tier, reducedMotion);
  }, [quality, reducedMotion]);
}
