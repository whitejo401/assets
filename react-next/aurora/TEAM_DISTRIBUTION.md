# Aurora 패키지 팀원 전달 가이드 (비공개)

이 패키지는 공개 배포를 하지 않는 전제로 관리합니다.
`package.json`에 `"private": true`가 설정되어 있어 실수로 `npm publish`가 실행되어도 배포되지 않습니다.

## 1) 패키지 파일(.tgz) 생성

`react-next/aurora` 폴더에서 실행:

```bash
npm install
npm run typecheck
npm run build
npm pack
```

생성 결과 예시:

- `aurora-corona-background-0.1.0.tgz`

## 2) 팀원에게 전달

- 사내 메신저, 클라우드 드라이브, 사내 파일 서버 등으로 `.tgz` 파일 전달

## 3) 팀원 프로젝트에 설치

팀원 프로젝트 루트에서:

```bash
npm i ./aurora-corona-background-0.1.0.tgz
```

파일이 다른 위치에 있으면 상대/절대 경로를 맞춰 설치합니다.

## 4) 코드에서 사용

```tsx
"use client";

import { AuroraCoronaBackground } from "aurora-corona-background";

export default function Page() {
  return (
    <>
      <AuroraCoronaBackground
        quality="auto"
        scrollFollow
        scrollFollowFactor={1}
        hideWhenScrolledOut
      />
      <main style={{ position: "relative", zIndex: 1 }}>...</main>
    </>
  );
}
```

## 5) 업데이트 배포(팀 내부)

변경 후 반복:

1. `version` 증가 (`package.json`)
2. `npm run build && npm pack`
3. 새 `.tgz` 전달
4. 팀원 측 `npm i ./새파일.tgz` 재설치

## 참고

- 공개 npm 설치(`npm i 패키지명`)는 사용하지 않습니다.
- 필요하면 사내 Git 저장소 기반 설치 방식으로도 전환할 수 있습니다.
