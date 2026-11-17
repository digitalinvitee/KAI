#!/usr/bin/env python3
"""Rebuild the self-hosted font files in assets/fonts/.

Only needed if the site starts using characters the subsets do not cover.

1. Download the two variable fonts from the Google Fonts repository
   (https://github.com/google/fonts) into fonts-src/:
     ofl/manrope/Manrope[wght].ttf
     ofl/notosansjp/NotoSansJP[wght].ttf
2. pip install fonttools brotli
3. python3 scripts/subset-fonts.py

It writes the WOFF2 files and prints the metric overrides used for the
'Manrope Fallback' face in src/css/fonts.css.
"""
import io
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'fonts-src'
OUT = ROOT / 'assets' / 'fonts'

# Latin, Latin-1, Latin Extended-A (German, French, Polish, Czech names …),
# typographic punctuation, euro sign and arrows.
LATIN = (
    'U+0020-007E,U+00A0-00FF,U+0100-017F,U+0192,U+02C6,U+02DA,U+02DC,'
    'U+2013-2014,U+2018-201E,U+2020-2022,U+2026,U+2030,U+2039-203A,U+2044,'
    'U+20AC,U+2122,U+2190-2193,U+2212'
)
# The only Japanese on the site: 会 (kai) and 一期一会 (ichigo ichie).
JAPANESE = 'U+4E00,U+4F1A,U+671F'

FEATURES = ['kern', 'liga', 'calt', 'ccmp', 'locl', 'mark', 'mkmk', 'case', 'tnum', 'pnum', 'lnum']


def build(source, target, axis_range, unicodes, features):
    limited = instancer.instantiateVariableFont(TTFont(source), {'wght': axis_range})
    buffer = io.BytesIO()
    limited.save(buffer)  # round-trip so the subsetter sees fully compiled tables
    buffer.seek(0)
    font = TTFont(buffer)
    options = subset.Options()
    options.flavor = 'woff2'
    options.layout_features = features
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    options.hinting = False
    options.desubroutinize = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=subset.parse_unicodes(unicodes))
    subsetter.subset(font)
    font.flavor = 'woff2'
    font.save(target)
    print(f'{target.relative_to(ROOT)}  {target.stat().st_size / 1024:.1f} KB')


def fallback_metrics(source):
    """size-adjust and overrides that make Arial occupy the same space as Manrope 400."""
    manrope = instancer.instantiateVariableFont(TTFont(source), {'wght': 400})
    arial_path = next((p for p in (
        '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',  # metric clone of Arial
        '/Library/Fonts/Arial.ttf',
        'C:/Windows/Fonts/arial.ttf',
    ) if Path(p).exists()), None)
    if not arial_path:
        print('Arial (or Liberation Sans) not found; skipping fallback metrics.')
        return
    arial = TTFont(arial_path)
    sample = 'the quick brown fox jumps over the lazy dog ' * 3 + 'Omakase Reservierung Tresen Sake 17:30 €185'

    def average_width(font):
        cmap, hmtx, upm = font.getBestCmap(), font['hmtx'], font['head'].unitsPerEm
        widths = [hmtx[cmap[ord(c)]][0] / upm for c in sample if ord(c) in cmap]
        return sum(widths) / len(widths)

    size_adjust = average_width(manrope) / average_width(arial)
    hhea, upm = manrope['hhea'], manrope['head'].unitsPerEm
    print(f'size-adjust: {size_adjust * 100:.2f}%;')
    print(f'ascent-override: {hhea.ascent / upm / size_adjust * 100:.2f}%;')
    print(f'descent-override: {abs(hhea.descent) / upm / size_adjust * 100:.2f}%;')
    print(f'line-gap-override: {hhea.lineGap / upm / size_adjust * 100:.2f}%;')


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    manrope = SRC / 'Manrope[wght].ttf'
    build(manrope, OUT / 'manrope-latin-var.woff2', (300, 600), LATIN, FEATURES)
    build(SRC / 'NotoSansJP[wght].ttf', OUT / 'noto-sans-jp-kai.woff2', (300, 400), JAPANESE, ['ccmp', 'locl'])
    fallback_metrics(manrope)
