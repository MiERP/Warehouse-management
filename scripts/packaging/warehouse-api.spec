# PyInstaller skeleton for the FastAPI backend.
# Build from repository root with: pyinstaller scripts/packaging/warehouse-api.spec --clean

from pathlib import Path

ROOT = Path.cwd()
API_DIR = ROOT / "apps" / "api"

block_cipher = None


a = Analysis(
    [str(API_DIR / "app" / "main.py")],
    pathex=[str(API_DIR)],
    binaries=[],
    datas=[],
    hiddenimports=[
        "uvicorn",
        "uvicorn.loops.auto",
        "uvicorn.protocols.http.auto",
        "uvicorn.protocols.websockets.auto",
        "uvicorn.lifespan.on",
        "sqlalchemy.dialects.sqlite",
        "passlib.handlers.bcrypt",
        "openpyxl",
        "reportlab",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="warehouse-api",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
