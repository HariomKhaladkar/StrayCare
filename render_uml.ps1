$files = Get-ChildItem "uml_diagrams\*.mmd"
foreach ($f in $files) {
    $out = $f.FullName -replace '\.mmd$', '.png'
    Write-Host "Rendering $($f.Name)..."
    npx -y @mermaid-js/mermaid-cli -i $f.FullName -o $out -w 1400 -H 900 --backgroundColor white
}
Write-Host "Done!"
