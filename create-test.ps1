@"
# Voice Interview API Test
powershell -Command {
    `$baseUrl = 'http://localhost:3000/api'
    `$headers = @{
        'Content-Type' = 'application/json'
        'Authorization' = 'Bearer test-token'
    }
    
    Write-Host "`n=== VOICE INTERVIEW API TEST ===" -ForegroundColor Blue
    
    # Test 1: Start Interview
    try {
        Write-Host "`nTest 1: Start Interview..." -ForegroundColor Cyan
        `$body = @{ type = 'general'; count = 3 } | ConvertTo-Json
        `$response = Invoke-WebRequest -Uri "`$baseUrl/interviews/start" -Method POST -Headers `$headers -Body `$body
        `$data = `$response.Content | ConvertFrom-Json
        
        `$interviewId = `$data.data.interviewId
        Write-Host "✓ Started (ID: `$interviewId)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed: `$_" -ForegroundColor Red
        exit 1
    }
    
    # Test 2: Submit Answer
    try {
        Write-Host "`nTest 2: Submit Answer..." -ForegroundColor Cyan
        `$body = @{ questionId = 'q1'; text = 'I have React and Node.js experience' } | ConvertTo-Json
        `$response = Invoke-WebRequest -Uri "`$baseUrl/interviews/`$interviewId/answer" -Method POST -Headers `$headers -Body `$body
        Write-Host "✓ Answer submitted" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed: `$_" -ForegroundColor Red
    }
    
    # Test 3: Get Summary
    try {
        Write-Host "`nTest 3: Generate Summary..." -ForegroundColor Cyan
        `$body = @{ answers = @(@{ text = 'JavaScript, React' }) } | ConvertTo-Json -Depth 10
        `$response = Invoke-WebRequest -Uri "`$baseUrl/interviews/`$interviewId/summary" -Method POST -Headers `$headers -Body `$body
        Write-Host "✓ Summary generated" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed: `$_" -ForegroundColor Red
    }
    
    Write-Host "`n=== TESTS COMPLETE ===" -ForegroundColor Green
}
"@ | Out-File -FilePath "C:\Users\ADMIN\Downloads\ai-interview-project\run-test.ps1" -Encoding UTF8
