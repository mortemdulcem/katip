#!/usr/bin/env bash
set -u
PDF=attached_assets/research_corpus/22.pdf
OUT=attached_assets/research_corpus/ocr22
IMG=/tmp/o22img
mkdir -p "$OUT" "$IMG"
TOTAL=$(pdfinfo "$PDF" 2>/dev/null | awk -F: '/^Pages/{gsub(/ /,"",$2);print $2}')
START=$(date +%s); BUDGET=70
NPROC=${2:-4}

ocr_one() {
  p="$1"; PDF="$2"; OUT="$3"; IMG="$4"
  pp=$(printf "%04d" "$p")
  [ -f "$OUT/$pp.txt" ] && return
  pdftoppm -png -r 150 -f "$p" -l "$p" "$PDF" "$IMG/$pp" 2>/dev/null
  img=$(ls "$IMG/$pp"*.png 2>/dev/null | head -1)
  [ -z "$img" ] && { echo "" > "$OUT/$pp.txt"; return; }
  tesseract "$img" "$OUT/$pp" -l eng --psm 3 >/dev/null 2>&1 || echo "" > "$OUT/$pp.txt"
  rm -f "$img"
}
export -f ocr_one

# Build todo list of pages not yet done
todo=""
for p in $(seq 1 "$TOTAL"); do
  pp=$(printf "%04d" "$p")
  [ -f "$OUT/$pp.txt" ] || todo="$todo $p"
done
[ -z "$todo" ] && { echo "DONE ($(ls $OUT/*.txt 2>/dev/null|wc -l)/$TOTAL)"; exit 0; }

# Process in time-bounded parallel waves
for p in $todo; do
  now=$(date +%s); [ $((now-START)) -ge $BUDGET ] && break
  ocr_one "$p" "$PDF" "$OUT" "$IMG" &
  while [ "$(jobs -r | wc -l)" -ge "$NPROC" ]; do wait -n; done
done
wait
n=$(ls $OUT/*.txt 2>/dev/null|wc -l)
[ "$n" -ge "$TOTAL" ] && echo "DONE ($n/$TOTAL)" || echo "MORE ($n/$TOTAL)"
