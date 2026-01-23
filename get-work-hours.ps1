$logs = Get-EventLog System -Source Microsoft-Windows-Winlogon -After (Get-Date).AddDays(-60) -ErrorAction SilentlyContinue
$res = @()
ForEach ($log in $logs) {
  if($log.instanceid -eq 7001) { $type = "Logon" }
  ElseIf ($log.instanceid -eq 7002) { $type = "Logoff" }
  Else { Continue }
  try {
    $user = (New-Object System.Security.Principal.SecurityIdentifier $log.ReplacementStrings[1]).Translate([System.Security.Principal.NTAccount])
    if ($user.Value -like "*$env:USERNAME*") {
      $res += New-Object PSObject -Property @{
        Time = $log.TimeWritten.ToString("yyyy-MM-ddTHH:mm:ss")
        Event = $type
        User = $user.Value
      }
    }
  } catch { Continue }
}
if ($res.Count -eq 0) { Write-Output "[]" } else { $res | ConvertTo-Json }
