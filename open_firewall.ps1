# StrayCare - Open Firewall Ports
# Run this script as Administrator (Right-click → Run as Administrator)

Write-Host "Opening firewall ports for StrayCare..." -ForegroundColor Cyan

# Remove old rules if they exist
netsh advfirewall firewall delete rule name="StrayCare Backend 8000" | Out-Null
netsh advfirewall firewall delete rule name="StrayCare Frontend 3000" | Out-Null

# Add inbound rules for backend (8000) and frontend (3000)
netsh advfirewall firewall add rule name="StrayCare Backend 8000" dir=in action=allow protocol=TCP localport=8000
netsh advfirewall firewall add rule name="StrayCare Frontend 3000" dir=in action=allow protocol=TCP localport=3000

# Also add outbound rules
netsh advfirewall firewall add rule name="StrayCare Backend 8000 OUT" dir=out action=allow protocol=TCP localport=8000
netsh advfirewall firewall add rule name="StrayCare Frontend 3000 OUT" dir=out action=allow protocol=TCP localport=3000

Write-Host ""
Write-Host "Done! Verifying rules..." -ForegroundColor Green
netsh advfirewall firewall show rule name="StrayCare Backend 8000"
netsh advfirewall firewall show rule name="StrayCare Frontend 3000"

Write-Host ""
Write-Host "Firewall ports 8000 and 3000 are now OPEN for Android access!" -ForegroundColor Green
Write-Host "Your PC IP is:" -ForegroundColor Yellow
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi").IPAddress
