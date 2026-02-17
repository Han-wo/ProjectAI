# LLM Fullstack Monorepo

Node.js + TypeScript 기반으로 Next.js(웹) + NestJS(API) + 멀티 데이터 스토어 + LiteLLM + LangChain/LangGraph를 한 번에 개발할 수 있도록 구성한 모노레포입니다.

## 구성

- `apps/web`: Next.js 15 (React 19) + Tailwind + NextAuth
- `apps/api`: NestJS 10 API
- `packages/llm-core`: LLM/Agent/Vector/Graph/RDB 공용 모듈
- `infra/docker-compose.yml`: Postgres+pgvector, Redis, Qdrant, Neo4j, LiteLLM

## 주요 스택

- LLM: `openai`, `@anthropic-ai/sdk`, `ai`, `@langchain/*`, `@langchain/langgraph`
- Auth: `next-auth` (credentials)
- Frontend: TailwindCSS, React Compiler
- Data: PostgreSQL + pgvector, Redis, Qdrant, Neo4j
- Gateway/Logging: LiteLLM (Postgres logging)
- Code Quality: ESLint(Airbnb) + Prettier (monorepo 공통)

## 빠른 시작

```bash
cd llm-fullstack-monorepo
pnpm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm infra:up
pnpm dev
```

주의: 이 모노레포는 `pnpm` 기준입니다. `npm install` 대신 `pnpm install`을 사용하세요.

인프라 종료:

```bash
pnpm infra:down
```

## 접속 주소

- Web: `http://localhost:3000`
- Login: `http://localhost:3000/login`
- API: `http://localhost:4000`
- Swagger: `http://localhost:4000/docs`
- Neo4j Browser: `http://localhost:7474`
- LiteLLM Proxy: `http://localhost:4001`

## 필수 ENV

- LiteLLM Client(API->LiteLLM): `USE_LITELLM`, `LITELLM_BASE_URL`, `LITELLM_API_KEY`
- LiteLLM Upstream(LiteLLM->Provider): `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- Auth: `AUTH_SECRET`, `AUTH_ADMIN_EMAIL`, `AUTH_ADMIN_PASSWORD`
- Data: `DATABASE_URL`, `REDIS_URL`, `QDRANT_URL`, `NEO4J_URI`

로그인은 `.env(.local)`의 `AUTH_ADMIN_EMAIL`, `AUTH_ADMIN_PASSWORD`를 사용합니다.
기본 동작은 API가 OpenAI/Anthropic를 직접 호출하지 않고 LiteLLM만 호출합니다.

## 코드 품질 명령어

- 전체 린트: `pnpm lint`
- 전체 린트 자동수정: `pnpm lint:fix`
- 전체 포맷 검사: `pnpm format`
- 전체 포맷 적용: `pnpm format:write`
- 공통 린트 설정 파일: `eslint.config.js` (루트 단일 관리)

## 폴더별 문서

- `infra/README.md`
- `apps/api/README.md`
- `apps/web/README.md`

## API

- `GET /health`
- `GET /infra/health`
- `GET /graph/health`
- `POST /graph/query`
- `GET /llm/providers`
- `POST /llm/chat`
- `POST /llm/agent` (LangGraph)
- `POST /rag/index` (Qdrant 임베딩 적재)
- `POST /rag/search` (Qdrant 유사도 검색)

`POST /llm/chat` 예시:

```json
{
  "provider": "litellm",
  "message": "RAG 파이프라인 설계안을 5줄로 정리해줘",
  "systemPrompt": "You are concise"
}
```

`POST /llm/agent` 예시:

```json
{
  "provider": "litellm",
  "threadId": "demo-thread-1",
  "message": "주요 컴포넌트 아키텍처를 설명해줘",
  "systemPrompt": "You are a senior architect"
}
```

`POST /rag/index` 예시:

```json
{
  "collectionName": "documents",
  "documents": [
    {
      "id": "doc-1",
      "text": "LangGraph는 상태 기반 워크플로우를 구성할 수 있다.",
      "metadata": {
        "topic": "langgraph"
      }
    }
  ]
}
```

`POST /rag/search` 예시:

```json
{
  "collectionName": "documents",
  "query": "상태 기반 에이전트 워크플로우",
  "k": 4
}
```

`POST /graph/query` 예시:

```json
{
  "query": "MATCH (n) RETURN n LIMIT 5"
}
```

## 공용 모듈

- `@repo/llm-core/server`: OpenAI/Anthropic/LiteLLM 통합 채팅 클라이언트
- `@repo/llm-core/langgraph`: LangGraph agent 실행기
- `@repo/llm-core/vector`: Qdrant 벡터 스토어 헬퍼
- `@repo/llm-core/rdb`: Postgres 쿼리 헬퍼
- `@repo/llm-core/graph`: Neo4j 쿼리 헬퍼
# ProjectAI
