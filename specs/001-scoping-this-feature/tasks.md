# Tasks: AI-Powered Natural Language Flight Search

**Input**: Design documents from `/specs/001-scoping-this-feature/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓), quickstart.md (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → SUCCESS: Web application with Next.js 15, AI SDK, Supabase
   → Extract: Libraries (chat-engine, flight-parser, url-generator)
2. Load optional design documents:
   → data-model.md: 5 entities extracted → model tasks
   → contracts/openapi.yaml: 6 endpoints extracted → contract test tasks  
   → research.md: Tech decisions → setup tasks
   → quickstart.md: 8 test scenarios → integration test tasks
3. Generate tasks by category:
   → Setup: Next.js, Supabase, AI SDK dependencies
   → Tests: 6 contract tests, 8 integration tests
   → Core: 5 models, 3 libraries, 6 API endpoints
   → Integration: Database, AI services, frontend
   → Polish: Unit tests, performance, documentation
4. Apply task rules:
   → Contract tests marked [P] (different files)
   → Models marked [P] (independent entities)
   → API endpoints sequential (shared route files)
5. Number tasks sequentially (T001-T042)
6. TDD ordering: Tests before implementation
7. SUCCESS: 42 tasks ready for execution
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- File paths use web application structure (frontend/, backend/)

## Phase 3.1: Setup & Project Structure

- [ ] **T001** Create project structure with frontend/ and backend/ directories
- [ ] **T002** Initialize Next.js 15 project in frontend/ with TypeScript and App Router
- [ ] **T003** Initialize backend/ with Node.js, TypeScript, and Express/Next.js API routes
- [ ] **T004** [P] Install AI SDK v5, OpenAI client, and Langchain dependencies
- [ ] **T005** [P] Install Supabase client and PostgreSQL connection libraries
- [ ] **T006** [P] Install Tailwind CSS v5 and Shadcn UI components
- [ ] **T007** [P] Install TanStack Query, Zustand, and state management dependencies
- [ ] **T008** [P] Configure linting (ESLint), formatting (Prettier), and TypeScript strict mode
- [ ] **T009** Setup Supabase database schema and run migrations from data-model.md

## Phase 3.2: Contract Tests (TDD) ⚠️ MUST COMPLETE BEFORE IMPLEMENTATION

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [ ] **T010** [P] Contract test POST /api/chat/start in `backend/tests/contract/chat-start.test.ts`
- [ ] **T011** [P] Contract test POST /api/chat/{id}/messages in `backend/tests/contract/chat-messages.test.ts`  
- [ ] **T012** [P] Contract test POST /api/chat/{id}/generate-url in `backend/tests/contract/chat-generate-url.test.ts`
- [ ] **T013** [P] Contract test GET /api/conversations/{id} in `backend/tests/contract/conversations-get.test.ts`
- [ ] **T014** [P] Contract test GET /api/destinations/recommendations in `backend/tests/contract/destinations.test.ts`
- [ ] **T015** [P] Contract test GET /api/health in `backend/tests/contract/health.test.ts`

## Phase 3.3: Data Models (Can run in parallel with contract tests)

- [ ] **T016** [P] Conversation model in `backend/src/models/conversation.ts` with Zod validation
- [ ] **T017** [P] SearchParameters model in `backend/src/models/search-parameters.ts` with IATA validation
- [ ] **T018** [P] Message model in `backend/src/models/message.ts` with role validation
- [ ] **T019** [P] MultiCitySegment model in `backend/src/models/multi-city-segment.ts`
- [ ] **T020** [P] DestinationRecommendation model in `backend/src/models/destination-recommendation.ts`
- [ ] **T021** Database service layer in `backend/src/services/database.ts` with Supabase client

## Phase 3.4: Core Libraries (ONLY after models complete)

- [ ] **T022** [P] Chat engine library in `backend/src/lib/chat-engine/` with OpenAI integration
- [ ] **T023** [P] Flight parser library in `backend/src/lib/flight-parser/` with OpenAI-powered IATA conversion
- [ ] **T024** [P] URL generator library in `backend/src/lib/url-generator/` with Paylater URL format

## Phase 3.5: API Endpoints Implementation (Sequential - shared route structure)

- [ ] **T025** POST /api/chat/start endpoint in `backend/src/app/api/chat/start/route.ts`
- [ ] **T026** POST /api/chat/[id]/messages endpoint in `backend/src/app/api/chat/[id]/messages/route.ts`
- [ ] **T027** POST /api/chat/[id]/generate-url endpoint in `backend/src/app/api/chat/[id]/generate-url/route.ts`
- [ ] **T028** GET /api/conversations/[id] endpoint in `backend/src/app/api/conversations/[id]/route.ts`
- [ ] **T029** GET /api/destinations/recommendations endpoint in `backend/src/app/api/destinations/recommendations/route.ts`
- [ ] **T030** GET /api/health endpoint in `backend/src/app/api/health/route.ts`

## Phase 3.6: Frontend Components (Can run in parallel after models)

- [ ] **T031** [P] Homepage search component in `frontend/src/components/search/HomePage.tsx`
- [ ] **T032** [P] Chat modal component in `frontend/src/components/chat/ChatModal.tsx` with AI streaming
- [ ] **T033** [P] Message components in `frontend/src/components/chat/MessageList.tsx` and `MessageItem.tsx`
- [ ] **T034** [P] Destination recommendations UI in `frontend/src/components/search/DestinationRecommendations.tsx`
- [ ] **T035** [P] Search URL generation button in `frontend/src/components/chat/SearchButton.tsx`
- [ ] **T036** [P] Chat state management with Zustand in `frontend/src/lib/chat-state/store.ts`
- [ ] **T037** [P] API client with TanStack Query in `frontend/src/lib/api-client/hooks.ts`

## Phase 3.7: Integration Tests (Based on quickstart scenarios)

- [ ] **T038** [P] Integration test Scenario 1: Direct natural language search in `tests/integration/direct-search.test.ts`
- [ ] **T039** [P] Integration test Scenario 2: Guided discovery flow in `tests/integration/guided-discovery.test.ts`
- [ ] **T040** [P] Integration test Scenario 3: Date validation (2-week minimum) in `tests/integration/date-validation.test.ts`
- [ ] **T041** [P] Integration test Scenario 4: Airport disambiguation in `tests/integration/airport-disambiguation.test.ts`
- [ ] **T042** [P] Integration test Scenario 5: Multi-city complex trip in `tests/integration/multi-city.test.ts`
- [ ] **T043** [P] Integration test Scenario 6: Family travel with children in `tests/integration/family-travel.test.ts`
- [ ] **T044** [P] Integration test Scenario 7: Customer support handoff in `tests/integration/support-handoff.test.ts`
- [ ] **T045** [P] Integration test Scenario 8: Cabin class selection in `tests/integration/cabin-class.test.ts`

## Phase 3.8: Performance & Polish

- [ ] **T046** [P] Unit tests for chat-engine library in `backend/tests/unit/chat-engine.test.ts`
- [ ] **T047** [P] Unit tests for flight-parser library in `backend/tests/unit/flight-parser.test.ts`
- [ ] **T048** [P] Unit tests for url-generator library in `backend/tests/unit/url-generator.test.ts`
- [ ] **T049** Performance tests: <2 second response time validation
- [ ] **T050** [P] Frontend unit tests for chat components in `frontend/tests/unit/`
- [ ] **T051** Error handling and edge cases testing
- [ ] **T052** [P] CLI commands for library testing (--test-conversation, --parse-query, --generate-url)
- [ ] **T053** Database seeding with destination recommendations
- [ ] **T054** Environment configuration and deployment setup
- [ ] **T055** Documentation updates and README completion

## Dependencies

**Phase Order**:
- Setup (T001-T009) → Tests & Models (T010-T021) → Libraries (T022-T024) → API (T025-T030) → Frontend (T031-T037) → Integration (T038-T045) → Polish (T046-T055)

**Specific Dependencies**:
- T010-T015 (contract tests) before T025-T030 (API implementation) - **TDD CRITICAL**
- T016-T021 (models) before T022-T024 (libraries)
- T022-T024 (libraries) before T025-T030 (API endpoints)
- T021 (database service) before T025-T030 (API endpoints)
- T036-T037 (state management) before T031-T035 (UI components)
- T025-T030 (API) before T038-T045 (integration tests)

## Parallel Execution Examples

### Contract Tests Phase (Run together after setup):
```bash
Task: "Contract test POST /api/chat/start in backend/tests/contract/chat-start.test.ts"
Task: "Contract test POST /api/chat/{id}/messages in backend/tests/contract/chat-messages.test.ts"  
Task: "Contract test POST /api/chat/{id}/generate-url in backend/tests/contract/chat-generate-url.test.ts"
Task: "Contract test GET /api/conversations/{id} in backend/tests/contract/conversations-get.test.ts"
Task: "Contract test GET /api/destinations/recommendations in backend/tests/contract/destinations.test.ts"
Task: "Contract test GET /api/health in backend/tests/contract/health.test.ts"
```

### Models Phase (Run together):
```bash
Task: "Conversation model in backend/src/models/conversation.ts with Zod validation"
Task: "SearchParameters model in backend/src/models/search-parameters.ts with IATA validation"
Task: "Message model in backend/src/models/message.ts with role validation"
Task: "MultiCitySegment model in backend/src/models/multi-city-segment.ts"
Task: "DestinationRecommendation model in backend/src/models/destination-recommendation.ts"
```

### Libraries Phase (Run together after models):
```bash
Task: "Chat engine library in backend/src/lib/chat-engine/ with OpenAI integration"
Task: "Flight parser library in backend/src/lib/flight-parser/ with OpenAI-powered IATA conversion"  
Task: "URL generator library in backend/src/lib/url-generator/ with Paylater URL format"
```

### Frontend Components Phase (Run together after models):
```bash
Task: "Homepage search component in frontend/src/components/search/HomePage.tsx"
Task: "Chat modal component in frontend/src/components/chat/ChatModal.tsx with AI streaming"
Task: "Message components in frontend/src/components/chat/MessageList.tsx and MessageItem.tsx"
Task: "Destination recommendations UI in frontend/src/components/search/DestinationRecommendations.tsx"
Task: "Search URL generation button in frontend/src/components/chat/SearchButton.tsx"
```

## Notes
- [P] tasks = different files, no shared dependencies
- **TDD ENFORCED**: Contract tests (T010-T015) MUST fail before API implementation (T025-T030)
- Commit after each task completion
- API endpoints are sequential due to shared Next.js API route structure
- Integration tests validate complete user flows from quickstart.md
- Performance target: <2 second AI response time, 100+ concurrent users

## Task Generation Rules Applied

1. **From Contracts**: 6 endpoints → 6 contract test tasks [P]
2. **From Data Model**: 5 entities → 5 model creation tasks [P] 
3. **From User Stories**: 8 quickstart scenarios → 8 integration tests [P]
4. **From Libraries**: 3 libraries → 3 library implementation tasks [P]
5. **Ordering**: Setup → Tests → Models → Libraries → API → Frontend → Integration → Polish

## Validation Checklist

- [✓] All contracts have corresponding tests (T010-T015 → T025-T030)
- [✓] All entities have model tasks (T016-T020)
- [✓] All tests come before implementation (TDD order maintained)
- [✓] Parallel tasks truly independent (different files, no shared dependencies)
- [✓] Each task specifies exact file path
- [✓] No [P] task modifies same file as another [P] task
- [✓] Integration tests cover all quickstart scenarios
- [✓] Performance and polish tasks included