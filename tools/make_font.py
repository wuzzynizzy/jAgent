"""Subset the licensed Google Sans sources for this English-language library.

Run once with the official font archive from Drive. The subset output and its
OFL notice are committed, so the rest of the build needs no font source.
"""
import zipfile, sys
from pathlib import Path
from fontTools import subset

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else '/home/user/kit/Skills/Google-Sans-official-OFL.zip')
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'fonts'
OUT.mkdir(parents=True, exist_ok=True)

RANGES = [(0x20, 0x7E), (0xA0, 0x17F), (0x2010, 0x2027), (0x2030, 0x205E),
          (0x2190, 0x2193), (0x2212, 0x2212), (0x2713, 0x2713), (0x00D7, 0x00D7)]

z = zipfile.ZipFile(SRC)
unicodes = sorted({c for a, b in RANGES for c in range(a, b + 1)})
for name, out in [('GoogleSans[GRAD,opsz,wght].ttf', 'google-sans-latin.woff2')]:
    data = z.read(name)
    tmp = OUT.parent / 'font-source.ttf'
    tmp.write_bytes(data)
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['kern', 'liga', 'calt', 'ccmp', 'mark', 'mkmk', 'tnum', 'case']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    font = subset.load_font(str(tmp), opts)
    sub = subset.Subsetter(options=opts)
    sub.populate(unicodes=unicodes)
    sub.subset(font)
    subset.save_font(font, str(OUT / out), opts)
    tmp.unlink()
    print(out, (OUT / out).stat().st_size, 'bytes')
(OUT / 'OFL.txt').write_bytes(z.read('OFL.txt'))
(OUT / 'FONT-SOURCE.txt').write_text(
    'Google Sans, official static/variable release supplied by Google as a licensed asset.\n'
    'File used: GoogleSans[GRAD,opsz,wght].ttf\n'
    'Subset: Latin plus punctuation, arrows and check mark, wght 300-700 kept as a variable axis.\n'
    'Licence: SIL Open Font License 1.1, see OFL.txt. Reserved Font Name restrictions apply to modified versions.\n'
    'The subset is a modified copy, therefore it is shipped under the same OFL terms and is not \n'
    'presented as the original font file.\n')
