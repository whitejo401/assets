"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useAdaptiveQuality } from "./useAdaptiveQuality";
import type { MilkyWayBackgroundProps } from "./types";

type MilkyStar = {
  x: number;
  y: number;
  z: number;
  vz: number;
  r: number;
  a: number;
  w: number;
  warm: boolean;
  bright: boolean;
  p: number;
  s: number;
};

type MilkyNebula = {
  x: number;
  y: number;
  z: number;
  rx: number;
  a: number;
  colorType: number;
  p: number;
  s: number;
};

function mulberry32(a: number) {
  return function random() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeColorStarSprite(size: number, inner: string, mid: string, outer: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const cx = c.getContext("2d");
  if (!cx) return c;
  const m = size * 0.5;
  const g = cx.createRadialGradient(m, m, 0, m, m, m);
  g.addColorStop(0, inner);
  g.addColorStop(0.35, mid);
  g.addColorStop(1, outer);
  cx.fillStyle = g;
  cx.beginPath();
  cx.arc(m, m, m, 0, Math.PI * 2);
  cx.fill();
  return c;
}

function makeNebulaSprite(size: number, c0: string, c1: string, c2: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const cx = c.getContext("2d");
  if (!cx) return c;
  const m = size * 0.5;
  const g = cx.createRadialGradient(m, m, size * 0.06, m, m, m);
  g.addColorStop(0, c0);
  g.addColorStop(0.5, c1);
  g.addColorStop(1, c2);
  cx.fillStyle = g;
  cx.fillRect(0, 0, size, size);
  return c;
}

export function MilkyWayBackground({
  className,
  style,
  zIndex = 1,
  active = true,
  quality = "auto",
  reducedMotion: reducedMotionOverride,
  scrollFollow = false,
  scrollFollowFactor = 1,
  hideWhenScrolledOut = false,
  dimScrim = false,
}: MilkyWayBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const reducedByMedia =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const reducedMotion = reducedMotionOverride ?? reducedByMedia;
  const profile = useAdaptiveQuality(quality, reducedMotion);

  const layerBaseStyle = useMemo<React.CSSProperties>(
    () => ({
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
    }),
    []
  );

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let dpr = 1;
    let W = 0;
    let H = 0;
    let stars: MilkyStar[] = [];
    let nebulae: MilkyNebula[] = [];
    let starCool: HTMLCanvasElement | null = null;
    let starWarm: HTMLCanvasElement | null = null;
    let starBrightCool: HTMLCanvasElement | null = null;
    let starBrightWarm: HTMLCanvasElement | null = null;
    let nebulaSprites: HTMLCanvasElement[] = [];
    let bgGradient: CanvasGradient | null = null;
    let dustGradient: CanvasGradient | null = null;
    let pxScale = 1;
    let lastDrawAt = -1;
    let lastSimTs = -1;
    let layerOffsetY = 0;
    let hiddenByScroll = false;
    let pageVisible = !document.hidden;
    let lastScrollInputAt = 0;
    let rafId = 0;
    let resizeRaf = 0;
    let respawnRnd = mulberry32(0x13579bdf);

    const initSprites = () => {
      const starSize = Math.max(18, Math.floor(profile.spriteSize * 0.22));
      const brightSize = Math.max(24, Math.floor(profile.flareSpriteSize * 0.24));
      const nebulaSize = Math.max(180, Math.floor(profile.flareSpriteSize * 1.6));
      starCool = makeColorStarSprite(
        starSize,
        "rgba(255,255,255,0.95)",
        "rgba(196,226,255,0.62)",
        "rgba(170,210,255,0)"
      );
      starWarm = makeColorStarSprite(
        starSize,
        "rgba(255,247,232,0.95)",
        "rgba(255,218,170,0.62)",
        "rgba(255,182,120,0)"
      );
      starBrightCool = makeColorStarSprite(
        brightSize,
        "rgba(255,255,255,0.98)",
        "rgba(208,235,255,0.8)",
        "rgba(170,210,255,0)"
      );
      starBrightWarm = makeColorStarSprite(
        brightSize,
        "rgba(255,252,240,0.98)",
        "rgba(255,225,178,0.8)",
        "rgba(255,182,120,0)"
      );
      nebulaSprites = [
        makeNebulaSprite(nebulaSize, "rgba(255,152,206,0.92)", "rgba(208,124,255,0.56)", "rgba(66,28,122,0)"),
        makeNebulaSprite(nebulaSize, "rgba(177,196,255,0.9)", "rgba(84,130,250,0.56)", "rgba(18,38,104,0)"),
        makeNebulaSprite(nebulaSize, "rgba(255,220,150,0.82)", "rgba(255,171,92,0.5)", "rgba(96,44,14,0)"),
        makeNebulaSprite(nebulaSize, "rgba(216,165,255,0.88)", "rgba(148,92,238,0.52)", "rgba(44,24,96,0)"),
      ];
    };

    const respawnStar = (st: MilkyStar, rnd: () => number) => {
      const xw = (rnd() - 0.5) * 2.5;
      const centerY = 0.18 * xw + 0.02 * Math.sin(xw * 4);
      const inBand = rnd() < 0.86;
      const spread = inBand ? 0.1 + 0.34 * Math.pow(rnd(), 1.7) : 0.55 + 0.55 * rnd();
      const yw = centerY + (rnd() - 0.5) * spread;
      const dist = Math.abs(yw - centerY) / 0.55;
      const bandWeight = Math.max(0, 1 - dist);
      st.x = xw;
      st.y = yw;
      st.z = 1.0;
      st.w = bandWeight;
      st.warm = rnd() < 0.28;
      st.vz = 0.055 + rnd() * 0.13;
      st.r = 0.35 + rnd() * (0.85 + bandWeight * 1.35);
      st.a = (0.05 + rnd() * 0.38) * (0.65 + bandWeight * 1.25);
      st.bright = rnd() < 0.18 + bandWeight * 0.22;
      st.p = rnd() * Math.PI * 2;
      st.s = 0.002 + rnd() * 0.006;
    };

    const initMilky = () => {
      const rnd = mulberry32(0x85ebca6b ^ (W | 0) ^ (H << 16));
      respawnRnd = mulberry32((W | 0) ^ (H << 12) ^ 0xa5a5a5a5);
      stars = [];
      nebulae = [];
      const capBase = profile.tier === "high" ? 1400 : profile.tier === "low" ? 760 : 1050;
      const count = Math.min(capBase, Math.max(520, Math.floor((W * H) / 5200)));
      for (let i = 0; i < count; i += 1) {
        const xw = (rnd() - 0.5) * 2.4;
        const centerY = 0.18 * xw + 0.02 * Math.sin(xw * 4);
        const inBand = rnd() < 0.84;
        const spread = inBand ? 0.12 + 0.36 * Math.pow(rnd(), 1.7) : 0.55 + 0.5 * rnd();
        const yw = centerY + (rnd() - 0.5) * spread;
        const dist = Math.abs(yw - centerY) / 0.55;
        const bandWeight = Math.max(0, 1 - dist);
        stars.push({
          x: xw,
          y: yw,
          z: 0.14 + rnd() * 0.86,
          vz: 0.055 + rnd() * 0.13,
          r: 0.35 + rnd() * (0.85 + bandWeight * 1.35),
          a: (0.05 + rnd() * 0.38) * (0.65 + bandWeight * 1.25),
          w: bandWeight,
          warm: rnd() < 0.28,
          bright: rnd() < 0.18 + bandWeight * 0.22,
          p: rnd() * Math.PI * 2,
          s: 0.002 + rnd() * 0.006,
        });
      }
      const nCount = Math.min(profile.tier === "low" ? 8 : 12, Math.max(6, Math.floor(W / 260)));
      for (let i = 0; i < nCount; i += 1) {
        const nxw = (rnd() - 0.5) * 1.9;
        const nyw = 0.16 * nxw + (rnd() - 0.5) * 0.34;
        nebulae.push({
          x: nxw,
          y: nyw,
          z: 0.82 + rnd() * 0.16,
          rx: 0.2 + rnd() * 0.35,
          a: 0.12 + rnd() * 0.22,
          colorType: Math.floor(rnd() * 4),
          p: rnd() * Math.PI * 2,
          s: 0.0005 + rnd() * 0.0016,
        });
      }
    };

    const clear = () => {
      ctx.setTransform(pxScale, 0, 0, pxScale, 0, 0);
      ctx.clearRect(0, 0, W, H);
    };

    const drawMilky = (t: number) => {
      const dtMs = lastSimTs < 0 ? 16.67 : Math.max(8, Math.min(40, t - lastSimTs));
      lastSimTs = t;
      const dt = dtMs / 1000;
      const flowPhase = reducedMotion ? 0 : t * 0.00075;
      const flowX = reducedMotion ? 0 : Math.sin(flowPhase) * W * 0.01;
      const flowY = reducedMotion ? 0 : Math.cos(flowPhase * 0.7 + 0.8) * H * 0.007;
      const cx = W * 0.5;
      const cy = H * 0.5;
      const focal = Math.min(W, H) * 0.72;

      ctx.setTransform(pxScale, 0, 0, pxScale, 0, 0);
      ctx.clearRect(0, 0, W, H);

      ctx.globalCompositeOperation = "source-over";
      if (!bgGradient) {
        bgGradient = ctx.createLinearGradient(0, 0, 0, H);
        bgGradient.addColorStop(0, "rgba(5,8,18,0.2)");
        bgGradient.addColorStop(0.42, "rgba(8,10,24,0.4)");
        bgGradient.addColorStop(1, "rgba(2,4,11,0.82)");
      }
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = "screen";
      for (const nb of nebulae) {
        const pulse = reducedMotion ? 1 : 0.74 + 0.32 * Math.sin(t * nb.s + nb.p);
        const scale = focal / Math.max(0.55, nb.z);
        const nx = cx + nb.x * scale + flowX * 0.45;
        const ny = cy + nb.y * scale + flowY * 0.35;
        const sprite = nebulaSprites[nb.colorType & 3];
        if (!sprite) continue;
        const nr = Math.max(20, Math.min(W * 0.48, nb.rx * scale));
        const ns = (nr * 2) / sprite.width;
        ctx.save();
        ctx.translate(nx, ny);
        ctx.rotate(0.22 + 0.14 * Math.sin(t * 0.00018 + nb.p));
        ctx.scale(1, 0.58);
        ctx.globalAlpha = Math.min(0.95, nb.a * pulse);
        ctx.drawImage(sprite, -sprite.width * 0.5 * ns, -sprite.height * 0.5 * ns, sprite.width * ns, sprite.height * ns);
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      ctx.globalCompositeOperation = "multiply";
      ctx.save();
      ctx.translate(W * 0.5 + flowX * 0.5, H * 0.48 + flowY * 0.4);
      ctx.rotate(0.19);
      if (!dustGradient) {
        dustGradient = ctx.createLinearGradient(0, -H * 0.34, 0, H * 0.34);
        dustGradient.addColorStop(0, "rgba(10,8,14,0)");
        dustGradient.addColorStop(0.48, "rgba(8,7,12,0.32)");
        dustGradient.addColorStop(0.52, "rgba(8,7,12,0.36)");
        dustGradient.addColorStop(1, "rgba(10,8,14,0)");
      }
      ctx.fillStyle = dustGradient;
      ctx.fillRect(-W, -H * 0.34, W * 2, H * 0.68);
      ctx.restore();

      ctx.globalCompositeOperation = "screen";
      for (const st of stars) {
        if (!reducedMotion) {
          st.z -= st.vz * dt * (0.28 + st.w * 0.36);
          if (st.z <= 0.055) respawnStar(st, respawnRnd);
        }
        const tw = st.a * (reducedMotion ? 1.05 : 0.92 + 0.38 * Math.sin(t * st.s + st.p));
        const invz = 1 / Math.max(0.06, st.z);
        const sx = cx + st.x * focal * invz + flowX;
        const sy = cy + st.y * focal * invz + flowY;
        if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) {
          if (!reducedMotion) respawnStar(st, respawnRnd);
          continue;
        }
        const radius = Math.max(0.25, st.r * (0.28 + invz * 0.095)) * (st.bright ? 1.18 : 1);
        const size = radius * (st.bright ? 3.4 : 2.7);
        const sprite = st.bright
          ? st.warm
            ? starBrightWarm
            : starBrightCool
          : st.warm
            ? starWarm
            : starCool;
        if (!sprite) continue;
        ctx.globalAlpha = Math.min(0.98, tw * (st.bright ? 1.12 : 1));
        ctx.drawImage(sprite, sx - size, sy - size, size * 2, size * 2);
        ctx.globalAlpha = 1;
      }

      ctx.globalCompositeOperation = "source-over";
    };

    const onResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      pxScale = dpr * profile.starScale;
      canvas.width = Math.max(1, Math.floor(W * pxScale));
      canvas.height = Math.max(1, Math.floor(H * pxScale));
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      bgGradient = null;
      dustGradient = null;
      initSprites();
      initMilky();
      lastDrawAt = -1;
      lastSimTs = -1;
    };

    const onScroll = () => {
      lastScrollInputAt = performance.now();
      if (!scrollFollow) return;
      const y = window.scrollY || window.pageYOffset || 0;
      layerOffsetY = -y * scrollFollowFactor;
      root.style.transform = `translate3d(0, ${layerOffsetY.toFixed(2)}px, 0)`;
      if (hideWhenScrolledOut) {
        hiddenByScroll = y >= H;
        if (hiddenByScroll) {
          clear();
        }
      }
      ensureTicking();
    };

    const frame = (t: number) => {
      if (!active) return;
      if (hiddenByScroll) return;
      const inputRecent = t - lastScrollInputAt < 140;
      const baseInterval =
        profile.tier === "high" ? 16 : profile.tier === "medium" ? 20 : 24;
      const interval = reducedMotion ? 160 : inputRecent ? 16 : baseInterval;
      if (lastDrawAt < 0 || t - lastDrawAt >= interval) {
        drawMilky(t);
        lastDrawAt = t;
      }
    };

    const tick = (t: number) => {
      rafId = 0;
      if (!pageVisible) return;
      frame(t);
      ensureTicking();
    };

    const shouldAnimate = () => active && !reducedMotion && pageVisible && !hiddenByScroll;

    const ensureTicking = () => {
      if (shouldAnimate()) {
        if (!rafId) rafId = requestAnimationFrame(tick);
      } else if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    onResize();
    onScroll();
    if (active) frame(0);
    else clear();
    ensureTicking();

    const scheduleResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        onResize();
        onScroll();
        if (active) frame(performance.now());
      });
    };

    const onVisibilityChange = () => {
      pageVisible = !document.hidden;
      if (!pageVisible) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        return;
      }
      if (active) frame(performance.now());
      ensureTicking();
    };

    window.addEventListener("resize", scheduleResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      window.removeEventListener("resize", scheduleResize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [active, profile, reducedMotion, scrollFollow, scrollFollowFactor, hideWhenScrolledOut]);

  return (
    <div
      ref={rootRef}
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        pointerEvents: "none",
        isolation: "isolate",
        ...style,
      }}
      aria-hidden
    >
      <canvas ref={canvasRef} style={{ ...layerBaseStyle, zIndex: 1 }} />
      {dimScrim && (
        <div
          style={{
            ...layerBaseStyle,
            zIndex: 2,
            background:
              "linear-gradient(180deg, rgba(7,8,18,0.18) 0%, rgba(8,10,22,0.08) 36%, rgba(6,8,18,0.14) 70%, rgba(4,5,12,0.34) 100%)",
          }}
        />
      )}
      <div
        style={{
          ...layerBaseStyle,
          zIndex: 3,
          opacity: 0.03,
          mixBlendMode: "overlay",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
