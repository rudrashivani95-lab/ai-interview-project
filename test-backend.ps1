#!/usr/bin/env pwsh

Write-Host "Testing backend at http://127.0.0.1:6000/"

try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:6000/" -Method Get -TimeoutSec 5
    Write-Host "Success! Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Failed: $($_.Exception.Message)"
}
