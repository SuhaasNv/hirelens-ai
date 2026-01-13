# Frontend AI Explainability Integration

## Overview

The frontend has been updated to render AI-enhanced explanations when available, while preserving deterministic explanations as a fallback.

## Changes Made

### 1. TypeScript Types Updated

**File**: `frontend/lib/types.ts`

- Added `ai_enhanced` optional field to all stage explanations (`ats`, `recruiter`, `interview`, `overall`)
- `ai_enhanced` includes:
  - `interview_probe_points`: Array of strings (what interviewers will probe)
  - `top_issues_to_fix`: Array of prioritized issues with explanations
  - `improvement_outlook`: Encouraging outlook string

### 2. StageExplanationCard Component Enhanced

**File**: `frontend/components/StageExplanationCard.tsx`

**Changes**:
- Added optional `aiEnhanced` prop
- Conditional rendering: AI-enhanced sections only render when `aiEnhanced` exists
- Deterministic fallback: When `aiEnhanced` is undefined, renders exactly as before

**Rendering Logic**:
- **Summary**: Backend replaces deterministic summary with AI-enhanced summary when AI is enabled, so frontend just uses `summary` field directly
- **Key Factors**: Always shows deterministic key factors (for audit transparency)
- **Interview Probe Points**: New section (only when AI-enhanced)
- **Top Issues to Fix**: New prioritized section (only when AI-enhanced)
- **Improvement Outlook**: New encouraging outlook section (only when AI-enhanced)

### 3. Results Page Updated

**File**: `frontend/app/results/page.tsx`

**Changes**:
- Passes `ai_enhanced` prop to each `StageExplanationCard`
- No conditional logic needed - component handles AI vs deterministic rendering internally

## Rendering Behavior

### When AI-Enhanced Data Exists (`explainability_mode="ai"`)

**Summary**:
- Uses AI-enhanced summary (more human-friendly language)
- Example: "Your resume shows strong ATS compatibility (85.0/100), positioning you well to pass automated screening systems."

**Key Factors**:
- Still shows deterministic key factors (for transparency)

**New Sections**:
- **Interview Probe Points**: "What Interviewers Will Probe" section with bullet points
- **Top Issues to Fix**: Prioritized issues with priority badges and explanations
- **Improvement Outlook**: Encouraging outlook in a highlighted box

### When AI-Enhanced Data Does NOT Exist (`explainability_mode="deterministic"`)

**Summary**:
- Uses deterministic summary
- Example: "ATS compatibility is strong (85.0/100). Resume likely to pass ATS screening."

**Key Factors**:
- Shows deterministic key factors

**No AI Sections**:
- Interview probe points section: Not rendered
- Top issues to fix section: Not rendered
- Improvement outlook section: Not rendered

## Visual Design

### AI-Enhanced Sections Styling

- **Interview Probe Points**: Blue arrow bullets (→) with slate-300 text
- **Top Issues to Fix**: 
  - Priority badges with color coding (critical=red, high=orange, medium=amber, low=slate)
  - Issue text in white
  - "Why it matters" in slate-400 with left border accent
- **Improvement Outlook**: Highlighted box with emerald accent icon, slate-300 text

### Deterministic Sections (Always Visible)

- **Key Factors**: Standard bullet points (•) in slate-400
- Maintains audit transparency

## Verification

### Test Case 1: AI Mode Enabled

**Request**:
```json
{
  "options": {
    "explainability_mode": "ai"
  }
}
```

**Expected**:
- ✅ Summary uses human-friendly language
- ✅ Interview probe points section visible
- ✅ Top issues to fix section visible
- ✅ Improvement outlook section visible
- ✅ Key factors still visible (deterministic)

### Test Case 2: Deterministic Mode (Default)

**Request**:
```json
{
  "options": {
    "explainability_mode": "deterministic"
  }
}
```

**Expected**:
- ✅ Summary uses deterministic language
- ✅ No interview probe points section
- ✅ No top issues to fix section
- ✅ No improvement outlook section
- ✅ Key factors visible (deterministic)

### Test Case 3: AI Fails (Graceful Fallback)

**Scenario**: API key invalid or Gemini fails

**Expected**:
- ✅ Request succeeds (200 OK)
- ✅ Response contains deterministic explanations only
- ✅ Frontend renders exactly like Test Case 2
- ✅ No visual errors or broken UI

## Zero Visual Regression

When `ai_enhanced` is not present:
- Component renders identically to previous version
- No layout shifts
- No missing sections
- No broken styling

## Code Quality

- ✅ No new state management
- ✅ No feature flags
- ✅ Minimal conditional rendering
- ✅ Clear inline comments
- ✅ Type-safe (TypeScript)
- ✅ No duplicate components

## Summary

The frontend now:
1. **Prefers AI-enhanced explanations** when `ai_enhanced` exists
2. **Falls back gracefully** to deterministic explanations when AI is disabled or fails
3. **Maintains audit transparency** by always showing deterministic key factors
4. **Provides richer UX** with interview probe points, prioritized issues, and improvement outlook when AI is enabled
5. **Zero visual regression** when AI is disabled

All changes are backward-compatible and maintain the existing API contract.

