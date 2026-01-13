# HireLens AI Backend

Production-grade backend API for HireLens AI resume and interview intelligence platform.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Server will start on `http://localhost:3000`

## Build

```bash
npm run build
npm start
```

## API Endpoints

### POST /api/v1/analyze

Analyzes a resume against a job description and returns comprehensive scoring and explainability information.

See `docs/contracts/api_contracts.md` for full API documentation.

## Architecture

- **Fastify**: High-performance web framework
- **TypeScript**: Type-safe development
- **Zod**: Runtime validation
- **pdf-parse**: PDF text extraction
- **mammoth**: DOCX text extraction

## Services

- `resumeParser.ts`: Extracts structured data from resume files
- `atsScorer.ts`: Simulates ATS screening with keyword matching
- `recruiterScorer.ts`: Evaluates resume from recruiter perspective
- `interviewScorer.ts`: Assesses interview readiness
- `aggregator.ts`: Combines scores into overall assessment
- `explainability.ts`: Generates human-readable explanations

