# Role-Level Calibration in HireLens AI

## Overview

HireLens AI now implements **role-level calibration** to accurately reflect real-world hiring behavior across different experience levels. This ensures that entry-level, intern, and APM candidates are evaluated with appropriate expectations, while senior roles maintain higher standards.

## Why Role-Level Calibration Matters

### The Problem

Without calibration, strong early-career candidates are often under-scored because:

1. **Missing KPIs**: Entry-level candidates rarely have revenue impact metrics, but the system penalized them as if they should.
2. **Missing Nice-to-Haves**: Skills listed as "nice-to-have" in job descriptions were penalized equally for all roles, even though entry-level roles are learning opportunities.
3. **Transferable Experience**: College projects, internships, and side projects were treated as weak substitutes rather than positive signals of potential.
4. **Compounding Penalties**: Multiple minor issues could collapse overall hiring probability unfairly.

### The Solution

Role-level calibration adjusts:
- **Penalty weights**: How much missing items cost
- **Signal weights**: How much different signals contribute
- **Probability floors**: Minimum probabilities for strong candidates

## How Entry-Level Calibration Differs from Senior Roles

### Entry-Level Roles (Entry, Intern, APM)

**Philosophy**: Evaluate potential, learning velocity, and transferable skills.

#### Penalty Reductions

| Missing Item | Entry-Level Penalty | Senior-Level Penalty | Rationale |
|-------------|---------------------|---------------------|------------|
| Revenue KPIs | 20% of standard | 100% of standard | Entry-level candidates rarely have revenue impact yet |
| Nice-to-Have Skills | 30% of standard | 100% of standard | Nice-to-haves are learning opportunities for entry-level |
| Years of Experience | 40% of standard | 100% of standard | Less experience is expected for entry-level |
| Vague Claims | 50% of standard | 100% of standard | Less polished resumes are normal for entry-level |

#### Signal Weight Increases

| Signal Type | Entry-Level Weight | Senior-Level Weight | Rationale |
|------------|-------------------|---------------------|------------|
| Transferable Skills | 1.5x (50% increase) | 1.0x (standard) | College projects, internships count positively |
| Learning Velocity | 1.6x (60% increase) | 0.9x (slight reduction) | Ability to learn quickly is critical for entry-level |
| Ownership Signals | 1.4x (40% increase) | 1.0x (standard) | Ownership even in small scope matters |
| Direct Match | 0.9x (10% reduction) | 1.1x (slight increase) | Direct match less critical than potential for entry-level |

#### Probability Floor

- **Entry-Level**: 25% minimum probability when:
  - ATS pass probability ≥ 0.75
  - Recruiter signal strength ≥ medium (evaluation score ≥ 50)
  
  **Rationale**: Strong early-career candidates (who pass ATS and show promise to recruiters) should not have their probability collapsed by minor interview readiness issues. This matches how real recruiters evaluate: if ATS and recruiter both pass, interview is more about fit than absolute readiness.

### Senior Roles (Senior, Staff, Principal, Executive)

**Philosophy**: Evaluate proven track record, domain expertise, and impact.

#### Full Penalties

- **Revenue KPIs**: Full penalty (100%) - proven impact is required
- **Nice-to-Have Skills**: Full penalty (100%) - expertise expected
- **Years of Experience**: Full penalty (100%) - experience is critical
- **Vague Claims**: Full penalty (100%) - polished claims required

#### Standard Weights

- **Direct Match**: 1.1x (slight increase) - direct experience preferred
- **Transferable Skills**: 1.0x (standard) - direct experience preferred
- **Learning Velocity**: 0.9x (slight reduction) - proven ability > potential

#### Lower Probability Floor

- **Senior-Level**: 10% minimum probability
- **Rationale**: Higher standards for senior roles; probability floor is lower

## Signal Type Classification

HireLens now distinguishes between three signal types:

### 1. Direct Signals
- **Definition**: Exact JD match (keyword appears in resume in professional context)
- **Weight**: Full weight (1.0x)
- **Example**: Job requires "React", resume shows "Built React applications at Company X"

### 2. Transferable Signals
- **Definition**: Proxy experience (relevant skills from different contexts)
- **Weight**: 60% of direct for entry-level, 0% for senior (treated as missing)
- **Example**: Job requires "React", resume shows "Built React project in college hackathon"
- **Entry-Level Treatment**: Positively weighted (1.5x multiplier)
- **Senior Treatment**: Not counted (direct experience required)

### 3. Potential Signals
- **Definition**: Initiative, leadership, learning velocity
- **Weight**: Boost for entry-level, neutral for senior
- **Example**: "Learned React in 2 weeks" (learning velocity), "Led team of 5" (leadership)
- **Entry-Level Treatment**: 1.6x multiplier for learning velocity, 1.4x for ownership
- **Senior Treatment**: Standard weight (proven ability > potential)

## Asymmetric Penalties

### Missing Nice-to-Haves

**Entry-Level**:
- Missing nice-to-have skills: 30% penalty (70% reduction)
- Rationale: These are learning opportunities, not requirements

**Senior**:
- Missing nice-to-have skills: 100% penalty (full penalty)
- Rationale: Expertise expected at senior level

### Missing Revenue KPIs

**Entry-Level**:
- Missing revenue KPIs: 20% penalty (80% reduction)
- Rationale: Entry-level candidates rarely have revenue impact yet
- Explicitly stated in explanations: "Lack of revenue KPIs not penalized for entry-level role"

**Senior**:
- Missing revenue KPIs: 100% penalty (full penalty)
- Rationale: Proven impact is required for senior roles

## Probability Dampening Guards

### Purpose

Prevent compounding penalties from collapsing probability unfairly for strong early-career candidates.

### Implementation

**Entry-Level Guard**:
- **Condition**: ATS pass probability ≥ 0.75 AND recruiter signal strength ≥ medium (evaluation score ≥ 50)
- **Floor**: 25% minimum overall hiring probability
- **Rationale**: Strong early-career candidates (who pass ATS and show promise to recruiters) should not have their probability collapsed by minor interview readiness issues

**Explainability**:
- Floor is explainable, not arbitrary
- Explanation: "Strong ATS and recruiter signals indicate candidate has transferable skills and potential, even if interview readiness is lower."

### Why This Matches Real Hiring Behavior

1. **Recruiters evaluate holistically**: If ATS passes and recruiter sees potential, interview is more about fit than absolute readiness
2. **Entry-level interviews are different**: Focus on potential, learning ability, and cultural fit rather than proven track record
3. **Compounding penalties are unfair**: Multiple minor issues shouldn't collapse probability for strong candidates

## Explainability Improvements

All explanations now explicitly mention role-level adjustments:

### Examples

1. **ATS Stage**:
   - "Transferable experience positively weighted for entry-level role"
   - "Low keyword match: 45% (penalty reduced for entry-level role)"

2. **Recruiter Stage**:
   - "Transferable experience shows potential for entry-level role"
   - "Job stability less critical for entry-level roles"
   - "Red flag: missing_experience (medium severity) (severity reduced for entry-level role)"

3. **Interview Stage**:
   - "Ownership signals positively weighted for entry-level role (3 claim(s))"
   - "Lack of revenue KPIs not penalized for entry-level role"
   - "Consistency risk: vague_claim (high severity) (penalty reduced for entry-level role)"

4. **Recommendations**:
   - "For entry-level roles, focus on transferable skills and learning velocity rather than revenue KPIs."

## Real-World Hiring Behavior Alignment

### Entry-Level Roles

**What Real Recruiters Look For**:
- ✅ Learning velocity (can they learn quickly?)
- ✅ Ownership (do they take initiative?)
- ✅ Transferable skills (college projects, internships)
- ✅ Potential (growth mindset, initiative)

**What Real Recruiters Don't Penalize**:
- ❌ Missing revenue KPIs (they don't have revenue impact yet)
- ❌ Missing nice-to-have skills (these are learning opportunities)
- ❌ Less polished resumes (normal for entry-level)
- ❌ Job hopping (more acceptable for early career)

### Senior Roles

**What Real Recruiters Look For**:
- ✅ Proven track record (revenue impact, KPIs)
- ✅ Domain expertise (direct experience)
- ✅ Polished claims (specific, defensible)
- ✅ Stability (longer tenures)

**What Real Recruiters Penalize**:
- ❌ Missing revenue KPIs (proven impact required)
- ❌ Missing nice-to-haves (expertise expected)
- ❌ Vague claims (should be polished at senior level)
- ❌ Job hopping (red flag for senior roles)

## Implementation Details

### Calibration Factors

Calibration factors are defined in `backend/src/services/roleCalibration.ts`:

```typescript
interface RoleCalibrationFactors {
  missingKpiPenaltyMultiplier: number;      // 0.2 for entry, 1.0 for senior
  missingNiceToHavePenaltyMultiplier: number; // 0.3 for entry, 1.0 for senior
  missingExperiencePenaltyMultiplier: number;  // 0.4 for entry, 1.0 for senior
  vagueClaimPenaltyMultiplier: number;         // 0.5 for entry, 1.0 for senior
  transferableSkillWeightMultiplier: number;   // 1.5 for entry, 1.0 for senior
  learningVelocityWeightMultiplier: number;    // 1.6 for entry, 0.9 for senior
  ownershipWeightMultiplier: number;           // 1.4 for entry, 1.0 for senior
  probabilityFloor: number;                    // 0.25 for entry, 0.10 for senior
}
```

### Signal Detection

Transferable signals are detected using pattern matching:
- Learning velocity: "learned X in Y weeks", "self-taught"
- Ownership: "owned", "led", "built", "created", "founded"
- Leadership: "led team of X", "president", "director"
- Transferable skills: "project", "internship", "hackathon", "volunteer"

## Deterministic and Explainable

All calibration logic is:
- ✅ **Deterministic**: Rule-based, no ML models
- ✅ **Explainable**: Every adjustment is documented in explanations
- ✅ **Interview-defensible**: Can explain why entry-level gets different treatment
- ✅ **Transparent**: Calibration factors are explicit and documented

## Conclusion

Role-level calibration ensures that HireLens AI accurately reflects real-world hiring behavior:

- **Entry-level candidates** are evaluated on potential, learning velocity, and transferable skills
- **Senior candidates** are evaluated on proven track record, domain expertise, and impact
- **Explanations** explicitly mention when expectations are adjusted for role level
- **Probability floors** prevent unfair compounding penalties for strong early-career candidates

This makes HireLens AI a trusted tool that real recruiters would use, because it matches how they actually evaluate candidates at different experience levels.

