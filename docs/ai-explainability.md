# AI-Powered Explainability Layer

## Overview

The AI-powered explainability layer transforms deterministic hiring analysis explanations into human-friendly language. **Critical**: AI does NOT decide outcomes, scores, or probabilities. It only transforms existing explainability into clearer, more encouraging language.

## Architecture

### Components

1. **`ai/explainabilitySchemas.ts`**
   - Zod schemas for structured input/output
   - Ensures all AI inputs and outputs are validated and auditable
   - Defines boundaries: AI only receives deterministic data

2. **`ai/explainabilityPrompt.ts`**
   - Single, well-documented LLM prompt
   - Establishes AI boundaries and constraints
   - Prevents hallucinations and fact invention

3. **`ai/explainabilityClient.ts`**
   - Pure transport layer for LLM calls
   - Supports OpenAI, Anthropic, and custom providers
   - Handles JSON parsing and validation

4. **`ai/explainabilityEngine.ts`**
   - Converts deterministic explanations to AI input
   - Groups repeated risks to avoid repetitive explanations
   - Merges AI output back into final response
   - Graceful degradation if AI fails

5. **`routes/analyze.ts`** (modified)
   - Feature flag: `explainability_mode: "deterministic" | "ai"`
   - Default: `"deterministic"` (backward compatible)
   - If `"ai"`: Runs AI enhancement AFTER deterministic explainability

## Critical Boundaries

### What AI Does ✅

- Transforms deterministic summaries into human-friendly paragraphs
- Synthesizes key factors into clearer explanations
- Groups repetitive risks into concise lists
- Identifies what interviewers will probe (based on risk factors)
- Provides encouraging improvement outlook

### What AI Does NOT Do ❌

- Does NOT decide scores, probabilities, or outcomes
- Does NOT invent new risks, recommendations, or facts
- Does NOT change priorities or impact deltas
- Does NOT modify deterministic logic
- Does NOT create new recommendations

## Data Flow

```
Deterministic Scoring
    ↓
generateExplanations() → Deterministic Explanations
    ↓
[If explainability_mode === "ai"]
    ↓
enhanceExplanationsWithAI()
    ├─ Convert to AIExplainabilityInput
    ├─ Group repeated risks
    ├─ Call LLM (callExplainabilityLLM)
    └─ Merge AI output back
    ↓
Enhanced Explanations (deterministic + AI-enhanced language)
```

## Feature Flag

### Usage

```typescript
// Deterministic mode (default)
{
  "options": {
    "explainability_mode": "deterministic"
  }
}

// AI-enhanced mode
{
  "options": {
    "explainability_mode": "ai"
  }
}
```

### Behavior

- **`"deterministic"`** (default): Returns only deterministic explanations
- **`"ai"`**: Returns deterministic explanations enhanced with AI-generated language
- If AI fails: Gracefully degrades to deterministic explanations (no errors)

## Environment Variables

```bash
# Required for AI mode
AI_EXPLAINABILITY_API_KEY=your_api_key_here

# Optional (defaults shown)
AI_EXPLAINABILITY_PROVIDER=openai  # openai | anthropic | custom
AI_EXPLAINABILITY_MODEL=gpt-4o-mini
AI_EXPLAINABILITY_TEMPERATURE=0.3  # Low temperature for deterministic outputs
AI_EXPLAINABILITY_MAX_TOKENS=1000
AI_EXPLAINABILITY_BASE_URL=  # For custom providers
```

## AI Input Structure

```typescript
{
  stage_name: "ats" | "recruiter" | "interview" | "overall",
  score: number,  // Deterministic score (0-100) - AI must not change
  probability?: number,  // Deterministic probability (0-1) - AI must not change
  grouped_risk_factors: Array<{
    type: string,
    severity: "low" | "medium" | "high" | "critical",
    count: number,
    description: string,
    stage: string
  }>,
  recommendations: Array<{
    action: string,
    impact: string,
    reasoning: string,
    priority: "low" | "medium" | "high" | "critical",
    // ... (AI must not change priorities or deltas)
  }>,
  role_context: {
    role_level?: string,
    is_early_career: boolean
  },
  deterministic_summary: string,  // Original summary - AI enhances, doesn't replace
  key_factors: string[]  // From deterministic logic - AI synthesizes, doesn't invent
}
```

## AI Output Structure

```typescript
{
  summary_paragraph: string,  // Enhanced summary (human-friendly)
  interview_probe_points: string[],  // What interviewers will probe
  top_issues_to_fix: Array<{
    issue: string,
    why_it_matters: string,
    priority: "low" | "medium" | "high" | "critical"  // From recommendations
  }>,
  improvement_outlook: string  // Encouraging, professional outlook
}
```

## Merged Response Structure

When AI mode is enabled, the response includes both deterministic and AI-enhanced fields:

```typescript
{
  explanations: {
    stage_explanations: {
      ats: {
        summary: string,  // AI-enhanced summary (replaces deterministic)
        key_factors: string[],  // Original deterministic factors
        ai_enhanced: {  // NEW: AI-generated fields
          interview_probe_points: string[],
          top_issues_to_fix: Array<{...}>,
          improvement_outlook: string
        }
      },
      // ... (same for recruiter, interview, overall)
    },
    recommendations: [...]  // Original deterministic recommendations (unchanged)
  }
}
```

## Error Handling

### Graceful Degradation

If AI enhancement fails:
1. Error is logged (not exposed to user)
2. System continues with deterministic explanations
3. No breaking changes to API response
4. User still receives valid analysis

### Validation

- All AI inputs are validated via Zod schemas
- All AI outputs are validated via Zod schemas
- Invalid outputs cause graceful degradation (fallback to deterministic)

## Safety Guarantees

1. **Deterministic Logic is Source of Truth**
   - All scores, probabilities, and recommendations come from deterministic logic
   - AI only transforms language, not data

2. **Structured and Auditable**
   - All inputs/outputs are validated via Zod schemas
   - All AI calls are logged (via Fastify logger)
   - No black-box transformations

3. **No Breaking Changes**
   - Feature flag defaults to `"deterministic"`
   - AI mode is opt-in
   - API contract remains unchanged

4. **Interview-Defensible**
   - Can explain why AI made language choices
   - All transformations are based on deterministic data
   - No hidden logic or decisions

## Example Usage

### Request (AI Mode)

```json
{
  "resume": {...},
  "job_description": {...},
  "options": {
    "explainability_mode": "ai"
  }
}
```

### Response (Enhanced)

```json
{
  "explanations": {
    "stage_explanations": {
      "ats": {
        "summary": "Your resume shows strong ATS compatibility (85.0/100). The keyword match is excellent, and all required fields are present. This positions you well to pass automated screening systems.",
        "key_factors": [...],
        "ai_enhanced": {
          "interview_probe_points": [
            "How you measured the impact of your projects",
            "Specific technologies you used in your previous role"
          ],
          "top_issues_to_fix": [
            {
              "issue": "Add more specific metrics to achievements",
              "why_it_matters": "Quantifiable results demonstrate value and make claims defensible in interviews",
              "priority": "medium"
            }
          ],
          "improvement_outlook": "With your current ATS compatibility, you're well-positioned to pass automated screening. Focus on adding specific metrics to strengthen your interview readiness."
        }
      }
    }
  }
}
```

## Testing

### Manual Testing

1. **Deterministic Mode** (default):
   ```bash
   curl -X POST http://localhost:3001/api/v1/analyze \
     -H "Content-Type: application/json" \
     -d '{"resume": {...}, "job_description": {...}}'
   ```
   Should return deterministic explanations only.

2. **AI Mode**:
   ```bash
   curl -X POST http://localhost:3001/api/v1/analyze \
     -H "Content-Type: application/json" \
     -d '{"resume": {...}, "job_description": {...}, "options": {"explainability_mode": "ai"}}'
   ```
   Should return AI-enhanced explanations.

3. **AI Failure** (simulate by using invalid API key):
   Should gracefully degrade to deterministic explanations.

## Future Enhancements

- [ ] Add caching for AI responses (same deterministic input → same AI output)
- [ ] Add rate limiting for AI calls
- [ ] Add metrics for AI success/failure rates
- [ ] Support streaming responses for faster UX
- [ ] Add A/B testing framework for prompt improvements

## Conclusion

The AI-powered explainability layer provides human-friendly language transformations while maintaining strict boundaries:

- ✅ Deterministic logic remains source of truth
- ✅ AI only transforms language, not data
- ✅ All inputs/outputs are structured and auditable
- ✅ Graceful degradation ensures system reliability
- ✅ No breaking changes to API contracts

This makes HireLens AI more user-friendly while maintaining the trust and explainability required for hiring systems.

