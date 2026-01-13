# Quick curl Test for /api/v1/analyze

## Simple Test Command

```bash
curl -X POST http://localhost:3000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3001" \
  -d '{
    "resume": {
      "file_content": "Sm9obiBEb2UKRW1haWw6IGpvaG4uZG9lQGV4YW1wbGUuY29tClBob25lOiAoNTU1KSAxMjMtNDU2NwoKRVhQRVJJRU5DRQpTb2Z0d2FyZSBFbmdpbmVlciB8IFRlY2ggQ29ycCB8IDIwMjAtMjAyMwoK4oCiIERldmVsb3BlZCB3ZWIgYXBwbGljYXRpb25zIHVzaW5nIFB5dGhvbiBhbmQgUmVhY3QK4oCiIEltcHJvdmVkIHN5c3RlbSBwZXJmb3JtYW5jZSBieSAzMCUK4oCiIExlZCB0ZWFtIG9mIDUgZGV2ZWxvcGVycwoKRURVQ0FUSU9OCkJBQ0hFTE9SIG9mIFNjaWVuY2UgaW4gQ29tcHV0ZXIgU2NpZW5jZSB8IFN0YXRlIFVuaXZlcnNpdHkgfCAyMDIwCgpTS0lMTFMKUFlUSE9OLCBKYXZhU2NyaXB0LCBSZWFjdCwgTm9kZS5qcywgQVdTLCBEb2NrZXI=",
      "file_format": "txt",
      "file_name": "test-resume.txt"
    },
    "job_description": {
      "job_description_text": "We are looking for a Software Engineer with experience in Python and React. Must have 3+ years of experience. AWS knowledge preferred."
    }
  }'
```

## What This Tests

- ✅ Server is running and accessible
- ✅ Route is correctly registered
- ✅ CORS headers are present
- ✅ Request body parsing works
- ✅ Zod validation accepts the payload
- ✅ Endpoint processes and returns response

## Expected Response

You should receive a JSON response with:
- `analysis_id` (UUID)
- `timestamp` (ISO 8601)
- `scores` (ATS, Recruiter, Interview, Overall)
- `explanations` (stage explanations and recommendations)
- `metadata` (processing time, stages)

## Decode the Base64 Resume

The base64 string decodes to:
```
John Doe
Email: john.doe@example.com
Phone: (555) 123-4567

EXPERIENCE
Software Engineer | Tech Corp | 2020-2023
• Developed web applications using Python and React
• Improved system performance by 30%
• Led team of 5 developers

EDUCATION
Bachelor of Science in Computer Science | State University | 2020

SKILLS
Python, JavaScript, React, Node.js, AWS, Docker
```

