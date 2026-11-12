param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [string]$Endpoint = 'http://127.0.0.1:3000/mcp',
    [string]$ConfigPath = (Join-Path ([Environment]::GetFolderPath('UserProfile')) '.config\UEAgentBridge\config.json')
)
$ErrorActionPreference = 'Stop'
$resolvedProject = (Resolve-Path -LiteralPath $ProjectPath).Path
if (Test-Path -LiteralPath $resolvedProject -PathType Leaf) {
    if ([IO.Path]::GetExtension($resolvedProject) -ne '.uproject') {throw 'Select a .uproject file or project directory.'}
    $resolvedProject = Split-Path -Parent $resolvedProject
}
if (-not (Get-ChildItem -LiteralPath $resolvedProject -Filter '*.uproject' -File)) {throw 'No .uproject found.'}
$url = [Uri]$Endpoint
if ($url.Scheme -ne 'http' -or $url.Host -notin @('127.0.0.1','localhost','[::1]') -or $url.AbsolutePath -ne '/mcp' -or $url.UserInfo -or $url.Query -or $url.Fragment) {throw 'Use a local HTTP /mcp endpoint.'}
$configFullPath = [IO.Path]::GetFullPath($ConfigPath)
New-Item -ItemType Directory -Path (Split-Path -Parent $configFullPath) -Force | Out-Null
$payload = @{projectPath=$resolvedProject; endpoint=$Endpoint} | ConvertTo-Json
[IO.File]::WriteAllText($configFullPath, $payload, [Text.UTF8Encoding]::new($false))
Write-Output "UE project configuration saved: $configFullPath"
Write-Output 'Reload Codex after changing the project. This command does not start UE or run tests.'
