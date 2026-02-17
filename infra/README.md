# Infra Guide

`infra/`는 로컬 개발 인프라를 Docker Compose로 실행하는 폴더입니다.

## Services

- `postgres` (`pgvector/pgvector:pg16`)
  - RDB + 벡터 인덱싱 확장(`vector`) 사용
- `redis` (`redis:7`)
  - 큐/캐시/레이트리밋 용도
- `qdrant` (`qdrant/qdrant`)
  - RAG 벡터 검색 스토어
- `neo4j` (`neo4j:5`)
  - 그래프 데이터 저장/조회
- `litellm` (`ghcr.io/berriai/litellm`)
  - OpenAI/Anthropic 통합 프록시 + 로그 저장

## Files

- `docker-compose.yml`
  - 전체 서비스 정의
- `litellm/config.yaml`
  - LiteLLM 모델 alias 및 DB 로깅 설정
- `postgres/init/001-enable-extensions.sql`
  - Postgres 초기 확장 생성 스크립트

## Commands

- 시작: `pnpm infra:up`
- 종료: `pnpm infra:down`
- 로그: `pnpm infra:logs`

## LiteLLM 운영 방식

- API 서버는 `LITELLM_BASE_URL` + `LITELLM_API_KEY`로 LiteLLM만 호출합니다.
- 실제 OpenAI/Anthropic API 키는 LiteLLM 컨테이너 환경변수로 주입되어야 합니다.
- 기본 model alias:
  - `openai-gpt-4.1-mini`
  - `anthropic-claude-3-5-haiku`
  - `openai-text-embedding-3-small`

ESLint는 루트 `eslint.config.js`를 공통 사용합니다.
