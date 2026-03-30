import type React from "react";

export type AuroraQualityTier = "low" | "medium" | "high";

export interface AuroraQualityProfile {
  tier: AuroraQualityTier;
  reducedMotion: boolean;
  auroraScale: number;
  starScale: number;
  starFrameIntervalMs: number;
  starDensityDivisor: number;
  starCapMin: number;
  starCapMax: number;
  brightCapMin: number;
  brightCapMax: number;
  brightCapDivisor: number;
  spriteSize: number;
  flareSpriteSize: number;
}

export interface AuroraCoronaBackgroundProps {
  className?: string;
  style?: React.CSSProperties;
  zIndex?: number;
  active?: boolean;
  quality?: AuroraQualityTier | "auto";
  reducedMotion?: boolean;
  scrollFollow?: boolean;
  scrollFollowFactor?: number;
  hideWhenScrolledOut?: boolean;
  dimScrim?: boolean;
}

export interface MilkyWayBackgroundProps {
  className?: string;
  style?: React.CSSProperties;
  zIndex?: number;
  active?: boolean;
  quality?: AuroraQualityTier | "auto";
  reducedMotion?: boolean;
  scrollFollow?: boolean;
  scrollFollowFactor?: number;
  hideWhenScrolledOut?: boolean;
  dimScrim?: boolean;
}
