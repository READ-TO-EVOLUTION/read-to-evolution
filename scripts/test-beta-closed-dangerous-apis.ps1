# Beta Closed Dangerous API Verification Script
# Purpose: Verify that dangerous APIs are blocked when BETA_CLOSED is enabled
# Usage: powershell -ExecutionPolicy Bypass -File scripts/test-beta-closed-dangerous-apis.ps1 -BaseUrl http://localhost:3000

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$Email = "",
    [string]$Password = "",
    [string]$Token = ""
)

# Set console encoding to UTF-8 (for internal handling, output is ASCII only)
chcp 65001 > $null
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)

$ErrorActionPreference = "Continue"

Write-Host "=== Beta Closed Dangerous API Verification ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Base URL: $BaseUrl"
Write-Host ""

# Authentication
$authToken = $null
$hasAuth = $false

if ($Token) {
    $authToken = $Token
    $hasAuth = $true
    Write-Host "[INFO] Using provided token" -ForegroundColor Yellow
} elseif ($Email -and $Password) {
    Write-Host "[INFO] Attempting login..." -ForegroundColor Yellow
    try {
        $loginBody = @{
            email = $Email
            password = $Password
        } | ConvertTo-Json

        $loginResponse = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $loginBody `
            -UseBasicParsing `
            -ErrorAction Stop

        if ($loginResponse.StatusCode -eq 200) {
            $loginData = $loginResponse.Content | ConvertFrom-Json
            if ($loginData.token) {
                $authToken = $loginData.token
                $hasAuth = $true
                Write-Host "[OK] Login successful" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "[WARN] Login failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] No authentication provided - unauthenticated tests only" -ForegroundColor Yellow
}

Write-Host ""

# Test function
function Test-DangerousAPI {
    param(
        [string]$Method,
        [string]$Path,
        [int]$ExpectedStatus,
        [string]$ExpectedCode = "",
        [hashtable]$Headers = @{},
        [string]$Body = ""
    )

    $url = "$BaseUrl$Path"
    $result = @{
        Path = $Path
        Method = $Method
        ExpectedStatus = $ExpectedStatus
        ActualStatus = 0
        ActualBody = ""
        Pass = $false
        Message = ""
    }

    try {
        $requestParams = @{
            Uri = $url
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
            ErrorAction = "Stop"
        }

        if ($Body) {
            $requestParams["ContentType"] = "application/json"
            $requestParams["Body"] = $Body
        }

        $response = Invoke-WebRequest @requestParams
        $result.ActualStatus = $response.StatusCode
        $result.ActualBody = $response.Content

        # Check status code
        if ($result.ActualStatus -eq $ExpectedStatus) {
            # Check response body for expected code (if required)
            if ($ExpectedCode) {
                if ($result.ActualBody -match $ExpectedCode) {
                    $result.Pass = $true
                    $result.Message = "PASS"
                } else {
                    $result.Pass = $false
                    $result.Message = "FAIL: Status OK but code '$ExpectedCode' not found in body"
                }
            } else {
                # For 204, body check is not required
                $result.Pass = $true
                $result.Message = "PASS"
            }
        } elseif ($ExpectedStatus -eq 204 -and $result.ActualStatus -eq 204) {
            # 204 No Content is valid
            $result.Pass = $true
            $result.Message = "PASS"
        } else {
            $result.Pass = $false
            $result.Message = "FAIL: Expected $ExpectedStatus, got $($result.ActualStatus)"
        }
    } catch {
        $httpError = $_.Exception.Response
        if ($httpError) {
            $result.ActualStatus = [int]$httpError.StatusCode
            try {
                $stream = $httpError.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $result.ActualBody = $reader.ReadToEnd()
            } catch {
                $result.ActualBody = ""
            }

            if ($result.ActualStatus -eq $ExpectedStatus) {
                if ($ExpectedCode) {
                    if ($result.ActualBody -match $ExpectedCode) {
                        $result.Pass = $true
                        $result.Message = "PASS"
                    } else {
                        $result.Pass = $false
                        $result.Message = "FAIL: Status OK but code '$ExpectedCode' not found in body"
                    }
                } else {
                    $result.Pass = $true
                    $result.Message = "PASS"
                }
            } elseif ($ExpectedStatus -eq 204 -and $result.ActualStatus -eq 204) {
                $result.Pass = $true
                $result.Message = "PASS"
            } else {
                $result.Pass = $false
                $result.Message = "FAIL: Expected $ExpectedStatus, got $($result.ActualStatus)"
            }
        } else {
            $result.Pass = $false
            $result.Message = "FAIL: $($_.Exception.Message)"
        }
    }

    return $result
}

# Test results
$testResults = @()
$hasFailures = $false

# Prepare headers
$unauthenticatedHeaders = @{}
$authenticatedHeaders = @{}

if ($hasAuth -and $authToken) {
    $authenticatedHeaders["Authorization"] = "Bearer $authToken"
}

# Test cases: Unauthenticated
Write-Host "=== Unauthenticated Tests ===" -ForegroundColor Cyan
Write-Host ""

$unauthTests = @(
    @{ Method = "POST"; Path = "/api/affiliate/opt-in"; ExpectedStatus = 403; ExpectedCode = "BETA_CLOSED_DISABLED"; Body = '{"intent":"ENABLE_AFFILIATE"}' },
    @{ Method = "POST"; Path = "/api/affiliate/cancel"; ExpectedStatus = 403; ExpectedCode = "BETA_CLOSED_DISABLED"; Body = "" },
    @{ Method = "POST"; Path = "/api/affiliate/book-links"; ExpectedStatus = 403; ExpectedCode = "BETA_CLOSED_DISABLED"; Body = '{"externalUrl":"https://example.com"}' },
    @{ Method = "GET"; Path = "/api/revenue-shares"; ExpectedStatus = 403; ExpectedCode = "BETA_CLOSED_DISABLED"; Body = "" },
    @{ Method = "POST"; Path = "/api/gifts"; ExpectedStatus = 403; ExpectedCode = "BETA_CLOSED_DISABLED"; Body = '{"bookId":"test","purchaseUrl":"https://example.com"}' },
    @{ Method = "POST"; Path = "/api/ocr-assets"; ExpectedStatus = 403; ExpectedCode = "BETA_CLOSED_DISABLED"; Body = '{"bookId":"test","imageUrl":"https://example.com","extractedText":"test"}' },
    @{ Method = "POST"; Path = "/api/ocr-texts"; ExpectedStatus = 403; ExpectedCode = "BETA_CLOSED_DISABLED"; Body = '{"bookId":"test","text":"test"}' },
    @{ Method = "POST"; Path = "/api/stripe/webhook"; ExpectedStatus = 204; ExpectedCode = ""; Body = '{"type":"test"}' }
)

foreach ($test in $unauthTests) {
    $result = Test-DangerousAPI `
        -Method $test.Method `
        -Path $test.Path `
        -ExpectedStatus $test.ExpectedStatus `
        -ExpectedCode $test.ExpectedCode `
        -Headers $unauthenticatedHeaders `
        -Body $test.Body

    $testResults += $result

    $statusColor = if ($result.Pass) { "Green" } else { "Red" }
    Write-Host "[$($result.Message)] $($test.Method) $($test.Path) (Expected: $($test.ExpectedStatus), Got: $($result.ActualStatus))" -ForegroundColor $statusColor

    if (-not $result.Pass) {
        $hasFailures = $true
    }
}

Write-Host ""

# Test cases: Authenticated (if auth available)
if ($hasAuth -and $authToken) {
    Write-Host "=== Authenticated Tests ===" -ForegroundColor Cyan
    Write-Host ""

    $authTests = @(
        @{ Method = "POST"; Path = "/api/affiliate/opt-in"; ExpectedStatus = 403; ExpectedCode = "BETA_CLOSED_DISABLED"; Body = '{"intent":"ENABLE_AFFILIATE"}' },
        @{ Method = "POST"; Path = "/api/affiliate/cancel"; ExpectedStatus = 403; ExpectedCode = "BETA_CLOSED_DISABLED"; Body = "" },
        @{ Method = "POST"; Path = "/api/affiliate/book-links"; ExpectedStatus = 403; ExpectedCode = "BETA_CLOSED_DISABLED"; Body = '{"externalUrl":"https://example.com"}' },
        @{ Method = "GET"; Path = "/api/revenue-shares"; ExpectedStatus = 403; ExpectedCode = "BETA_CLOSED_DISABLED"; Body = "" },
        @{ Method = "POST"; Path = "/api/gifts"; ExpectedStatus = 403; ExpectedCode = "BETA_CLOSED_DISABLED"; Body = '{"bookId":"test","purchaseUrl":"https://example.com"}' },
        @{ Method = "POST"; Path = "/api/ocr-assets"; ExpectedStatus = 403; ExpectedCode = "BETA_CLOSED_DISABLED"; Body = '{"bookId":"test","imageUrl":"https://example.com","extractedText":"test"}' },
        @{ Method = "POST"; Path = "/api/ocr-texts"; ExpectedStatus = 403; ExpectedCode = "BETA_CLOSED_DISABLED"; Body = '{"bookId":"test","text":"test"}' },
        @{ Method = "POST"; Path = "/api/stripe/webhook"; ExpectedStatus = 204; ExpectedCode = ""; Body = '{"type":"test"}' }
    )

    foreach ($test in $authTests) {
        $result = Test-DangerousAPI `
            -Method $test.Method `
            -Path $test.Path `
            -ExpectedStatus $test.ExpectedStatus `
            -ExpectedCode $test.ExpectedCode `
            -Headers $authenticatedHeaders `
            -Body $test.Body

        $testResults += $result

        $statusColor = if ($result.Pass) { "Green" } else { "Red" }
        Write-Host "[$($result.Message)] $($test.Method) $($test.Path) (Expected: $($test.ExpectedStatus), Got: $($result.ActualStatus))" -ForegroundColor $statusColor

        if (-not $result.Pass) {
            $hasFailures = $true
        }
    }
} else {
    Write-Host "=== Authenticated Tests ===" -ForegroundColor Cyan
    Write-Host "[SKIP] No authentication provided" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host ""

$passCount = ($testResults | Where-Object { $_.Pass }).Count
$failCount = ($testResults | Where-Object { -not $_.Pass }).Count
$totalCount = $testResults.Count

Write-Host "Total: $totalCount, Pass: $passCount, Fail: $failCount"

if ($hasFailures) {
    Write-Host ""
    Write-Host "FAILED TESTS:" -ForegroundColor Red
    foreach ($result in $testResults | Where-Object { -not $_.Pass }) {
        Write-Host "  - $($result.Method) $($result.Path): $($result.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Exit code: 1" -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "All tests PASSED" -ForegroundColor Green
    Write-Host "Exit code: 0" -ForegroundColor Green
    exit 0
}
