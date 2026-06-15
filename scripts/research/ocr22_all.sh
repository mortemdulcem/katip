#!/usr/bin/env bash
set -u
PDF=attached_assets/research_corpus/22.pdf
OUT=attached_assets/research_corpus/ocr22
IMG=/tmp/o22img
mkdir -p "$OUT" "$IMG"
TOTAL=$(pdfinfo "$PDF" 2>/dev/null | awk -F: '/^Pages/{gsub(/ /,"",$2);print $2}')
NPROC=$(nproc)
ocr_one() {
  p="$1"
  pp=$(printf "%04d" "$p")
  [ -f "$OUT/$pp.txt" ] && return
  pdftoppm -png -r 150 -f "$p" -l "$p" "$PDF" "$IMG/$pp" 2>/dev/null
  img=$(ls "$IMG/$pp"*.png 2>/dev/null | head -1)
  [ -z "$img" ] && { echo "" > "$OUT/$pp.txt"; return; }
  tesseract "$img" "$OUT/$pp" -l eng --psm 3 >/dev/null 2>&1 || echo "" > "$OUT/$pp.txt"
  rm -f "$img"
}
for p in $(seq 1 "$TOTAL"); do
  pp=$(printf "%04d" "$p")
  [ -f "$OUT/$pp.txt" ] && continue
  ocr_one "$p" &
  while [ "$(jobs -r | wc -l)" -ge "$NPROC" ]; do wait -n; done
done
wait
echo "OCR_COMPLETE $(ls $OUT/*.txt 2>/dev/null|wc -l)/$TOTAL" > "$OUT/_status.txt"
