/**
 * Auto-extracted prompt module: templates.en
 *
 * These are the long-form system prompts the chat edge function feeds to the
 * LLM. They were originally inlined in index.ts; splitting them out keeps the
 * handler readable and lets reviewers diff prompt changes in isolation.
 */
export const templatesEn: Record<string, string> = {
  "modern-prd": `
DOCUMENT TYPE: Product Requirements Document (PRD)
Use the following professional minimum structure with numbered requirements:

## 1. Executive Summary
- Problem Statement (the Problem, NOT the solution!)
- Vision and Goals (SMART criteria: Specific, Measurable, Achievable, Relevant, Time-bound)
- Business Value and KPIs

## 2. Stakeholders and Target Audience
- Stakeholder Analysis using the Onion Model:
  - System stakeholders (directly affected)
  - Environment stakeholders (indirectly affected)
  - Stakeholders from the wider context
- User Personas (if relevant)
- Assess stakeholder influence and motivation

## 3. System Context and Scope
- Describe context diagram (system in its environment)
- Clearly define system boundaries (What is inside? What is outside?)
- Interfaces to other systems
- Context assumptions (make them explicit!)

## 4. Functional Requirements
- Group by use cases or features
- Each requirement individually identifiable (ID scheme: FR-001, FR-002, ...)
- Requirements must be adequate, necessary, unambiguous, complete, understandable, and verifiable
- Avoid solution bias – describe WHAT, not HOW
- Use process verbs ("validate", "store", "calculate") instead of nominalizations
- FORMAT: Use a Markdown table with columns: | ID | Category | Description | Priority |

## 5. Quality Requirements (Non-Functional Requirements)
- Categorize per ISO 25010 (SQuaRE): Usability, Reliability, Performance, Security, Maintainability, Portability
- Include concrete metrics (e.g., "Response time < 2 seconds with 1000 concurrent users")
- Use quality scenarios: "WHEN [context] THEN the system SHALL [reaction] with [quality metric]"
- ID scheme: QR-001, QR-002, ...
- FORMAT: Use a Markdown table with columns: | ID | Category | Specification |

## 6. Constraints
- Technical constraints (e.g., "Must run on AWS EU region")
- Organizational constraints (e.g., "GDPR compliance required")
- Budget and time (if known)
- ID scheme: CON-001, CON-002, ...

## 7. Acceptance Criteria
- For each requirement: How is fulfillment verified?
- Define testable criteria (Gherkin syntax)

## 8. Risks and Dependencies
- Technical risks with probability and impact
- Dependencies on other projects/systems

## 9. Out of Scope
- Explicitly list what is NOT part of the project

## 10. Timeline and Milestones
- Phases and timeframes (if known)

QUALITY CRITERIA:
- No nominalizations: Instead of "execution of validation" → "System validates"
- Never "fast" or "user-friendly" – always measurable metrics
- Use consistent terminology throughout
- Every requirement must have an ID

SOCRATIC QUESTIONS FOR THIS TYPE:
1. "What problem should be solved (not which solution)?"
2. "Who are the stakeholders (directly affected, indirectly affected, wider context)?"
3. "What is in scope and what is explicitly out of scope?"
4. "What interfaces to other systems exist?"
5. "Which quality requirements are critical (Usability, Performance, Security, ...)?"
6. "What constraints (technical, organizational, legal) exist?"
7. "How is success measured (KPIs, Business Goals)?"
8. "Are there knockout criteria (Must-haves vs. Nice-to-haves)?"
`,

  "agile-user-story": `
DOCUMENT TYPE: Agile User Story
Use the 3C Model (Card, Conversation, Confirmation):

**Card:** Short description in format "As a [role] I want [functionality] so that [benefit/goal]"
**Conversation:** Reminder that details are clarified in conversation
**Confirmation:** Acceptance criteria as validation basis

TEMPLATE:
## Title: [Concise Title]

**As a** [Role/Persona]
**I want** [Functionality/Goal]
**so that** [Business Value/Benefit]

### Acceptance Criteria (Given-When-Then):
1. GIVEN [Context/Precondition]
   WHEN [Action]
   THEN [Expected Result]
2. ...

### Additional Details:
- **Wireframe/Mockup:** [Link or description]
- **Technical Notes:** [Constraints]
- **Dependencies:** [Story IDs]
- **Priority:** [MoSCoW: Must-have / Should-have / Could-have / Won't-have]

CHECK INVEST CRITERIA:
- **I**ndependent: Independent from other stories
- **N**egotiable: Negotiable, not set in stone
- **V**aluable: Delivers value for user or business
- **E**stimable: Effort estimation possible
- **S**mall: Small enough for one sprint
- **T**estable: Acceptance criteria are testable

If a story is NOT INVEST-compliant, provide hints and splitting suggestions:
- Split by workflow steps
- Split by business rules
- Split by CRUD operations
- Split by data variations
- Split by acceptance criteria

QUALITY CRITERIA:
- The "so that" is NOT optional – it shows the business value
- "As a user" is too generic → Use a concrete role or persona
- Each acceptance criterion must be binary verifiable (fulfilled/not fulfilled)
- One story = one sprint (or less)
- Focus on WHAT, not HOW

SOCRATIC QUESTIONS FOR THIS TYPE:
1. "Which role/persona performs this action?"
2. "What is the concrete business value (the 'so that')?"
3. "How is it verified that the story is successfully implemented (acceptance criteria)?"
4. "Are there dependencies to other stories?"
5. "Is the story small enough for one sprint?"
6. "How is the effort estimated (story points)?"
`,

  "feature-spec": `
DOCUMENT TYPE: Feature Specification
Detailed technical description of a feature with professional structure:

## 1. Feature Overview
- Feature Name and ID
- Brief Description (1-2 sentences)
- Business Value and Priority

## 2. User Stories or Use Cases
- Primary User Journeys
- Alternative Flows (Happy Path, Error Cases)

## 3. Functional Requirements
- Detailed description of functionality
- Input/Output specification
- Business Rules
- Validation rules
- Each requirement with ID (FR-001, ...)

## 4. UI/UX Specification
- Wireframes or mockups (if available)
- Interaction flows
- Accessibility requirements

## 5. Data Model
- Entities and attributes
- Relationships between entities
- Data validation and types

## 6. Quality Requirements
- Performance requirements (measurable!)
- Security requirements (authentication, authorization)
- Usability requirements

## 7. Interfaces
- API endpoints (method, URL, request/response formats)
- Integration with other systems
- Data formats (JSON, XML, etc.)

## 8. Error Handling
- Error scenarios
- User-facing error messages
- Logging and monitoring

## 9. Acceptance Criteria and Test Cases
- Functional test cases (Given-When-Then)
- Edge cases
- Performance test criteria

## 10. Open Issues and Risks
- Unresolved questions
- Technical risks
- Dependencies

QUALITY CRITERIA:
- Detailed enough for developers AND testers
- Specify API signatures, data types, formats exactly
- Cover all flows (Happy Path, Error Cases, Edge Cases)
- Every requirement traceable to a business goal or user story
- For every requirement, it's clear how it will be tested

SOCRATIC QUESTIONS FOR THIS TYPE:
1. "Which user journeys should the feature support?"
2. "What data is needed (entities, attributes, types)?"
3. "What business rules apply (validations, calculations)?"
4. "What interfaces to other systems exist?"
5. "What error scenarios need to be handled?"
6. "What do mockups/wireframes look like (if UI-relevant)?"
7. "What performance requirements exist (response time, throughput)?"
8. "What security requirements are relevant (auth, encryption, etc.)?"
`,

  "lastenheft-light": `
DOCUMENT TYPE: Requirements Specification (based on IEEE 830 / ISO 29148)
Use formal language and complete sentences:

## 1. Introduction
- Purpose of the document
- Scope
- Definitions, acronyms, abbreviations (glossary)
- References to other documents
- Document overview

## 2. General Description
- Product perspective (system context using onion model)
- Product functions (overview)
- User characteristics (personas, roles)
- Constraints
- Assumptions and dependencies

## 3. Specific Requirements
### 3.1 Functional Requirements
- Grouped by features or use cases
- Each requirement with ID (FR-001, FR-002, ...)
- Description, input, output, behavior
- Priority: Must / Should / Could

### 3.2 Quality Requirements
- Performance (response time, throughput, resource usage)
- Security (authentication, authorization, encryption)
- Reliability (MTBF, MTTR, availability)
- Usability (learning time, efficiency, error tolerance)
- Maintainability (testability, modifiability)
- Portability (platforms, browsers, devices)

### 3.3 Interfaces
- User interfaces (UI description, screen flows)
- Software interfaces (APIs, protocols)
- Communication interfaces

### 3.4 Data Requirements
- Data model (entities, relationships)
- Data formats
- Data migration (if relevant)

## 4. Appendices
- Glossary (if not in introduction)
- Analysis models
- Change history

QUALITY CRITERIA:
- Completeness: All relevant requirements captured
- Consistency: No contradictory requirements
- Unambiguity: Each requirement has only one interpretation
- Understandability: Readable for less technical stakeholders
- Verifiability: Each requirement can be tested
- Traceability: Each requirement with unique ID
- No solution description: WHAT, not HOW (solution belongs in the design document)

SOCRATIC QUESTIONS FOR THIS TYPE:
1. "Who is the client/customer?"
2. "What is the scope of the system?"
3. "Which stakeholders are affected (onion model)?"
4. "What functional requirements exist (grouped by features)?"
5. "Which quality requirements are critical (performance, security, usability)?"
6. "What interfaces to other systems exist?"
7. "What constraints must be observed?"
8. "What assumptions about the environment are being made?"
9. "Are there legal or compliance requirements?"
10. "How is success measured (acceptance criteria)?"
`,

  "sdd-spec": `
DOCUMENT TYPE: Specification-Driven Development (SDD)
The specification must serve as "Single Source of Truth" for test-driven development. It must be detailed enough for a developer or AI coding tool to implement directly:

## 1. Feature Overview
- Feature Name and ID
- Business Value
- Priority

## 2. Behavior Specification (BDD-Style)
- Format: Given-When-Then (Gherkin-style)
- Concrete scenarios for Happy Path, Error Cases, Edge Cases
- Example:
  GIVEN a logged-in user with role "Admin"
  WHEN they access the user list
  THEN they see all users with name, email, and role

## 3. Acceptance Criteria (Formal)
- For each scenario: Precise definition of input, output, state changes
- Expected behavior for edge cases

## 4. Data Specifications
- Data model with exact types
- Validation rules (e.g., "Email must be RFC 5322 compliant")
- Example data for tests

## 5. API Contract (if relevant)
- Endpoints (URL, HTTP method)
- Request format (JSON Schema)
- Response format (JSON Schema)
- Error codes and error messages
- Example requests and responses

## 6. State Transitions
- State machine diagram (if state-based)
- Transitions: Event → Action → New State

## 7. Non-Functional Requirements (Measurable)
- Performance: "API response < 200ms for 95% of requests"
- Security: "Passwords must be hashed with bcrypt (cost factor 12)"
- Availability: "99.9% uptime (SLA)"

## 8. Test Strategy
- Unit test coverage: "Min. 80% code coverage"
- Integration test scenarios
- E2E test scenarios

QUALITY CRITERIA:
- Executable Specifications: Scenarios directly convertible to automated tests
- Precision: No room for interpretation (exact data types, formats)
- Completeness: All scenarios (Happy Path, Error Cases, Edge Cases) covered
- Example-based: Concrete examples instead of abstract descriptions
- Living Documentation: Specification stays in sync with code

SOCRATIC QUESTIONS FOR THIS TYPE:
1. "What scenarios should the feature cover (Happy Path, Error Cases, Edge Cases)?"
2. "What data types and validations are required?"
3. "What API endpoints are needed (method, URL, request/response)?"
4. "What state transitions exist (for state-based systems)?"
5. "What measurable quality requirements apply (performance, security)?"
6. "What does example data for tests look like?"
7. "What test strategy is being pursued (unit, integration, E2E)?"
8. "What error codes and error messages should be used?"
`,

  "competitive-analysis": `
DOCUMENT TYPE: Competitive Analysis
Create a structured competitive analysis:

## 1. Market Overview
- Market size and growth
- Market segments and trends

## 2. Competitor Overview
- Direct competitors (same target audience, same problem)
- Indirect competitors (alternative solutions)
- Potential competitors (possible market entry)

## 3. Feature Comparison Matrix
FORMAT: Markdown table: | Feature | Own Product | Competitor A | Competitor B |
Rating: ✅ Available | ⚠️ Partial | ❌ Missing

## 4. SWOT Analysis
| | Positive | Negative |
|---|---|---|
| Internal | Strengths | Weaknesses |
| External | Opportunities | Threats |

## 5. Positioning & Differentiation
- USP (Unique Selling Proposition)
- Value proposition vs. competition
- Price positioning

## 6. Strategic Recommendations
- Short-term actions (0-3 months)
- Mid-term strategy (3-12 months)
- Long-term vision

SOCRATIC QUESTIONS:
1. "What product or idea should be analyzed?"
2. "Who are the main competitors?"
3. "What is the core problem being solved?"
4. "What target audience is being addressed?"
5. "What is the current state of your product?"
`,

  "product-roadmap": `
DOCUMENT TYPE: Product Roadmap

## 1. Product Vision & Strategy
- Long-term vision (2-3 years)
- Strategic goals (SMART)
- Strategic pillars/themes

## 2. Now (Current – 0-3 months)
| Initiative | Goal | Status | Owner |
|---|---|---|---|

## 3. Next (Planned – 3-6 months)
| Initiative | Goal | Dependencies | Priority |
|---|---|---|---|

## 4. Later (Future – 6-12 months)
| Initiative | Hypothesis | Validation Needed |
|---|---|---|

## 5. Prioritization Framework
- RICE Score or WSJF for each initiative
- MoSCoW categorization

## 6. Milestones & Releases
## 7. Risks & Dependencies

SOCRATIC QUESTIONS:
1. "What is the product vision?"
2. "What strategic goals are you pursuing?"
3. "What are the key initiatives/features?"
4. "What dependencies exist between features?"
5. "What resources are available?"
`,

  "press-release": `
DOCUMENT TYPE: Press Release (Working Backwards – Amazon Method)

## Headline
## Subheadline
## Introduction (Paragraph 1)
## Problem
## Solution
## Customer Quote (fictional)
## How It Works
## Leadership Quote
## Call to Action
## FAQ (Internal)

SOCRATIC QUESTIONS:
1. "What is the product idea in one sentence?"
2. "Who is the ideal customer?"
3. "What problem is being solved?"
4. "Why is now the right time?"
5. "What differentiates from alternatives?"
`,

  "one-pager": `
DOCUMENT TYPE: 1-Pager (Executive Summary)

## Product Name
## Problem
## Solution
## Target Audience
## Market Size
## Competition & Differentiation
## Business Model
## Key Metrics / KPIs
## Next Steps
## Ask / Needs

SOCRATIC QUESTIONS:
1. "What is the core idea in one sentence?"
2. "What problem do you solve?"
3. "Who pays for it and why?"
4. "What is the biggest unknown/risk?"
`,

  "go-to-market": `
DOCUMENT TYPE: Go-to-Market Strategy

## 1. Product Overview
## 2. Target Market & Segmentation
## 3. Positioning & Messaging
## 4. Pricing Model
## 5. Distribution Channels
## 6. Marketing Plan
## 7. Launch Timeline
## 8. Success Metrics

SOCRATIC QUESTIONS:
1. "What is being launched?"
2. "Who is the ideal first customer?"
3. "What does the customer buying process look like?"
4. "What channels does the target audience use?"
5. "What is the budget?"
`,

  "technical-spec": `
DOCUMENT TYPE: Technical Specification

## 1. Overview
## 2. Architecture
## 3. Data Model
## 4. API Design
## 5. Security
## 6. Performance
## 7. Implementation Plan
## 8. Test Plan

SOCRATIC QUESTIONS:
1. "What needs to be technically implemented?"
2. "What tech stack is being used?"
3. "What existing systems need integration?"
4. "What are the performance requirements?"
5. "What security requirements exist?"
`,

  "launch-plan": `
DOCUMENT TYPE: Launch Plan

## 1. Launch Overview
## 2. Pre-Launch Checklist
## 3. Launch-Day Plan
## 4. Rollback Plan
## 5. Post-Launch Monitoring
## 6. Post-Launch Review

SOCRATIC QUESTIONS:
1. "What is being launched?"
2. "When is the planned launch date?"
3. "What teams are involved?"
4. "What are the most critical risks?"
5. "What are the go/no-go criteria?"
`,

  "okr-template": `
DOCUMENT TYPE: OKR (Objectives & Key Results)

## Period: [Q1/Q2/Q3/Q4 YYYY]
### Objective 1-3 with Key Results (max 3-5 each)
## Alignment
## Retrospective

RULES FOR GOOD OKRs:
- Objectives: Qualitative, inspiring, ambitious (70% achievement = good)
- Key Results: Quantitative, measurable, time-bound
- Max 3-5 Objectives per quarter
- No activities as Key Results (Output ≠ Outcome)

SOCRATIC QUESTIONS:
1. "What time period?"
2. "What are the overarching company goals?"
3. "What are the key challenges?"
4. "What metrics are currently being tracked?"
5. "What would be an ambitious but achievable goal?"
`,

  "stakeholder-map": `
DOCUMENT TYPE: Stakeholder Map & Analysis

## 1. Stakeholder Identification (Onion Model)
## 2. Stakeholder Matrix (Influence × Interest)
## 3. Stakeholder Profiles
## 4. Communication Plan
## 5. Engagement Strategy
## 6. Conflicts & Risks

SOCRATIC QUESTIONS:
1. "What project/product is this about?"
2. "Who are the obvious stakeholders?"
3. "Who might be indirectly affected?"
4. "Are there known conflicts or resistance?"
5. "How is communication with stakeholders currently handled?"
`,
};
