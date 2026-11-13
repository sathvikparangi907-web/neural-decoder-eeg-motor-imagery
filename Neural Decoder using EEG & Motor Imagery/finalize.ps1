# Opens the generated .docx in Word, fills in the table of contents, saves it, and exports a PDF
# with heading bookmarks and document properties.
#   powershell -File finalize.ps1 Implementation_Plan.docx Implementation_Plan.pdf
param([string]$docx, [string]$pdf)
$docx = (Resolve-Path $docx).Path
if (-not [System.IO.Path]::IsPathRooted($pdf)) { $pdf = Join-Path (Get-Location) $pdf }
$w = New-Object -ComObject Word.Application
$w.Visible = $false
$w.DisplayAlerts = 0
try {
    $d = $w.Documents.Open($docx, $false, $false)
    foreach ($t in $d.TablesOfContents) { $t.Update() }
    $d.Fields.Update() | Out-Null
    foreach ($t in $d.TablesOfContents) { $t.UpdatePageNumbers() }
    $d.Save()
    # 17 = PDF; IncludeDocProps, KeepIRM, heading bookmarks, structure tags, bitmap missing fonts
    $d.ExportAsFixedFormat($pdf, 17, $false, 0, 0, 1, 1, 0, $true, $true, 1, $true, $true, $false)
    $d.Close($false)
} finally {
    $w.Quit()
}
Write-Output "saved $docx and $pdf"
