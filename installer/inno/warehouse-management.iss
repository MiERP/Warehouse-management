#define MyAppName "Warehouse Management"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "Warehouse Management"
#define MyAppExeName "warehouse-api.exe"

[Setup]
AppId={{6F2C46A7-0643-4A89-9B4D-5E6C0A4D0217}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\Warehouse Management
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=..\dist
OutputBaseFilename=WarehouseManagementSetup-{#MyAppVersion}
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked
Name: "dailybackup"; Description: "Register daily SQLite backup task"; GroupDescription: "Maintenance:"; Flags: unchecked

[Dirs]
Name: "{commonappdata}\WarehouseManagement"; Permissions: users-modify
Name: "{commonappdata}\WarehouseManagement\backups"; Permissions: users-modify

[Files]
Source: "..\..\dist\warehouse-api\warehouse-api.exe"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "..\..\apps\web\dist\*"; DestDir: "{app}\web"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist
Source: "..\windows-service\*.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion

[Icons]
Name: "{group}\Warehouse Management"; Filename: "http://127.0.0.1:8000"; Check: IsTaskSelected('desktopicon')
Name: "{autodesktop}\Warehouse Management"; Filename: "http://127.0.0.1:8000"; Tasks: desktopicon

[Run]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\install-service.ps1"" -InstallDir ""{app}"""; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\register-backup-task.ps1"" -InstallDir ""{app}"""; Tasks: dailybackup; Flags: runhidden waituntilterminated
Filename: "http://127.0.0.1:8000"; Description: "Open Warehouse Management"; Flags: postinstall shellexec skipifsilent

[UninstallRun]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\uninstall-service.ps1"""; Flags: runhidden waituntilterminated
Filename: "schtasks.exe"; Parameters: "/Delete /TN WarehouseManagementBackup /F"; Flags: runhidden waituntilterminated

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
end;
