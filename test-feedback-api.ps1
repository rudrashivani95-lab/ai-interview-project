# Test Feedback API
Write-Host "Testing Feedback API..." -ForegroundColor Cyan

# Sample test data
$testData = @{
    questionId = "hr_001"
    questionText = "Tell me about yourself"
    answer = "I have 5 years of full-stack development experience. I led a team of 3 developers and improved system performance by 40%. I'm skilled in React, Node.js, and database optimization."
}

$body = $testData | ConvertTo-Json
Write-Host "Request Body:" -ForegroundColor Green
Write-Host $body

try {
    Write-Host "`nSending request to http://127.0.0.1:3000/api/interviews/test/answer..." -ForegroundColor Yellow
    
    $response = Invoke-WebRequest `
        -Uri 'http://127.0.0.1:3000/api/interviews/test/answer' `
        -Method POST `
        -Body $body `
        -ContentType 'application/json' `
        -TimeoutSec 10
    
    Write-Host "`n✓ Success! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "`nResponse:" -ForegroundColor Cyan
    
    $jsonResponse = $response.Content | ConvertFrom-Json
    $jsonResponse | ConvertTo-Json -Depth 5 | Write-Host
    
    Write-Host "`n✓ Feedback System Integration Successful!" -ForegroundColor Green
    Write-Host "  - Rating: $($jsonResponse.rating)" -ForegroundColor Yellow
    Write-Host "  - Score: $($jsonResponse.score)/100" -ForegroundColor Yellow
    Write-Host "  - Feedback received: $($jsonResponse.feedback.Length) characters" -ForegroundColor Yellow
    Write-Host "  - Improved answer received: $($jsonResponse.improved_answer.Length) characters" -ForegroundColor Yellow
    
} catch {
    Write-Host "`n✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
    Write-Host "`nMake sure backend server is running on port 3000" -ForegroundColor Yellow
}
