"""One definition of where things are, imported by every phase3 module.

The modules are grouped into the seven Phase 3 activity directories, so a module
no longer sits next to the ones it imports, and `Path(__file__).parent.parent` no
longer points at the repository root. Both are fixed here, in one place: ROOT is
the repository root, and every activity directory goes on the import path so the
plain `from data import ...` imports keep working from any of them.

Each module reaches this file with:

    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from _paths import ROOT
"""
import sys
from pathlib import Path

PHASE3 = Path(__file__).resolve().parent
ROOT = PHASE3.parent

sys.path[:0] = [
    str(p) for p in sorted(PHASE3.iterdir())
    if p.is_dir() and not p.name.startswith(("_", "."))
]

if __name__ == "__main__":
    assert (ROOT / "phase3").is_dir(), ROOT
    assert (ROOT / "README.md").is_file(), "ROOT is not the repository root"
    dirs = [p.name for p in PHASE3.iterdir() if p.is_dir() and p.name[:1].isdigit()]
    assert len(dirs) == 7, dirs
    print(f"ROOT   {ROOT}")
    print(f"on path: {len(dirs)} activity directories")
