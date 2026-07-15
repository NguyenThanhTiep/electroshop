param(
    [string]$HostName = "127.0.0.1",
    [int]$Port = 3306,
    [string]$Database = "electroshop",
    [string]$User = "root",
    [string]$Output = "docker/mysql/init/01-electroshop.sql"
)

$mysqldump = Get-Command mysqldump -ErrorAction SilentlyContinue

if (-not $mysqldump) {
    Write-Error "Khong tim thay mysqldump. Hay cai MySQL Client hoac them thu muc bin cua MySQL vao PATH."
    exit 1
}

$password = Read-Host "Nhap mat khau MySQL cho user $User" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)

try {
    $outputPath = Resolve-Path -Path (Split-Path $Output) -ErrorAction SilentlyContinue

    if (-not $outputPath) {
        New-Item -ItemType Directory -Force -Path (Split-Path $Output) | Out-Null
    }

    & $mysqldump.Source `
        "--host=$HostName" `
        "--port=$Port" `
        "--user=$User" `
        "--password=$plainPassword" `
        "--databases" $Database `
        "--single-transaction" `
        "--routines" `
        "--triggers" `
        "--default-character-set=utf8mb4" `
        "--result-file=$Output"

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    Write-Host "Da export database vao: $Output"
}
finally {
    if ($bstr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}
