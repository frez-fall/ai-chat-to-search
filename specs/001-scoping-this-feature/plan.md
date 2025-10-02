# Implementation Plan: AI-Powered Natural Language Flight Search

**Branch**: `001-scoping-this-feature` | **Date**: 2025-09-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-scoping-this-feature/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → SUCCESS: Feature spec loaded and parsed
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Web application detected (frontend + backend + AI integration)
   → Set Structure Decision to Option 2 (Web application)
3. Evaluate Constitution Check section below
   → Initial assessment: 2 projects (frontend + backend), following framework patterns
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → Research AI integration patterns, IATA data sources, chat UI patterns
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
6. Re-evaluate Constitution Check section
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

## Summary
AI-powered conversational flight search system that converts natural language queries into structured flight search URLs. Users interact with a friendly AI chat modal that gathers flight preferences, validates dates (minimum 2 weeks), converts locations to IATA codes, and generates properly formatted search URLs for the existing Paylater booking system. Addresses low 42% Homepage conversion rate by providing intuitive search experience.

## Technical Context
**Language/Version**: TypeScript/JavaScript (Next.js 15, React 19)  
**Primary Dependencies**: Next.js, React Query, AI SDK, OpenAI API, Shadcn UI, Tailwind CSS v5  
**Storage**: Supabase (PostgreSQL) for conversation storage  
**Testing**: Jest + React Testing Library (frontend), Vitest (backend)  
**Target Platform**: Web browsers (responsive), Vercel deployment  
**Project Type**: web - determines source structure (frontend + backend)  
**Performance Goals**: <2 second chat responses, support 100+ concurrent users  
**Constraints**: <200ms p95 API response, 2-week minimum flight dates, IATA compliance  
**Scale/Scope**: 1000+ daily conversations, integration with existing Paylater booking flow

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (frontend, backend) - within limit
- Using framework directly? YES (Next.js App Router, React Query, AI SDK)
- Single data model? YES (conversation entities, no complex DTOs)
- Avoiding patterns? YES (direct Supabase client, no repository layers)

**Architecture**:
- EVERY feature as library? YES
  - chat-engine: Core AI conversation logic
  - flight-parser: OpenAI-powered IATA code conversion and validation  
  - url-generator: Flight search URL construction
- Libraries listed: chat-engine (AI conversation), flight-parser (OpenAI IATA conversion), url-generator (URL building)
- CLI per library: chat-engine (--test-conversation), flight-parser (--parse-query), url-generator (--generate-url)
- Library docs: YES, llms.txt format planned for AI context

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES (tests written first)
- Git commits show tests before implementation? YES (enforced in workflow)
- Order: Contract→Integration→E2E→Unit strictly followed? YES
- Real dependencies used? YES (actual OpenAI API, Supabase DB in tests)
- Integration tests for: chat flows, IATA parsing, URL generation
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? YES (conversation tracking, error logging)
- Frontend logs → backend? YES (unified error stream via Datadog)
- Error context sufficient? YES (conversation ID, user actions, API responses)

**Versioning**:
- Version number assigned? YES (0.1.0 - MVP launch)
- BUILD increments on every change? YES (CI/CD pipeline)
- Breaking changes handled? YES (conversation schema migrations planned)

## Project Structure

### Documentation (this feature)
```
specs/001-scoping-this-feature/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (frontend + backend detected)
backend/
├── src/
│   ├── lib/
│   │   ├── chat-engine/     # AI conversation management
│   │   ├── flight-parser/   # Natural language processing
│   │   └── url-generator/   # Flight URL construction
│   ├── api/
│   │   ├── chat/           # Chat API endpoints
│   │   └── health/         # System health
│   └── models/
│       └── conversation.ts # Chat data models
└── tests/
    ├── contract/           # API contract tests
    ├── integration/        # Cross-service tests
    └── unit/              # Library unit tests

frontend/
├── src/
│   ├── components/
│   │   ├── chat/          # Chat modal, messages
│   │   ├── search/        # Search input, buttons
│   │   └── ui/            # Shadcn UI components
│   ├── lib/
│   │   ├── api-client/    # Backend communication
│   │   └── chat-state/    # Conversation state management
│   ├── app/
│   │   ├── page.tsx       # Homepage with search
│   │   └── layout.tsx     # Root layout
│   └── styles/
│       └── globals.css    # Tailwind styles
└── tests/
    ├── integration/       # User flow tests
    └── unit/             # Component tests
```

**Structure Decision**: Option 2 (Web application) - Frontend + Backend separation for AI integration

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - AI SDK integration patterns with OpenAI API
   - OpenAI prompt engineering for IATA code handling
   - Chat modal UX patterns for complex data collection
   - Conversation state persistence strategies
   - Natural language parsing for travel queries via OpenAI
   - URL format validation for Paylater booking system

2. **Generate and dispatch research agents**:
   ```
   Task: "Research AI SDK integration patterns with OpenAI for chat interfaces"
   Task: "Research OpenAI prompt engineering for IATA airport code conversion"
   Task: "Research chat modal UX patterns for multi-step data collection"
   Task: "Find best practices for conversation state management in React"
   Task: "Research OpenAI function calling for structured travel data extraction"
   Task: "Analyze Paylater booking URL format and validation requirements"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all technical approaches validated

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Chat Conversation: user_id, session_id, messages[], status, search_params
   - Search Parameters: origin, destination, dates, passengers, cabin_class, trip_type
   - Destination Recommendation: category, destinations[], iata_codes[]
   - Validation rules: date >= 14 days, valid IATA codes, passenger limits

2. **Generate API contracts** from functional requirements:
   - POST /api/chat/start → Create conversation session
   - POST /api/chat/message → Send user message, get AI response
   - POST /api/chat/generate-url → Convert conversation to flight search URL
   - GET /api/destinations/recommendations → Get categorized destinations
   - Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - Chat session creation and message flow
   - URL generation with various trip types
   - IATA code validation and disambiguation
   - Date validation and error handling
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Direct search: "Europe trip" → guided conversation → search URL
   - Guided discovery: category selection → recommendations → search flow
   - Edge cases: invalid dates, ambiguous locations, unsupported destinations
   - Quickstart test = complete user journey validation

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh claude` for Claude Code
   - Add Next.js, AI SDK, Supabase, chat patterns
   - Preserve existing manual configurations
   - Update with flight search domain knowledge
   - Keep under 150 lines for efficiency
   - Output to CLAUDE.md in repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each API contract → contract test task [P]
- Each entity (Conversation, SearchParameters) → model creation task [P]
- Each user story → integration test task
- Chat modal components → UI implementation tasks [P]
- AI integration → chat-engine library tasks
- URL generation → url-generator library tasks

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: Models → Libraries → API → Frontend → Integration
- Backend libraries can run parallel [P]
- Frontend components can run parallel [P] after API contracts
- Integration tests depend on all components

**Estimated Output**: 28-32 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No violations identified - all within constitutional guidelines*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*