param(
  [ValidateSet("init", "start", "stop", "createdb", "status")]
  [string]$Command
)

$PgBin = "C:\Program Files\PostgreSQL\15\bin"
$DataDir = Join-Path $PSScriptRoot "..\.local-postgres\data-utf8"
$RuntimeDir = Join-Path $PSScriptRoot "..\.local-postgres\runtime"
$PwFile = Join-Path $PSScriptRoot "..\.local-postgres\pwfile.txt"
$Port = 9432
$User = "portal"
$Database = "portal_uala_bank"

New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

switch ($Command) {
  "init" {
    New-Item -ItemType Directory -Force -Path (Split-Path $PwFile) | Out-Null
    Set-Content -Path $PwFile -Value "portal"
    if (!(Test-Path (Join-Path $DataDir "PG_VERSION"))) {
      & "$PgBin\initdb.exe" -D $DataDir -U $User -A scram-sha-256 --pwfile=$PwFile --encoding=UTF8 --locale=C
    }
  }
  "start" {
    & "$PgBin\pg_ctl.exe" -D $DataDir -l (Join-Path $RuntimeDir "postgres.log") -o "-p $Port" start
  }
  "stop" {
    & "$PgBin\pg_ctl.exe" -D $DataDir stop
  }
  "createdb" {
    $env:PGPASSWORD = "portal"
    & "$PgBin\createdb.exe" -h localhost -p $Port -U $User $Database
  }
  "status" {
    & "$PgBin\pg_isready.exe" -h localhost -p $Port -U $User
  }
}
