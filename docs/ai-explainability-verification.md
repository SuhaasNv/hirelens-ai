# AI Explainability Verification Guide

## Overview

This guide verifies that the AI explainability layer works correctly with Google Gemini (free tier).

## Prerequisites

1. **Backend server running**: `npm run dev` in `backend/` directory
2. **Environment variables set**:
   ```bash
   export AI_EXPLAINABILITY_PROVIDER=gemini
   export AI_EXPLAINABILITY_API_KEY=your_gemini_api_key_here
   export AI_EXPLAINABILITY_MODEL=gemini-1.5-flash  # Optional, defaults to this
   export AI_EXPLAINABILITY_TEMPERATURE=0.3  # Optional
   export AI_EXPLAINABILITY_MAX_TOKENS=1000  # Optional
   ```

3. **Get Gemini API Key**:
   - Visit: https://makersuite.google.com/app/apikey
   - Create a free API key
   - Free tier includes 15 requests per minute

## Running Verification

### Option 1: Automated Verification Script

```bash
cd backend
tsx verify-ai-explainability.ts
```

This script will:
- Make a test request with `explainability_mode="ai"`
- Compare deterministic vs AI-enhanced outputs
- Verify scores/probabilities are identical
- Check for hallucinations
- Test graceful fallback
- Generate a verification report

### Option 2: Manual API Test

```bash
curl -X POST http://localhost:3001/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "resume": {
      "file_content": "BASE64_ENCODED_RESUME",
      "file_format": "txt",
      "file_name": "test.txt"
    },
    "job_description": {
      "job_description_text": "Software Engineer position..."
    },
    "options": {
      "explainability_mode": "ai"
    }
  }'
```

## Verification Checkpoints

### 1. Logs to Check

The backend logs will show:

```
[INFO] Explainability mode selected { mode: 'ai', analysis_id: '...' }
[INFO] AI explainability client invoked { provider: 'gemini', model: 'gemini-1.5-flash', stage: 'ats', has_api_key: true }
[INFO] AI explainability output validated successfully { provider: 'gemini', model: 'gemini-1.5-flash', stage: 'ats', has_summary: true, probe_points_count: 2, issues_count: 3 }
[INFO] AI explainability enhanced stage: ats { stage: 'ats', summary_length: 245, probe_points_count: 2, issues_count: 3 }
[INFO] AI explainability enhancement completed { stages_successful: 4, stages_failed: 0, total_stages: 4, used_fallback: false }
[INFO] AI explainability enhancement completed successfully { analysis_id: '...', scores_unchanged: true, probabilities_unchanged: true, recommendations_count: 5, has_ai_enhanced: true }
```

### 2. Response Structure

**Deterministic Mode** (`explainability_mode="deterministic"`):
```json
{
  "explanations": {
    "stage_explanations": {
      "ats": {
        "summary": "ATS compatibility is strong (85.0/100)...",
        "key_factors": [...]
      }
    }
  }
}
```

**AI-Enhanced Mode** (`explainability_mode="ai"`):
```json
{
  "explanations": {
    "stage_explanations": {
      "ats": {
        "summary": "Your resume shows strong ATS compatibility...",  // AI-enhanced
        "key_factors": [...],  // Original deterministic
        "ai_enhanced": {  // NEW: AI-generated fields
          "interview_probe_points": [
            "How you measured project impact",
            "Specific technologies used"
          ],
          "top_issues_to_fix": [
            {
              "issue": "Add more specific metrics",
              "why_it_matters": "Quantifiable results demonstrate value",
              "priority": "medium"
            }
          ],
          "improvement_outlook": "With your current ATS compatibility..."
        }
      }
    }
  }
}
```

### 3. Critical Verifications

#### ✅ Scores Must Be Identical

Compare scores between deterministic and AI modes:
- `scores.ats.compatibility_score` - MUST be identical
- `scores.recruiter.evaluation_score` - MUST be identical
- `scores.interview.readiness_score` - MUST be identical
- `scores.overall.overall_score` - MUST be identical

#### ✅ Probabilities Must Be Identical

Compare probabilities:
- `scores.ats.advancement_probability` - MUST be identical
- `scores.recruiter.advancement_probability` - MUST be identical
- `scores.interview.advancement_probability` - MUST be identical
- `scores.overall.overall_hiring_probability` - MUST be identical

#### ✅ No Hallucinations

AI should NOT:
- Invent new risk factors not in deterministic output
- Create new recommendations not in deterministic output
- Change priorities or impact deltas
- Add metrics or facts not in input

#### ✅ Only Language Differs

Compare summaries:
- **Deterministic**: "ATS compatibility is strong (85.0/100). Resume likely to pass ATS screening."
- **AI-Enhanced**: "Your resume shows strong ATS compatibility (85.0/100), positioning you well to pass automated screening systems."

The score (85.0) is identical, but language is more human-friendly.

### 4. Graceful Fallback Test

To test fallback, temporarily set an invalid API key:

```bash
export AI_EXPLAINABILITY_API_KEY=invalid_key
```

Expected behavior:
- Request should still succeed
- Response should contain deterministic explanations only
- Logs should show: `"AI explainability enhancement failed, using deterministic explanations"`
- No user-facing error

## Expected Verification Report

```
📊 VERIFICATION REPORT
============================================================

Was Gemini actually used?        YES
Was output AI-enhanced?          YES
Did fallback trigger?            NO
Scores identical?               YES
Probabilities identical?         YES
No hallucinations detected?      YES

Free-tier limitations observed:
  • None (or specific limitations if any)

============================================================
✅ VERIFICATION PASSED
```

## Free-Tier Limitations (Gemini)

### Known Limitations

1. **Rate Limiting**: 15 requests per minute (free tier)
   - If exceeded, API returns 429 error
   - System gracefully falls back to deterministic

2. **Latency**: May be slower than paid tiers
   - Typical: 2-5 seconds per stage
   - Total: 8-20 seconds for all 4 stages

3. **Token Limits**: Free tier has lower token limits
   - Default: 1000 max tokens
   - May truncate very long responses

4. **Safety Filters**: Gemini may block some content
   - If blocked, `finishReason` will be `SAFETY`
   - System gracefully falls back

### Monitoring Free-Tier Usage

Check logs for:
- `"AI explainability client invoked"` - Shows provider/model
- `"AI explainability output validated successfully"` - Shows validation passed
- `"AI explainability enhancement completed"` - Shows success/failure counts
- `"used_fallback: true"` - Indicates fallback was triggered

## Troubleshooting

### Issue: "AI_EXPLAINABILITY_API_KEY environment variable is required"

**Solution**: Set the environment variable:
```bash
export AI_EXPLAINABILITY_API_KEY=your_key_here
```

### Issue: "Gemini API error: 429 Too Many Requests"

**Solution**: Rate limit exceeded. Wait 1 minute and retry, or upgrade to paid tier.

### Issue: "LLM output validation failed"

**Solution**: Gemini returned invalid JSON. Check logs for response preview. This should be rare with `responseMimeType: "application/json"`.

### Issue: No AI-enhanced fields in response

**Possible causes**:
1. API key not set → Falls back to deterministic
2. API call failed → Falls back to deterministic
3. Validation failed → Falls back to deterministic

**Check logs** for specific error messages.

## Success Criteria

✅ **Verification passes if**:
- Gemini provider is used (logs show `provider: 'gemini'`)
- AI-enhanced fields are present in response
- Scores and probabilities are identical to deterministic mode
- No hallucinations (no new facts/metrics)
- Graceful fallback works when API fails
- Response is concise and human-readable

## Next Steps

After verification:
1. Monitor production logs for AI explainability usage
2. Track success/failure rates
3. Monitor free-tier quota usage
4. Consider caching AI responses for same inputs
5. Set up alerts for high failure rates

