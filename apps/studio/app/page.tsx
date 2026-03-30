"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AuroraCoronaBackground,
  MilkyWayBackground,
  type AuroraQualityTier,
} from "aurora-corona-background";

type QualityOption = AuroraQualityTier | "auto";
type BackgroundMode = "aurora" | "milky" | "stacked";

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / Math.max(1e-6, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export default function StudioPage() {
  const [mode, setMode] = useState<BackgroundMode>("stacked");
  const [quality, setQuality] = useState<QualityOption>("auto");
  const [scrollFollow, setScrollFollow] = useState(true);
  const [hideWhenOut, setHideWhenOut] = useState(true);
  const [dimScrim, setDimScrim] = useState(true);
  const [factor, setFactor] = useState(1);
  const [scrollY, setScrollY] = useState(0);
  const [viewportH, setViewportH] = useState(1);
  const [milkyActive, setMilkyActive] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      setScrollY(window.scrollY || window.pageYOffset || 0);
      setViewportH(Math.max(1, window.innerHeight));
      raf = 0;
    };
    const onScrollOrResize = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  const auroraOpacity = useMemo(() => {
    const fadeStart = viewportH * 0.58;
    const fadeEnd = viewportH * 1.08;
    return 1 - smoothstep(fadeStart, fadeEnd, scrollY);
  }, [scrollY, viewportH]);

  const milkyOpacity = useMemo(() => {
    const revealStart = viewportH * 1.05;
    const revealEnd = viewportH * 1.95;
    return smoothstep(revealStart, revealEnd, scrollY);
  }, [scrollY, viewportH]);

  useEffect(() => {
    if (mode !== "stacked") {
      setMilkyActive(true);
      return;
    }

    // hysteresis: 켜짐/꺼짐 임계를 분리해 경계 플리커 방지
    const milkyOnAt = viewportH * 0.78;
    const milkyOffAt = viewportH * 0.62;
    setMilkyActive((prev) => {
      if (prev) return scrollY > milkyOffAt;
      return scrollY > milkyOnAt;
    });
  }, [mode, scrollY, viewportH]);

  const subtitle = useMemo(() => {
    return `mode=${mode} / quality=${quality} / scrollFollow=${scrollFollow} / factor=${factor.toFixed(2)}`;
  }, [mode, quality, scrollFollow, factor]);

  return (
    <>
      {mode !== "milky" && (
        <AuroraCoronaBackground
          active={true}
          quality={quality}
          scrollFollow={scrollFollow}
          hideWhenScrolledOut={mode === "stacked" ? true : hideWhenOut}
          scrollFollowFactor={factor}
          dimScrim={dimScrim}
          zIndex={mode === "stacked" ? 1 : 0}
          style={mode === "stacked" ? { opacity: auroraOpacity } : undefined}
        />
      )}

      {mode !== "aurora" && (
        <MilkyWayBackground
          active={milkyActive}
          quality={quality}
          scrollFollow={mode === "stacked" ? false : scrollFollow}
          hideWhenScrolledOut={mode === "stacked" ? false : hideWhenOut}
          scrollFollowFactor={mode === "stacked" ? 1 : factor}
          dimScrim={mode === "stacked" ? false : dimScrim}
          zIndex={0}
          style={mode === "stacked" ? { opacity: milkyOpacity } : undefined}
        />
      )}
      <main>
        <h1>LookGood Asset Studio</h1>
        <p className="lead">오로라/은하수 컴포넌트를 단독 또는 스택(HTML 스타일)으로 테스트하는 로컬 스튜디오</p>
        <p className="lead">{subtitle}</p>

        <section className="panel">
          <label>
            Background
            <select value={mode} onChange={(e) => setMode(e.target.value as BackgroundMode)}>
              <option value="stacked">stacked (aurora + milky)</option>
              <option value="aurora">aurora</option>
              <option value="milky">milky</option>
            </select>
          </label>

          <label>
            Quality
            <select value={quality} onChange={(e) => setQuality(e.target.value as QualityOption)}>
              <option value="auto">auto</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>

          <label>
            Scroll Follow
            <input type="checkbox" checked={scrollFollow} onChange={(e) => setScrollFollow(e.target.checked)} />
          </label>

          <label>
            Hide When Scrolled Out
            <input type="checkbox" checked={hideWhenOut} onChange={(e) => setHideWhenOut(e.target.checked)} />
          </label>

          <label>
            Dim Scrim
            <input type="checkbox" checked={dimScrim} onChange={(e) => setDimScrim(e.target.checked)} />
          </label>

          <label>
            Scroll Follow Factor ({factor.toFixed(2)})
            <input
              type="range"
              min={0.3}
              max={1.2}
              step={0.01}
              value={factor}
              onChange={(e) => setFactor(Number(e.target.value))}
            />
          </label>
        </section>

        {Array.from({ length: 18 }).map((_, idx) => (
          <article className="card" key={idx}>
            <strong>Section {idx + 1}</strong>
            <p>
              이 구간은 스크롤 테스트용 콘텐츠입니다. 선택한 배경이 자연스럽게 이동하는지, 뷰포트 밖으로 나가면 렌더링이
              줄어드는지 확인하세요.
            </p>
          </article>
        ))}
      </main>
    </>
  );
}
