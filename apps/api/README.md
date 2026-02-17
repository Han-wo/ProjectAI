# API Guide

`apps/api`는 NestJS 기반 LLM API 서버입니다.

## 주요 역할

- LiteLLM 경유 채팅/에이전트 실행
- LangGraph 단일 스텝 에이전트 실행
- Qdrant RAG 인덱싱/검색
- Neo4j 쿼리 실행
- Postgres/Redis/Qdrant/Neo4j 헬스체크

## 주요 엔드포인트

- `GET /health`
- `GET /infra/health`
- `GET /llm/providers`
- `POST /llm/chat`
- `POST /llm/agent`
- `POST /rag/index`
- `POST /rag/search`
- `GET /graph/health`
- `POST /graph/query`

## 주요 패키지

- Nest: `@nestjs/common`, `@nestjs/core`, `@nestjs/swagger`
- LLM: `@repo/llm-core`, `zod`
- Data: `pg`, `ioredis`, `neo4j-driver`

## Environment 핵심

- LiteLLM: `USE_LITELLM`, `LITELLM_BASE_URL`, `LITELLM_API_KEY`
- RAG: `QDRANT_URL`, `QDRANT_COLLECTION`, `EMBEDDING_MODEL`
- Graph: `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`

## Commands

- 개발: `pnpm dev:api`
- 빌드: `pnpm --filter @apps/api build`
- 린트: `pnpm --filter @apps/api lint`
- 타입체크: `pnpm --filter @apps/api typecheck`

ESLint는 루트 `eslint.config.js`를 공통 사용합니다.
