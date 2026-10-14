"""Build the tiny Noto Sans TC subsets used by the link preview function.

The preview image only ever shows a fixed set of strings (see src/share/ogText.ts),
so we ship just those glyphs instead of a multi-megabyte CJK font.

Usage:
    python scripts/build-og-fonts.py <NotoSansTC[wght].ttf> api/_fonts/charset.txt api/_fonts

Get the source font from https://github.com/google/fonts/tree/main/ofl/notosanstc
(SIL Open Font License 1.1, copied next to the subsets as OFL.txt).
"""

from __future__ import annotations

import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

WEIGHTS = {"Medium": 500, "ExtraBold": 800}


def build(source: Path, charset: str, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, weight in WEIGHTS.items():
        font = instancer.instantiateVariableFont(TTFont(source), {"wght": weight})
        options = subset.Options()
        options.layout_features = ["kern", "liga", "calt"]
        options.notdef_outline = True
        subsetter = subset.Subsetter(options)
        subsetter.populate(text=charset)
        subsetter.subset(font)
        target = out_dir / f"NotoSansTC-{name}.ttf"
        font.save(target)
        print(f"{target}: {target.stat().st_size:,} bytes")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    src, charset_file, out = sys.argv[1:]
    build(Path(src), Path(charset_file).read_text(encoding="utf-8"), Path(out))
