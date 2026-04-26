# Installer & Packaging Scaffold

This folder contains the first Windows packaging scaffold for the MVP.

## Expected Build Inputs

- `dist/warehouse-api/warehouse-api.exe` from PyInstaller.
- `apps/web/dist/` from the React/Vite production build.
- PowerShell service and backup scripts from `installer/windows-service/`.

## Commands

```bash
bash scripts/packaging/build-backend.sh
bash scripts/packaging/build-web.sh
```

On Windows with Inno Setup installed:

```powershell
ISCC.exe installer\inno\warehouse-management.iss
```

## Notes

- The installer skeleton installs the service and optionally registers a daily backup task.
- The production SQLite database must still be created only by the application setup wizard after user confirmation.
- Update the service command once the backend entrypoint and runtime flags are finalized.
