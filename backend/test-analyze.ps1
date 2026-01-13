# PowerShell test script for POST /api/v1/analyze endpoint
# This creates a simple base64-encoded text resume for testing

# Create a simple text resume
$resumeText = @"
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
"@

# Encode to base64
$bytes = [System.Text.Encoding]::UTF8.GetBytes($resumeText)
$resumeBase64 = [Convert]::ToBase64String($bytes)

# Create JSON payload
$body = @{
    resume = @{
        file_content = $resumeBase64
        file_format = "txt"
        file_name = "test-resume.txt"
    }
    job_description = @{
        job_description_text = "We are looking for a Software Engineer with experience in Python and React. Must have 3+ years of experience. AWS knowledge preferred."
    }
} | ConvertTo-Json -Depth 10

# Make the API call
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/analyze" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

