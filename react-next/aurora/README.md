# AuroraCoronaBackground (React/Next.js)

현재 `index.html`에서 만든 배경 이펙트를 다른 프로젝트에서 바로 재사용할 수 있도록 컴포넌트화한 버전입니다.

- `AuroraCoronaBackground`: 코로나 커튼 오로라 + 별
- `MilkyWayBackground`: 워프형(원근) 은하수 + 성운

## 파일 구성

- `react-next/aurora/AuroraCoronaBackground.tsx`
- `react-next/aurora/MilkyWayBackground.tsx`
- `react-next/aurora/useAdaptiveQuality.ts`
- `react-next/aurora/types.ts`
- `react-next/aurora/index.ts`

## 빠른 사용법 (Next.js App Router)

1. 위 `react-next/aurora` 폴더를 대상 프로젝트로 복사
2. 클라이언트 컴포넌트(예: `app/page.tsx` 내 client wrapper)에서 사용

```tsx
"use client";

import { AuroraCoronaBackground } from "@/components/aurora";

export default function HeroPage() {
  return (
    <>
      <AuroraCoronaBackground
        quality="auto"
        scrollFollow
        scrollFollowFactor={1}
        hideWhenScrolledOut
        zIndex={0}
      />
      <main style={{ position: "relative", zIndex: 1 }}>
        {/* 콘텐츠 */}
      </main>
    </>
  );
}
```

## 은하수 컴포넌트 사용

```tsx
"use client";

import { MilkyWayBackground } from "@/components/aurora";

export default function GalaxySection() {
  return (
    <>
      <MilkyWayBackground
        quality="auto"
        scrollFollow
        scrollFollowFactor={1}
        hideWhenScrolledOut
        zIndex={0}
      />
      <main style={{ position: "relative", zIndex: 1 }}>
        {/* 콘텐츠 */}
      </main>
    </>
  );
}
```

## Props

- `quality`: `"auto" | "low" | "medium" | "high"`
- `reducedMotion`: 강제 모션 축소 여부
- `scrollFollow`: 스크롤과 함께 레이어 이동
- `scrollFollowFactor`: 스크롤 추종 비율 (`1`이면 텍스트와 동일)
- `hideWhenScrolledOut`: 화면 밖으로 나가면 렌더 중단
- `dimScrim`: 어두운 스크림 오버레이 사용 여부
- `zIndex`, `className`, `style`

`MilkyWayBackground`도 동일한 Props를 사용합니다.

## 통합 팁

- 배경 컴포넌트는 `position: fixed` + `pointer-events: none` 구조입니다.
- 콘텐츠 컨테이너는 `position: relative; z-index`를 배경보다 높게 설정하세요.
- SSR 환경에서 브라우저 API를 쓰므로 반드시 클라이언트 경계에서 렌더링하세요.

## 팀원 전달(비공개) 방식

공개 npm 배포를 막기 위해 이 패키지는 `package.json`에 `"private": true`가 설정되어 있습니다.

팀 공유 절차는 `TEAM_DISTRIBUTION.md` 문서를 참고하세요.

