# Research: AI-Powered Natural Language Flight Search

**Date**: 2025-09-09  
**Status**: Complete  
**Phase**: 0 - Outline & Research

## Executive Summary

Research conducted on six key technical areas for implementing an AI-powered conversational flight search system. All technical unknowns have been resolved with specific implementation recommendations.

## 1. AI SDK Integration Patterns with OpenAI API

### Decision: AI SDK v5 + OpenAI GPT-4 with Function Calling

**Rationale**:
- Native streaming support with `streamText()` and `toUIMessageStreamResponse()`
- Built-in type safety and message handling
- Function calling enables structured data extraction from natural language
- Edge runtime support for minimal latency (<200ms)

**Alternatives Considered**:
- Direct OpenAI API integration (more complex streaming implementation)
- Langchain (unnecessary abstraction layer for this use case)
- Anthropic Claude (excellent but OpenAI has better flight domain knowledge)

**Implementation Pattern**:
```typescript
// API Route (app/api/chat/route.ts)
export const runtime = 'edge';

const result = streamText({
  model: openai('gpt-4o'),
  system: `You are a friendly flight search assistant with comprehensive IATA airport code knowledge. 
  
  Common airports: JFK/LGA/EWR (NYC), LAX (LA), LHR/LGW/STN (London), CDG/ORY (Paris), 
  NRT/HND (Tokyo), SYD (Sydney), MEL (Melbourne), etc.
  
  Always convert locations to IATA codes and ask for clarification when multiple airports exist.`,
  messages,
  tools: {
    extractFlightInfo: { 
      /* structured flight parameter extraction with IATA validation */ 
    }
  }
});

return result.toUIMessageStreamResponse();
```

## 2. IATA Airport Code Data Sources and Validation

### Decision: OpenAI GPT-4 Only with Enhanced Prompt Engineering

**Rationale**:
- GPT-4 has comprehensive knowledge of IATA airport codes and global airports
- No external API dependencies reduces complexity and costs
- Seamless integration within existing AI conversation flow
- Natural disambiguation handling through conversational prompts
- Eliminates rate limiting, API failures, and caching complexity

**Alternatives Considered**:
- ICAO API + caching (adds complexity and external dependencies)
- Static airport databases (become stale, require maintenance)
- Multiple API sources (increases failure points and costs)

**Implementation Strategy**:
- Few-shot prompting with common airport code examples in system prompt
- Function calling for structured IATA code extraction
- Conversational disambiguation for multi-airport cities (NYC → JFK/LGA/EWR)
- Built-in validation and error handling within AI responses

## 3. Chat Modal UX Patterns for Multi-Step Data Collection

### Decision: Progressive Disclosure with Conversational State Persistence

**Rationale**:
- Users prefer guided conversation over complex forms
- Progressive disclosure reduces cognitive load
- State persistence allows interruption recovery
- Modal keeps users focused on search flow

**Alternatives Considered**:
- Full-page chat interface (breaks homepage flow)
- Traditional flight search forms (high abandonment rate)
- Multi-step wizard (less flexible than conversation)

**UX Pattern**:
- Modal opens immediately on "Let's go" click
- Conversational flow with friendly, empathetic tone
- Visual progress indicators for complex searches
- Option to switch to traditional form if needed

## 4. Conversation State Management in React

### Decision: Zustand + TanStack Query Hybrid Architecture

**Rationale**:
- Zustand handles UI state (current conversation step, modal visibility)
- TanStack Query manages server state (conversation history, caching)
- Optimistic updates for perceived performance
- Persistence support for session recovery

**Alternatives Considered**:
- Redux Toolkit (too complex for this use case)
- Pure TanStack Query (poor UI state management)
- Context API only (performance issues with frequent updates)

**State Structure**:
```typescript
// UI State (Zustand)
interface ChatState {
  currentStep: 'initial' | 'collecting' | 'confirming' | 'complete';
  flightParams: SearchParameters;
  generateSearchUrl: () => string;
}

// Server State (TanStack Query)
useConversation(conversationId) // Conversation history
useSaveConversation() // Persistence with optimistic updates
```

## 5. Natural Language Parsing for Travel Queries

### Decision: GPT-4 Function Calling with spaCy NER Fallback

**Rationale**:
- GPT-4 excels at understanding complex travel intent
- Function calling provides structured output
- spaCy NER fallback for cost efficiency on simple queries
- Custom training on ATIS dataset for domain-specific accuracy

**Alternatives Considered**:
- Pure rule-based parsing (brittle for natural language)
- Custom ML model (requires extensive training data)
- Other LLMs (GPT-4 has best travel domain knowledge)

**Processing Pipeline**:
1. Simple pattern matching (direct IATA codes, dates)
2. GPT-4 function calling for complex queries
3. spaCy NER fallback for cost-sensitive scenarios
4. Confidence scoring and disambiguation prompts

## 6. URL Format Validation for Paylater Booking System

### Decision: Zod Schema Validation with URL Builder Library

**Rationale**:
- Type-safe parameter validation at compile time
- Consistent URL format across all search types
- Easy testing and validation of generated URLs
- Support for return, one-way, and multi-city formats

**URL Patterns Analyzed**:
- Return: `/s/MEL/AKL/2025-10-08/2025-10-14?adults=1&children=0&infants=0&cabinClass=Y`
- One-way: `/s/MEL/AKL/2025-10-08?adults=1&children=0&infants=0&cabinClass=Y`
- Multi-city: `/s/[encoded-json-array]?passengers&cabin&tripType=multi-city`

**Validation Schema**:
```typescript
const SearchParamsSchema = z.object({
  origin: z.string().regex(/^[A-Z]{3}$/),
  destination: z.string().regex(/^[A-Z]{3}$/),
  departureDate: z.string().datetime().refine(date => 
    new Date(date) >= addDays(new Date(), 14)
  ),
  passengers: z.object({
    adults: z.number().min(1).max(9),
    children: z.number().min(0).max(8),
    infants: z.number().min(0).max(8)
  }),
  cabinClass: z.enum(['Y', 'S', 'C', 'F'])
});
```

## Performance Requirements Resolution

### Response Time Targets: <2 seconds for chat responses

**Implementation Strategy**:
- Edge runtime deployment (Vercel Edge Functions)
- Streaming responses start immediately
- Pre-computed airport data in CDN
- Redis caching for conversation state

### Concurrent User Support: 100+ simultaneous chats

**Scaling Strategy**:
- Stateless API design for horizontal scaling
- Connection pooling for database queries
- Rate limiting with exponential backoff
- Circuit breakers for external API failures

### Data Retention: 90 days for conversations

**Storage Strategy**:
- Supabase PostgreSQL with automatic archiving
- GDPR-compliant anonymous user IDs
- Configurable retention policies
- Export functionality for user data requests

## Architecture Validation

### Constitution Compliance Check
- **Projects**: 2 (frontend + backend) ✓ Within 3-project limit
- **Framework Usage**: Direct Next.js, no unnecessary abstractions ✓
- **Testing Strategy**: TDD with contract → integration → unit order ✓
- **Observability**: Structured logging with Datadog integration ✓

### Risk Assessment
- **API Dependency**: Mitigated with backup data sources
- **Cost Control**: Implemented with intelligent caching and fallbacks
- **Data Privacy**: Anonymous IDs and configurable retention
- **Performance**: Edge deployment and progressive enhancement

## Next Steps

Research phase complete. All technical unknowns resolved with specific implementation decisions. Ready to proceed to Phase 1: Design & Contracts.

**Ready for**: Data model design, API contract definition, and test scenario creation.