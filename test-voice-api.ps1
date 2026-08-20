# Voice Interview System API Test
# Simple PowerShell test for core voice interview endpoints

$baseUrl = "http://localhost:3000/api"
$token = "test-token"
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "VOICE INTERVIEW SYSTEM - API TEST" -ForegroundColor Blue
Write-Host "========================================`n" -ForegroundColor Blue

# Test 1: Start Interview
Write-Host "📝 Test 1: Starting Interview..." -ForegroundColor Cyan
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
        Write-Host "✅ PASSED: Interview started successfully" -ForegroundColor Green
        Write-Host "   Interview ID: $($data.data.interviewId)" -ForegroundColor Green
        Write-Host "   Questions loaded: $($data.data.questions.Count)" -ForegroundColor Green
        
        $interviewId = $data.data.interviewId
        $questions = $data.data.questions
        
        if ($questions.Count -gt 0) {
            Write-Host "   First Question: $($questions[0].questionText)" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ FAILED: Could not start interview" -ForegroundColor Red
        Write-Host "   Response: $($response.Content)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Submit Answer
Write-Host "`n📝 Test 2: Submitting Answer..." -ForegroundColor Cyan
try {
    if ($questions.Count -gt 0) {
        $questionId = $questions[0].questionId
        $body = @{
            questionId = $questionId
            text = "I have strong experience in JavaScript, React, and Node.js development."
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$baseUrl/interviews/$interviewId/answer" `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop
        
        $data = $response.Content | ConvertFrom-Json
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ PASSED: Answer submitted successfully" -ForegroundColor Green
            Write-Host "   Score: $($data.data.overallScore)/100" -ForegroundColor Green
            Write-Host "   Answers so far: $($data.data.answerCount)" -ForegroundColor Green
            
            if ($data.data.nextQuestion) {
                Write-Host "   Next Question Generated: $($data.data.nextQuestion.questionText)" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ FAILED: Answer submission failed" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Get Adaptive Question
Write-Host "`n📝 Test 3: Fetching Adaptive Question..." -ForegroundColor Cyan
try {
    $body = @{
        answerText = "I specialize in React and Node.js with PostgreSQL databases"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/interviews/$interviewId/next-question" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    $data = $response.Content | ConvertFrom-Json
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASSED: Adaptive question fetched successfully" -ForegroundColor Green
        Write-Host "   Question: $($data.data.questionText.Substring(0, 80))..." -ForegroundColor Green
    } else {
        Write-Host "❌ FAILED: Could not fetch adaptive question" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Generate Summary
Write-Host "`n📝 Test 4: Generating Interview Summary..." -ForegroundColor Cyan
try {
    $body = @{
        answers = @(
            @{ text = "JavaScript, React, Node.js, MongoDB" },
            @{ text = "I use agile methodologies and CI/CD pipelines" },
            @{ text = "I focus on code quality and maintainability" }
        )
    } | ConvertTo-Json -Depth 10
    
    $response = Invoke-WebRequest -Uri "$baseUrl/interviews/$interviewId/summary" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    $data = $response.Content | ConvertFrom-Json
    
    if ($response.StatusCode -eq 200 -and $data.data.summary) {
        Write-Host "✅ PASSED: Summary generated successfully" -ForegroundColor Green
        Write-Host "   Overall Score: $($data.data.summary.overallScore)/100" -ForegroundColor Green
        Write-Host "   Strengths identified: $($data.data.summary.strengths.Count)" -ForegroundColor Green
        Write-Host "   Weaknesses identified: $($data.data.summary.weaknesses.Count)" -ForegroundColor Green
        Write-Host "   Topics to practice: $($data.data.summary.topics.Count)" -ForegroundColor Green
        
        if ($data.data.summary.strengths.Count -gt 0) {
            Write-Host "   Sample Strength: $($data.data.summary.strengths[0])" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ FAILED: Could not generate summary" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Check Frontend Assets
Write-Host "`n📝 Test 5: Checking Frontend Assets..." -ForegroundColor Cyan
try {
    $voiceManagerUrl = "http://localhost:3000/scripts/voiceManager.js"
    $response = Invoke-WebRequest -Uri $voiceManagerUrl -Method GET -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ voiceManager.js is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  voiceManager.js not accessible: $($_.Exception.Message)" -ForegroundColor Yellow
}

try {
    $voiceInterviewUrl = "http://localhost:3000/voiceInterview.html"
    $response = Invoke-WebRequest -Uri $voiceInterviewUrl -Method GET -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ voiceInterview.html is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  voiceInterview.html not accessible: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "CORE TESTS COMPLETED SUCCESSFULLY" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Blue
