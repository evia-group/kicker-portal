#!/usr/bin/env sh
# Erzeugt die App-Icons und das Favicon aus den SVG-Quellen in
# src/assets/svg/. Nur bei einer Aenderung am Motiv noetig, die Ergebnisse
# liegen im Repo.
#
# Voraussetzung: rsvg-convert (librsvg) und Python mit Pillow.
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
src="$root/src/assets/svg"
out="$root/public/icons"

mkdir -p "$out"

# Groessen, die das Manifest referenziert. 192 und 512 sind die von der
# Installability geforderten, die uebrigen decken aeltere Launcher ab.
for size in 72 96 128 144 152 192 384 512; do
  rsvg-convert -w "$size" -h "$size" "$src/app-icon.svg" \
    -o "$out/icon-${size}x${size}.png"
done

# Maskable nur in den beiden Groessen, die Android tatsaechlich heranzieht.
for size in 192 512; do
  rsvg-convert -w "$size" -h "$size" "$src/app-icon-maskable.svg" \
    -o "$out/icon-maskable-${size}x${size}.png"
done

# Favicon: mehrere Groessen in einer .ico, damit Browser und Lesezeichenleisten
# jeweils die passende ziehen.
rsvg-convert -w 256 -h 256 "$src/app-icon.svg" -o "$root/public/favicon-256.png"
python3 - "$root" <<'PY'
import sys
from PIL import Image

root = sys.argv[1]
source = Image.open(f'{root}/public/favicon-256.png')
source.save(
    f'{root}/public/favicon.ico',
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
PY
rm "$root/public/favicon-256.png"

echo "Icons erzeugt in $out und public/favicon.ico"
