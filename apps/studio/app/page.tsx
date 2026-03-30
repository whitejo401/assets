"use client";

import { useMemo, useState } from "react";
import {
  AuroraCoronaBackground,
  MilkyWayBackground,
  type AuroraQualityTier,
} from "aurora-corona-background";

type QualityOption = AuroraQualityTier | "auto";
type BackgroundMode = "aurora" | "milky";

export default function StudioPage() {
  const [mode, setMode] = useState<BackgroundMode>("aurora");
  const [quality, setQuality] = useState<QualityOption>("auto");
  const [scrollFollow, setScrollFollow] = useState(true);
  const [hideWhenOut, setHideWhenOut] = useState(true);
  const [dimScrim, setDimScrim] = useState(true);
  const [factor, setFactor] = useState(1);

  const subtitle = useMemo(() => {
    return `mode=${mode} / quality=${quality} / scrollFollow=${scrollFollow} / factor=${factor.toFixed(2)}`;
  }, [mode, quality, scrollFollow, factor]);

  return (
    <>
      {mode === "aurora" ? (
        <AuroraCoronaBackground
          quality={quality}
          scrollFollow={scrollFollow}
          hideWhenScrolledOut={hideWhenOut}
          scrollFollowFactor={factor}
          dimScrim={dimScrim}
          zIndex={0}
        />
      ) : (
        <MilkyWayBackground
          quality={quality}
          scrollFollow={scrollFollow}
          hideWhenScrolledOut={hideWhenOut}
          scrollFollowFactor={factor}
          dimScrim={dimScrim}
          zIndex={0}
        />
      )}
      <main>
        <h1>LookGood Asset Studio</h1>
        <p className="lead">오로라/은하수 컴포넌트를 바로 테스트하는 로컬 스튜디오</p>
        <p className="lead">{subtitle}</p>

        <section className="panel">
          <label>
            Background
            <select value={mode} onChange={(e) => setMode(e.target.value as BackgroundMode)}>
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
