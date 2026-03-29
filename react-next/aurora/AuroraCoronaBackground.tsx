"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useAdaptiveQuality } from "./useAdaptiveQuality";
import type { AuroraCoronaBackgroundProps } from "./types";

type Star = {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  base: number;
  amp: number;
  slow: number;
};

type BrightStar = {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  base: number;
  amp: number;
  flareSpeed: number;
  flareSharp: number;
};

const VS_SRC = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 1.0 - (a_pos.y * 0.5 + 0.5));
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FS_SRC = `#version 300 es
precision highp float;
uniform float u_time;
uniform float u_rm;
in vec2 v_uv;
out vec4 fragColor;
const float PI = 3.14159265359;
const float TAU = 6.28318530718;
float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.52;
  mat2 m = mat2(1.62, 1.21, -1.21, 1.62);
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = m * p * 2.02 + vec2(17.0, 9.0);
    a *= 0.5;
  }
  return v;
}
vec3 auroraFieldCorona(vec2 uv, float t, float breath) {
  float x = uv.x;
  float y = uv.y;
  float tm = t * 14.0;
  float ts = t * 0.48;
  vec2 zen = vec2(0.5 + 0.05 * sin(ts * 0.31), 0.73 + 0.035 * sin(ts * 0.24 + 1.3));
  vec2 p = uv - zen;
  vec2 flow = vec2(
    fbm(p * 2.0 + vec2(tm * 0.17, -tm * 0.11)) - 0.5,
    fbm(p * 2.0 + vec2(7.3 - tm * 0.13, 3.9 + tm * 0.09)) - 0.5
  );
  p += flow * 0.2;
  float r = length(p);
  float theta = atan(p.y + 0.0001, p.x);
  float curtain = 0.0;
  float edgeBand = 0.0;
  for (int i = 0; i < 6; i++) {
    float id = float(i);
    float seed = 7.1 + id * 11.37;
    float base = -PI + TAU * hash(vec2(seed, 0.37));
    float driftA = sin(ts * (0.26 + 0.06 * id) + seed);
    float driftB = (fbm(vec2(ts * 0.14 + seed, 2.0 + id)) - 0.5) * 1.2;
    float a = base + 0.9 * driftA + 0.6 * driftB;
    float dist = abs(atan(sin(theta - a), cos(theta - a)));
    float w = 0.18 + 0.1 * fbm(vec2(seed, ts * 0.17 + r * 0.6));
    float lobe = 1.0 - smoothstep(w, w * 1.95, dist);
    float r0 = 0.08 + 0.03 * id + 0.03 * fbm(vec2(seed * 0.7, ts * 0.12));
    float r1 = 0.6 + 0.12 * sin(ts * (0.21 + 0.04 * id) + seed);
    float radial = smoothstep(r0, r0 + 0.09, r) * (1.0 - smoothstep(r1, r1 + 0.2, r));
    float amp = 0.62 + 0.6 * fbm(vec2(seed * 0.31 + theta * 2.0, ts * 0.19));
    curtain += lobe * radial * amp;
    float rb = 0.24 + 0.19 * id * 0.22 + 0.06 * sin(theta * (5.0 + id) + tm * (0.33 + id * 0.04));
    float bw = 0.018 + 0.04 * fbm(vec2(seed + theta * 2.1, ts * 0.21));
    float band = smoothstep(rb - bw, rb, r) * (1.0 - smoothstep(rb + 0.01, rb + bw * 2.0, r));
    edgeBand += band * lobe;
  }
  curtain = clamp(curtain / 1.55, 0.0, 1.6);
  edgeBand = clamp(edgeBand / 2.0, 0.0, 1.0);
  float fold = 0.6 + 0.4 * (0.5 + 0.5 * sin(theta * (72.0 + 8.0 * sin(ts * 0.23)) + r * 28.0 - tm * 1.35 + flow.x * 8.0));
  float patternGate = smoothstep(0.34, 0.72, fbm(vec2(ts * 0.11, 1.7)));
  float ordered = curtain * fold;
  float chaotic = curtain * (0.35 + 0.65 * fbm(vec2(theta * 11.0 + tm * 0.62, r * 6.8 - ts * 0.31)));
  float pattern = mix(ordered, chaotic, patternGate);
  float alive = smoothstep(0.1, 0.68, fbm(vec2(theta * 4.5 + ts * 0.23, r * 2.2 - ts * 0.17)));
  float vanish = 1.0 - smoothstep(0.72, 0.98, fbm(vec2(theta * 6.0 - ts * 0.28, r * 1.7 + 4.3)));
  float merge = 0.5 + 0.5 * sin(theta * (4.0 + 2.2 * fbm(vec2(ts * 0.07, 2.9))) + tm * 0.55);
  float widthBreath = 0.82 + 0.32 * merge;
  float mLow = smoothstep(-0.02, 0.16, y);
  float I = pattern * (0.18 + 0.82 * alive) * vanish * widthBreath * mLow;
  I *= 0.72 + 0.28 * breath;
  I *= 0.92 + edgeBand * (0.5 + 0.35 * (1.0 - patternGate));
  I = pow(clamp(I, 0.0, 1.0), 0.8);
  float patchA = fbm(vec2(theta * 3.1 + tm * 0.41, r * 4.0 - tm * 0.29));
  float patchB = fbm(vec2(theta * 1.6 - tm * 0.33, r * 2.6 + ts * 0.19));
  float bright = 0.2 + 0.8 * smoothstep(0.12, 0.78, 0.6 * patchA + 0.4 * patchB);
  vec3 cG = vec3(0.22, 1.0, 0.38);
  vec3 cC = vec3(0.1, 0.72, 0.95);
  vec3 cP = vec3(0.72, 0.18, 0.96);
  vec3 cM = vec3(0.85, 0.32, 0.72);
  float colorR = r + 0.08 * patchA - 0.06 * patchB;
  vec3 aur = mix(cG, cC, smoothstep(0.04, 0.24, colorR));
  aur = mix(aur, cP, smoothstep(0.2, 0.48, colorR));
  aur = mix(aur, cM, smoothstep(0.46, 0.76, colorR) * 0.5);
  float colorShift = fbm(vec2(theta * 2.3 + tm * 0.09, ts * 0.13 + 5.1));
  aur = mix(aur, mix(cG, cP, colorShift), 0.18);
  float edgeLR = smoothstep(0.0, 0.06, x) * smoothstep(1.0, 0.94, x);
  vec3 glow = aur * I * bright * edgeLR;
  float haze = pow(max(0.0, pattern * bright), 1.55) * 0.12;
  glow += mix(cC * 0.4, cP * 0.3, colorShift) * haze * mLow * edgeLR;
  return glow;
}
void main() {
  float baseTime = u_time * (0.0000062 * mix(1.0, 0.028, u_rm));
  float slowCarrierC = 0.5 + 0.5 * sin(u_time * 0.00002 + 0.9 * sin(u_time * 0.0000056));
  float accelWindowC = smoothstep(0.64, 0.93, slowCarrierC);
  float accelOscC = 0.5 + 0.5 * sin(u_time * 0.000055 + 0.7 * sin(u_time * 0.000011));
  float cruiseC = mix(0.08, 0.28 + 0.72 * accelOscC, accelWindowC);
  float speedMulC = mix(0.09, 0.46, cruiseC);
  float t = baseTime * speedMulC;
  float x = v_uv.x;
  float y = v_uv.y;
  float breath = 0.5 + 0.5 * sin(u_time * 0.00016);
  vec3 skyLo = vec3(0.012, 0.016, 0.045);
  vec3 skyHi = vec3(0.022, 0.015, 0.082);
  vec3 sky = mix(skyLo, skyHi, smoothstep(0.0, 1.0, x) * 0.5 + y * 0.5);
  sky += vec3(0.004, 0.006, 0.014) * pow(y, 2.8) * 0.55;
  vec3 glow = auroraFieldCorona(v_uv, t, breath);
  vec3 outRgb = sky + glow * 1.04;
  float lowFog = exp(-y * 3.2) * (0.09 + 0.05 * fbm(vec2(x * 3.2 + t * 0.04, 2.1)));
  outRgb += vec3(0.08, 0.22, 0.26) * lowFog;
  float depthShade = 1.0 - smoothstep(0.0, 0.42, y);
  outRgb *= 1.0 - 0.18 * depthShade;
  float flowVeil = (1.0 - u_rm) * smoothstep(0.24, 0.96, y) * (1.0 - smoothstep(0.9, 1.0, y));
  outRgb += vec3(0.18, 0.34, 0.62) * flowVeil * 0.04 * breath;
  outRgb = pow(clamp(outRgb, 0.0, 1.0), vec3(0.95));
  float lum = dot(outRgb, vec3(0.2126, 0.7152, 0.0722));
  outRgb = mix(vec3(lum), outRgb, 1.34);
  outRgb = (outRgb - 0.5) * 1.2 + 0.5;
  outRgb *= 1.05;
  fragColor = vec4(clamp(outRgb, 0.0, 1.0), 1.0);
}`;

function mulberry32(a: number) {
  return function random() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeStarSprite(size: number, coreAlpha: number, midAlpha: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const cx = c.getContext("2d");
  if (!cx) return c;
  const mid = size * 0.5;
  const grad = cx.createRadialGradient(mid, mid, 0, mid, mid, mid);
  grad.addColorStop(0, `rgba(255,255,255,${coreAlpha})`);
  grad.addColorStop(0.32, `rgba(210,235,255,${midAlpha})`);
  grad.addColorStop(1, "rgba(180,215,255,0)");
  cx.fillStyle = grad;
  cx.beginPath();
  cx.arc(mid, mid, mid, 0, Math.PI * 2);
  cx.fill();
  return c;
}

export function AuroraCoronaBackground({
  className,
  style,
  zIndex = 1,
  quality = "auto",
  reducedMotion: reducedMotionOverride,
  scrollFollow = false,
  scrollFollowFactor = 1,
  hideWhenScrolledOut = false,
  dimScrim = true,
}: AuroraCoronaBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const auroraCanvasRef = useRef<HTMLCanvasElement>(null);
  const starsCanvasRef = useRef<HTMLCanvasElement>(null);

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
    const auroraCanvas = auroraCanvasRef.current;
    const starsCanvas = starsCanvasRef.current;
    if (!root || !auroraCanvas || !starsCanvas) return;

    const sctx = starsCanvas.getContext("2d", { alpha: true });
    if (!sctx) return;

    let gl: WebGL2RenderingContext | null = null;
    let prog: WebGLProgram | null = null;
    let buf: WebGLBuffer | null = null;
    let fallbackCtx: CanvasRenderingContext2D | null = null;
    let rafId = 0;
    let resizeRaf = 0;
    let dpr = 1;
    let W = 0;
    let H = 0;
    let stars: Star[] = [];
    let brightStars: BrightStar[] = [];
    let brightSprite: HTMLCanvasElement | null = null;
    let brightFlareSprite: HTMLCanvasElement | null = null;
    let lastStarsDrawAt = -1;
    let layerOffsetY = 0;
    let hiddenByScroll = false;

    const compileShader = (type: number, src: string) => {
      if (!gl) return null;
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const initWebGL = () => {
      gl = auroraCanvas.getContext("webgl2", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      });
      if (!gl) return false;
      const vs = compileShader(gl.VERTEX_SHADER, VS_SRC);
      const fs = compileShader(gl.FRAGMENT_SHADER, FS_SRC);
      if (!vs || !fs) return false;
      prog = gl.createProgram();
      if (!prog) return false;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.deleteProgram(prog);
        prog = null;
        return false;
      }
      buf = gl.createBuffer();
      if (!buf) return false;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.STENCIL_TEST);
      return true;
    };

    const initStars = () => {
      const rnd = mulberry32(0x9e3779b9 ^ (W | 0) ^ (H << 16));
      stars = [];
      brightStars = [];
      const cap = Math.min(
        profile.starCapMax,
        Math.max(profile.starCapMin, Math.floor((W * H) / profile.starDensityDivisor))
      );
      for (let i = 0; i < cap; i += 1) {
        stars.push({
          x: rnd() * W,
          y: rnd() * H * 0.96,
          r: rnd() * 1.15 + 0.3,
          phase: rnd() * Math.PI * 2,
          speed: 0.00025 + rnd() * 0.00055,
          base: 0.28 + rnd() * 0.38,
          amp: 0.18 + rnd() * 0.42,
          slow: 0.3 + rnd() * 0.7,
        });
      }
      const brightCap = Math.min(
        profile.brightCapMax,
        Math.max(profile.brightCapMin, Math.floor(cap / profile.brightCapDivisor))
      );
      for (let i = 0; i < brightCap; i += 1) {
        brightStars.push({
          x: rnd() * W,
          y: rnd() * H * 0.78,
          r: 1.0 + rnd() * 0.9,
          phase: rnd() * Math.PI * 2,
          speed: 0.00032 + rnd() * 0.0004,
          base: 0.54 + rnd() * 0.16,
          amp: 0.26 + rnd() * 0.22,
          flareSpeed: 0.00016 + rnd() * 0.0002,
          flareSharp: 10 + rnd() * 4,
        });
      }
    };

    const drawAurora = (t: number) => {
      if (gl && prog && buf) {
        gl.useProgram(prog);
        const uTime = gl.getUniformLocation(prog, "u_time");
        const uRm = gl.getUniformLocation(prog, "u_rm");
        gl.uniform1f(uTime, t);
        gl.uniform1f(uRm, reducedMotion ? 1 : 0);
        gl.viewport(0, 0, auroraCanvas.width, auroraCanvas.height);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.clearColor(0.02, 0.02, 0.04, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        return;
      }
      if (!fallbackCtx) return;
      const s = dpr * profile.auroraScale;
      fallbackCtx.setTransform(s, 0, 0, s, 0, 0);
      const cx = W * 0.5;
      const cy = H * 0.46;
      const rr = Math.max(W * 0.55, H * 0.5);
      const g = fallbackCtx.createRadialGradient(cx, cy, rr * 0.08, cx, cy, rr * 1.05);
      g.addColorStop(0, "hsl(230, 45%, 3%)");
      g.addColorStop(0.35, "hsl(175, 38%, 8%)");
      g.addColorStop(0.62, "hsl(200, 42%, 7%)");
      g.addColorStop(1, "hsl(275, 40%, 5%)");
      fallbackCtx.fillStyle = g;
      fallbackCtx.fillRect(0, 0, W, H);
    };

    const drawStars = (t: number) => {
      const starPx = dpr * profile.starScale;
      sctx.setTransform(starPx, 0, 0, starPx, 0, 0);
      sctx.clearRect(0, 0, W, H);
      sctx.globalCompositeOperation = "screen";
      for (const st of stars) {
        const tw = reducedMotion
          ? st.base
          : st.base +
            st.amp *
              (st.slow * Math.sin(t * st.speed + st.phase) +
                (1 - st.slow) * 0.35 * Math.sin(t * st.speed * 2.17 + st.phase * 1.3));
        const alpha = Math.max(0.08, Math.min(1, tw));
        sctx.fillStyle = `rgba(255,255,255,${alpha})`;
        sctx.beginPath();
        sctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        sctx.fill();
      }
      if (!brightSprite || !brightFlareSprite) return;
      for (const bs of brightStars) {
        let flare = 0.04;
        const bt = reducedMotion
          ? bs.base + bs.amp * 0.2
          : bs.base +
            bs.amp *
              (0.72 * Math.sin(t * bs.speed + bs.phase) +
                0.28 * Math.sin(t * bs.speed * 2.73 + bs.phase * 1.17));
        if (!reducedMotion) {
          flare = Math.pow(Math.max(0, Math.sin(t * bs.flareSpeed + bs.phase * 1.9)), bs.flareSharp);
        }
        const bta = Math.max(0.2, Math.min(1.08, bt + flare * 0.52));
        const scale = bs.r * (0.9 + bta * 0.28 + flare * 0.2);
        const size = 5.5 * scale;
        sctx.globalAlpha = Math.min(0.92, 0.42 + bta * 0.34);
        sctx.drawImage(brightSprite, bs.x - size, bs.y - size, size * 2, size * 2);
        if (flare > 0.45) {
          const fSize = size * (1.15 + flare * 0.6);
          sctx.globalAlpha = Math.min(0.45, flare * 0.38);
          sctx.drawImage(brightFlareSprite, bs.x - fSize, bs.y - fSize, fSize * 2, fSize * 2);
        }
      }
      sctx.globalAlpha = 1;
      sctx.globalCompositeOperation = "source-over";
    };

    const clearLayers = () => {
      if (gl) {
        gl.viewport(0, 0, auroraCanvas.width, auroraCanvas.height);
        gl.clearColor(0.02, 0.02, 0.04, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      const starPx = dpr * profile.starScale;
      sctx.setTransform(starPx, 0, 0, starPx, 0, 0);
      sctx.clearRect(0, 0, W, H);
    };

    const onResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      const auroraPx = dpr * profile.auroraScale;
      const starPx = dpr * profile.starScale;
      auroraCanvas.width = Math.max(1, Math.floor(W * auroraPx));
      auroraCanvas.height = Math.max(1, Math.floor(H * auroraPx));
      auroraCanvas.style.width = `${W}px`;
      auroraCanvas.style.height = `${H}px`;
      starsCanvas.width = Math.max(1, Math.floor(W * starPx));
      starsCanvas.height = Math.max(1, Math.floor(H * starPx));
      starsCanvas.style.width = `${W}px`;
      starsCanvas.style.height = `${H}px`;
      brightSprite = makeStarSprite(profile.spriteSize, 0.92, 0.34);
      brightFlareSprite = makeStarSprite(profile.flareSpriteSize, 0.55, 0.24);
      initStars();
      lastStarsDrawAt = -1;
    };

    const onScroll = () => {
      if (!scrollFollow) return;
      const y = window.scrollY || window.pageYOffset || 0;
      layerOffsetY = -y * scrollFollowFactor;
      root.style.transform = `translate3d(0, ${layerOffsetY.toFixed(2)}px, 0)`;
      if (hideWhenScrolledOut) {
        hiddenByScroll = y >= H;
        if (hiddenByScroll) {
          clearLayers();
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
          }
        } else if (!rafId && !reducedMotion) {
          rafId = requestAnimationFrame(tick);
        }
      }
    };

    const frame = (t: number) => {
      if (hiddenByScroll) return;
      drawAurora(t);
      if (lastStarsDrawAt < 0 || t - lastStarsDrawAt >= profile.starFrameIntervalMs) {
        drawStars(t);
        lastStarsDrawAt = t;
      }
    };

    const tick = (t: number) => {
      frame(t);
      if (!reducedMotion && !hiddenByScroll) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    };

    onResize();
    const webglReady = initWebGL();
    if (!webglReady) fallbackCtx = auroraCanvas.getContext("2d", { alpha: false });
    onScroll();
    frame(0);
    if (!reducedMotion && !hiddenByScroll) rafId = requestAnimationFrame(tick);

    const scheduleResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        onResize();
        onScroll();
        frame(performance.now());
      });
    };

    window.addEventListener("resize", scheduleResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      window.removeEventListener("resize", scheduleResize);
      window.removeEventListener("scroll", onScroll);
      if (gl && prog) gl.deleteProgram(prog);
      if (gl && buf) gl.deleteBuffer(buf);
    };
  }, [profile, reducedMotion, scrollFollow, scrollFollowFactor, hideWhenScrolledOut]);

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
      <canvas ref={auroraCanvasRef} style={{ ...layerBaseStyle, zIndex: 1 }} />
      {dimScrim && (
        <div
          style={{
            ...layerBaseStyle,
            zIndex: 2,
            background:
              "linear-gradient(180deg, rgba(8,10,22,0.34) 0%, rgba(8,10,22,0.1) 32%, rgba(10,8,25,0.09) 55%, rgba(5,6,14,0.78) 100%)",
          }}
        />
      )}
      <canvas ref={starsCanvasRef} style={{ ...layerBaseStyle, zIndex: 3 }} />
      <div
        style={{
          ...layerBaseStyle,
          zIndex: 4,
          opacity: 0.035,
          mixBlendMode: "overlay",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
