# Voice Interview System API Test

$baseUrl = "http://localhost:3000/api"
$token = "test-token"
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

Write-Host "`n======== VOICE INTERVIEW SYSTEM - API TEST ========`n" -ForegroundColor Blue

# Test 1: Start Interview
Write-Host "Test 1: Starting Interview..." -ForegroundColor Cyan
try {
    $body = @{
        type = "general"
        count = 3
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/interviews/start" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    $data = $response.Content | ConvertFrom-Json
    
    if ($response.StatusCode -eq 200 -and $data.data.interviewId) {
        Write-Host "✓ Interview started" -ForegroundColor Green
        Write-Host "  Interview ID: $($data.data.interviewId)" -ForegroundColor Green
        Write-Host "  Questions: $($data.data.questions.Count)" -ForegroundColor Green
        
        $interviewId = $data.data.interviewId
        $questions = $data.data.questions
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Submit Answer
Write-Host "`nTest 2: Submitting Answer..." -ForegroundColor Cyan
try {
    if ($questions.Count -gt 0) {
        $body = @{
            questionId = $questions[0].questionId
            text = "I have strong JavaScript and React experience"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$baseUrl/interviews/$interviewId/answer" `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop
        
        $data = $response.Content | ConvertFrom-Json
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Answer submitted" -ForegroundColor Green
            Write-Host "  Score: $($data.data.overallScore)/100" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get Adaptive Question
Write-Host "`nTest 3: Fetching Adaptive Question..." -ForegroundColor Cyan
try {
    $body = @{
        answerText = "I work with React and Node.js"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/interviews/$interviewId/next-question" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Adaptive question generated" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Generate Summary
Write-Host "`nTest 4: Generating Summary..." -ForegroundColor Cyan
try {
    $body = @{
        answers = @(
            @{ text = "JavaScript, React, Node.js" }
        )
    } | ConvertTo-Json -Depth 10
    
    $response = Invoke-WebRequest -Uri "$baseUrl/interviews/$interviewId/summary" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    $data = $response.Content | ConvertFrom-Json
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Summary generated" -ForegroundColor Green
        Write-Host "  Score: $($data.data.summary.overallScore)/100" -ForegroundColor Green
        Write-Host "  Strengths: $($data.data.summary.strengths.Count)" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n====== ALL CORE TESTS COMPLETED ======`n" -ForegroundColor Green
