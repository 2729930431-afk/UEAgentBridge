$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
foreach ($file in @('.agents/plugins/marketplace.json','plugins/ue/.codex-plugin/plugin.json','plugins/ue/.mcp.json','plugins/ue/server/package.json')) {
    Get-Content -LiteralPath (Join-Path $repoRoot $file) -Raw | ConvertFrom-Json | Out-Null
}
foreach ($file in Get-ChildItem -LiteralPath (Join-Path $repoRoot 'plugins/ue') -Recurse -File | Where-Object {$_.Extension -in '.js','.mjs'}) {
    & node --check $file.FullName
    if ($LASTEXITCODE -ne 0) {throw "JavaScript syntax check failed: $($file.FullName)"}
}
Write-Output 'Package JSON and JavaScript syntax checks passed. UE was not started; runtime tests were not run.'
