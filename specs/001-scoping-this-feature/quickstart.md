# Quickstart Guide: AI-Powered Natural Language Flight Search

**Date**: 2025-09-09  
**Status**: Complete  
**Phase**: 1 - Design & Contracts

## Overview

This guide provides step-by-step instructions for testing the complete AI-powered flight search system. Each scenario validates specific functional requirements and user stories from the specification.

## Prerequisites

- System deployed and running
- Test user account with anonymous ID
- Database seeded with destination recommendations
- AI service (OpenAI) configured and accessible

## Test Scenarios

### Scenario 1: Direct Natural Language Search (User Flow 1)

**Validates**: FR-001, FR-002, FR-003, FR-004, FR-011, FR-017

**Test Steps**:
1. Open homepage at `/`
2. Type in search box: "I want to go to Japan for two weeks in spring"
3. Click "Let's go" button
4. Verify chat modal opens with friendly greeting
5. Respond to AI questions about specific dates, passengers, airports
6. Confirm all parameters in final summary
7. Click "Search Flights" button
8. Verify redirect to correct Paylater booking URL

**Expected Results**:
- Chat modal opens immediately
- AI maintains friendly, empathetic tone throughout
- AI converts "Japan" to specific airport (NRT/HND with clarification)
- AI validates dates are at least 2 weeks away
- Final URL format: `https://app.paylatertravel.com.au/flightssearch/s/{ORIGIN}/{DESTINATION}/{DEPARTURE_DATE}/{RETURN_DATE}?adults=1&children=0&infants=0&cabinClass=Y`

**Sample Conversation Flow**:
```
AI: Hi! I can help you find flights to Japan. That sounds like an amazing trip! 
    When in spring are you thinking of traveling?

User: Maybe in April

AI: Perfect! April is a beautiful time to visit Japan with the cherry blossoms. 
    What dates work best for you? Remember, I need at least 2 weeks from today 
    to set up your Paylater payment plan.

User: April 15th to 29th

AI: Great choice! For Japan, which airport would you prefer to fly into - 
    Tokyo Narita (NRT) or Tokyo Haneda (HND)? Narita is the main international 
    hub while Haneda is closer to central Tokyo.

User: Narita sounds good

AI: Perfect! And where will you be departing from?

User: Sydney

AI: Excellent! Let me confirm your search:
    - From: Sydney (SYD)
    - To: Tokyo Narita (NRT)  
    - Departure: April 15, 2026
    - Return: April 29, 2026
    - Passengers: 1 adult
    - Cabin: Economy
    
    Does this look correct?

User: Yes

AI: Wonderful! Here's your personalized flight search. I've found the perfect 
    flights for your Japan adventure!
    
    [Search Flights Button - links to generated URL]
```

### Scenario 2: Guided Discovery Flow (User Flow 2)

**Validates**: FR-002, FR-016, FR-003, FR-011, FR-017

**Test Steps**:
1. Open homepage at `/`
2. Click "Let's help you figure it out"
3. Select category: "Island vibes"
4. Choose destination from recommendations
5. Complete guided conversation flow
6. Generate final search URL

**Expected Results**:
- Category options display correctly
- Destinations show with images and descriptions
- Chat modal opens after selection
- AI provides destination-specific recommendations
- Same URL generation as Scenario 1

### Scenario 3: Date Validation (Paylater Requirement)

**Validates**: FR-006, FR-007

**Test Steps**:
1. Start conversation: "I need to fly to Melbourne tomorrow"
2. Observe AI response about 2-week minimum
3. Provide date 1 week from today
4. Confirm AI explains Paylater payment plan requirement
5. Provide valid date (3 weeks from today)
6. Verify conversation continues normally

**Expected AI Response**:
```
AI: I'd love to help you get to Melbourne! However, with Paylater's payment plan, 
    you need to pay off your trip before you fly, so I can only search for flights 
    departing at least 2 weeks from today. This gives you time to complete your 
    payment schedule. What dates work for you that are after [DATE + 14 days]?
```

### Scenario 4: Airport Disambiguation

**Validates**: FR-005, FR-004

**Test Steps**:
1. Start conversation: "I want to fly to London"
2. Verify AI asks for airport clarification
3. Respond: "I don't know, which is best?"
4. Verify AI suggests most common option (Heathrow)
5. Continue with suggested airport

**Expected AI Response**:
```
AI: Great choice! London has several airports. Which would you prefer:
    - Heathrow (LHR) - Main international hub, excellent connections
    - Gatwick (LGW) - South of London, good budget airline options  
    - Stansted (STN) - Further out, mainly budget carriers
    
    If you're unsure, I'd recommend Heathrow as it has the most flight options 
    and best transport links to central London.
```

### Scenario 5: Multi-City Complex Trip

**Validates**: FR-010, FR-012, multi-city URL generation

**Test Steps**:
1. Start conversation: "I want to visit Bali, then Fiji, then home to Sydney"
2. Provide dates for each segment
3. Verify AI handles multi-city logic
4. Generate multi-city URL format

**Expected URL Format**:
```
https://app.paylatertravel.com.au/flightssearch/s/[{"originId":"SYD","destinationId":"DPS","departureDate":"2025-09-23"},{"originId":"DPS","destinationId":"NAN","departureDate":"2025-09-26"},{"originId":"NAN","destinationId":"SYD","departureDate":"2025-09-29"}]?adults=1&children=0&infants=0&cabinClass=Y&tripType=multi-city
```

### Scenario 6: Family Travel with Children

**Validates**: FR-008, passenger validation

**Test Steps**:
1. Start conversation: "Family trip to Disneyland with my 2 kids and baby"
2. Verify AI asks for specific ages
3. Provide: "Kids are 8 and 5, baby is 6 months"
4. Confirm AI categorizes correctly (2 adults, 2 children, 1 infant)
5. Check final URL has correct passenger counts

**Expected URL Parameters**:
```
?adults=2&children=2&infants=1&cabinClass=Y
```

### Scenario 7: Customer Support Handoff

**Validates**: FR-015

**Test Steps**:
1. Start conversation normally
2. Ask: "Can I speak to a human?"
3. Verify AI directs to Intercom button
4. Try variations: "customer service", "help", "support"

**Expected AI Response**:
```
AI: Of course! For personalized assistance from our travel experts, please use 
    the orange Intercom chat button at the bottom of this page. Our customer 
    support team can help with complex bookings, special requirements, or any 
    other questions you might have.
```

### Scenario 8: Cabin Class Selection

**Validates**: FR-009, IATA cabin codes

**Test Steps**:
1. Start conversation with business class preference
2. User: "I'd like to fly business class to Singapore"
3. Verify AI confirms cabin preference
4. Check final URL uses 'C' code for business class

**Expected URL Parameter**:
```
&cabinClass=C
```

## Performance Validation

### Response Time Test

**Validates**: Performance requirement <2 seconds

**Test Steps**:
1. Start 10 concurrent conversations
2. Measure time from message send to response start
3. Verify streaming begins within 2 seconds
4. Monitor full response completion time

**Acceptance Criteria**:
- First token < 2 seconds
- Complete response < 10 seconds
- No timeouts or errors

### Concurrent User Test

**Validates**: 100+ simultaneous users support

**Test Steps**:
1. Simulate 100 concurrent chat sessions
2. Monitor response times and error rates
3. Check database connection pool usage
4. Verify no degradation in response quality

## Error Handling Validation

### Network Error Recovery

**Test Steps**:
1. Start conversation
2. Disable network connection mid-conversation
3. Re-enable network
4. Verify conversation state recovery
5. Continue conversation normally

### Invalid Input Handling

**Test Cases**:
- Non-existent airports: "FLY to XYZZZ"
- Invalid dates: "February 30th"
- Nonsensical queries: "Purple elephant banana"

**Expected Behavior**:
- Graceful error messages
- Suggestions for correction
- Conversation continues without breaking

## Data Persistence Validation

### Conversation Recovery

**Test Steps**:
1. Start conversation, provide some details
2. Close browser tab
3. Return to same session/user ID
4. Verify conversation history preserved
5. Continue where left off

### URL Generation Persistence

**Test Steps**:
1. Complete full conversation flow
2. Generate search URL
3. Verify URL stored in database
4. Access conversation later
5. Confirm URL still available

## API Contract Validation

### OpenAPI Specification Compliance

**Test Steps**:
1. Run API contract tests against deployed endpoints
2. Validate request/response schemas
3. Check error response formats
4. Verify authentication requirements

**Tools**:
- Postman collection with all endpoints
- OpenAPI validator
- Automated contract test suite

## Completion Checklist

**Before marking system as ready**:
- [ ] All 8 user scenarios pass completely
- [ ] Performance targets met (response time, concurrency)
- [ ] Error handling graceful in all cases
- [ ] Data persistence working correctly
- [ ] API contracts validated
- [ ] Security measures in place
- [ ] Monitoring and logging operational

## Troubleshooting Common Issues

**Chat modal doesn't open**:
- Check JavaScript console for errors
- Verify API endpoints are accessible
- Confirm user_id generation working

**AI responses are slow**:
- Check OpenAI API key configuration
- Monitor API rate limits
- Verify edge function deployment

**URL generation fails**:
- Validate all required search parameters collected
- Check IATA code validation logic
- Confirm URL template formatting

**Database connections fail**:
- Verify Supabase connection string
- Check connection pool settings
- Monitor concurrent connection limits

This quickstart guide ensures comprehensive validation of all system components and user flows, confirming the AI-powered flight search system meets all functional and performance requirements.