# Web Guide

`apps/web`는 Next.js(App Router) 프론트엔드입니다.

## 주요 역할

- NextAuth 기반 로그인(credential)
- LLM Playground UI
  - chat / langgraph-agent 모드
  - provider 선택(`litellm`, `openai`, `anthropic`)
- API 서버(`NEXT_PUBLIC_API_BASE_URL`)와 통신

## 주요 패키지

- Core: `next`, `react`, `react-dom`
- Auth: `next-auth`
- Styling: `tailwindcss`, `postcss`, `autoprefixer`
- Build: `babel-plugin-react-compiler`

## 인증 방식

- 로그인 페이지: `/login`
- 인증 미들웨어: `middleware.ts`
- 관리자 계정 env:
  - `AUTH_ADMIN_EMAIL`
  - `AUTH_ADMIN_PASSWORD`

## Commands

- 개발: `pnpm dev:web`
- 빌드: `pnpm --filter @apps/web build`
- 린트: `pnpm --filter @apps/web lint`
- 타입체크: `pnpm --filter @apps/web typecheck`

ESLint는 루트 `eslint.config.js`를 공통 사용합니다.
