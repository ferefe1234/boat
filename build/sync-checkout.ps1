param([string]$Destination = 'C:\Users\liugu\Documents\GitHub\boat')
$ErrorActionPreference = 'Stop'
$sourceRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$targetRoot = [IO.Path]::GetFullPath($Destination).TrimEnd('\')
if ($targetRoot -eq $sourceRoot.TrimEnd('\')) { throw 'Source and destination must be different folders.' }
if (-not (Test-Path -LiteralPath (Join-Path $targetRoot '.git'))) { throw 'Destination must be the existing GitHub checkout.' }
$sourceZip = Join-Path $sourceRoot 'artifacts\QRtransfer-source.zip'
if (-not (Test-Path -LiteralPath $sourceZip)) { throw 'Build the source archive first with npm run build:web.' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::OpenRead($sourceZip)
try {
    foreach ($entry in $archive.Entries) {
        if (-not $entry.Name) { continue }
        $relativeFile = $entry.FullName.Replace('/', '\')
        $targetFile = [IO.Path]::GetFullPath((Join-Path $targetRoot $relativeFile))
        if (-not $targetFile.StartsWith($targetRoot + '\', [StringComparison]::OrdinalIgnoreCase) -or
            $relativeFile -match '^\.git[\\/]' -or $relativeFile -match '(^|[\\/])\.env' -or
            $relativeFile -match '(^|[\\/])local\.properties$') { throw "Unexpected archive path: $relativeFile" }
        $parent = [IO.Path]::GetDirectoryName($targetFile)
        [IO.Directory]::CreateDirectory($parent) | Out-Null
        [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $targetFile, $true)
    }
} finally { $archive.Dispose() }
# Copy finished deliverables too; artifacts/ remains ignored by Git.
foreach ($relativeFile in @('artifacts\QRtransfer-web.zip', 'artifacts\QRtransfer-source.zip', 'artifacts\desktop\QRtransfer-2.0.0-windows-x64-setup.exe')) {
    $sourceFile = Join-Path $sourceRoot $relativeFile
    if (Test-Path -LiteralPath $sourceFile) {
        $targetFile = Join-Path $targetRoot $relativeFile
        [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($targetFile)) | Out-Null
        Copy-Item -LiteralPath $sourceFile -Destination $targetFile -Force
    }
}
Write-Host "QRtransfer v2 source and available packages copied to $targetRoot."
Write-Host 'Review the changes in GitHub Desktop, commit, and Push origin. Then start a new Desktop installers run for the DMG.'
