# ai-chat-to-search Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-09

## Active Technologies
- **Language**: TypeScript/JavaScript (Next.js 15, React 19)
- **AI Integration**: AI SDK v5 + OpenAI GPT-4 + Langchain
- **Styling**: Tailwind CSS v5 + Shadcn UI
- **Data**: Supabase PostgreSQL + React Query  
- **Testing**: Jest + React Testing Library + Vitest
- **Deployment**: Vercel Edge Functions
- **Storage**: Supabase + Redis caching
- **Project Type**: Web application (frontend + backend)

## Project Structure
```
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

backend/
├── src/
│   ├── lib/
│   │   ├── chat-engine/   # AI conversation management
│   │   ├── flight-parser/ # Natural language processing
│   │   └── url-generator/ # Flight URL construction
│   ├── api/
│   │   ├── chat/          # Chat API endpoints
│   │   └── health/        # System health
│   └── models/
│       └── conversation.ts # Chat data models

tests/
├── contract/              # API contract tests
├── integration/           # Cross-service tests  
└── unit/                 # Component/library tests
```

## Key Libraries
- **chat-engine**: Core AI conversation logic with OpenAI integration
  - CLI: `--test-conversation`, `--debug-prompts`
- **flight-parser**: Natural language → IATA/date parsing
  - CLI: `--parse-query`, `--validate-codes`  
- **url-generator**: Flight search URL construction for Paylater system
  - CLI: `--generate-url`, `--validate-format`

## Commands  
```bash
# Development
npm run dev          # Start development servers
npm run build        # Build production bundle
npm run test         # Run all tests (TDD required)

# Library testing
npm run test:chat-engine    # Test AI conversation logic
npm run test:flight-parser  # Test NLP parsing
npm run test:url-generator  # Test URL generation

# Type checking  
npm run type-check   # TypeScript validation

# Database
npm run db:migrate   # Run Supabase migrations
npm run db:seed      # Seed destination recommendations
```

## Code Style
- **Testing**: RED-GREEN-Refactor cycle enforced (tests MUST fail first)
- **Validation**: Zod schemas for all data structures
- **State Management**: Zustand (UI state) + TanStack Query (server state)
- **Error Handling**: Exponential backoff, graceful degradation
- **Performance**: Edge runtime, streaming responses, optimistic updates
- **Types**: Strict TypeScript, no any types allowed

## Flight Search Domain Rules
- **IATA Codes**: 3-letter airport codes (JFK, LAX, LHR)
- **Date Validation**: Minimum 14 days from today (Paylater requirement)
- **Passenger Categories**: Adults (1-9), Children 2-11 (0-8), Infants <2 (0-8)
- **Cabin Classes**: Y=Economy, S=Premium, C=Business, F=First
- **Trip Types**: return, oneway, multicity
- **URL Format**: `https://app.paylatertravel.com.au/flightssearch/s/{route}?{params}`

## AI Conversation Guidelines
- **Persona**: Friendly, empathetic, enthusiastic travel assistant
- **Clarification**: Always ask for disambiguation (London → LHR/LGW/STN)
- **Validation**: Explain Paylater 2-week rule when dates too soon
- **Support Handoff**: Direct to orange Intercom button for human help
- **Error Recovery**: Graceful handling with suggestion alternatives

## Recent Changes
- 001-scoping-this-feature: Added AI-powered natural language flight search with conversational UI, IATA validation, and URL generation

<!-- MANUAL ADDITIONS START -->
<!-- Add any manual configuration, custom commands, or project-specific notes here -->
<!-- MANUAL ADDITIONS END -->