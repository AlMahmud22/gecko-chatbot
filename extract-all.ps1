# extract-all.ps1

# ✅ Output file path (change if needed)
$outputFile = "extract_files.txt"

# ✅ Clear any previous output
"" | Out-File -FilePath $outputFile -Encoding UTF8 -Force

# ✅ List your raw paths (copy from Explorer, paste below)
$rawPaths = @'
C:\Users\mahmu\Desktop\Final Sem\ChatBot UI\equators-chatbot\main.js
C:\Users\mahmu\Desktop\Final Sem\ChatBot UI\equators-chatbot\.env
'@

# ✅ Optional: List of file types you want to include
$allowedExt = @(
  '.js', '.jsx', '.ts', '.tsx', '.json',
  '.html', '.css', '.scss', '.md', '.env', '.config'
)

# ========================================
# 🚀 DO NOT TOUCH BELOW THIS LINE
# ========================================

$filePaths = $rawPaths -split "`r?`n"

foreach ($file in $filePaths) {
  $file = $file.Trim()

  if ($file -eq "") { continue }

  if (Test-Path $file) {
    $item = Get-Item $file
    if (-not $item.PSIsContainer) {
      $ext = $item.Extension.ToLower()
      if ($allowedExt -contains $ext) {
        "`n===== FILE: $file =====`n" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        Get-Content -Path $file -Raw | Out-File -FilePath $outputFile -Append -Encoding UTF8
      } else {
        "`n===== SKIPPED EXT: $file =====`n" | Out-File -FilePath $outputFile -Append -Encoding UTF8
      }
    } else {
      "`n===== SKIPPED FOLDER: $file =====`n" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    }
  } else {
    "`n===== FILE NOT FOUND: $file =====`n" | Out-File -FilePath $outputFile -Append -Encoding UTF8
  }
}

Write-Host "`n✅ Extraction complete. Output saved to: $outputFile" -ForegroundColor Green
