# LookGood Workspace Guide

이 저장소는 **컴포넌트/에셋 제작 + 즉시 테스트**를 위한 로컬 워크스페이스입니다.

## 구조

- `apps/studio` : Next.js 기반 실시간 프리뷰 앱
- `react-next/aurora` : 재사용 가능한 오로라 패키지(로컬 비공개)

## 시작

```bash
npm install
npm run dev
```

기본 접속: `http://localhost:3000`

## 자주 쓰는 명령

```bash
npm run build
npm run typecheck
npm run pack:aurora
```

## 팀 전달

오로라 패키지는 공개 배포를 막기 위해 `private: true` 입니다.
팀 전달은 `react-next/aurora/TEAM_DISTRIBUTION.md` 절차대로 `.tgz` 파일로 진행하세요.
