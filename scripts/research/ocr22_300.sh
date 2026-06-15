#!/usr/bin/env bash
# 250-DPI OCR for book 22 (Medicolegal Investigation of Death, scanned, 553 pp).
# Resumable: skips pages whose output file already exists. English text -> -l eng.
set -u
export OMP_THREAD_LIMIT=1   # 1 thread/process -> true 8x parallelism, no thrashing
PDF=attached_assets/research_corpus/22.pdf
OUT=attached_assets/research_corpus/ocr22
IMG=/tmp/o22img300
mkdir -p "$OUT" "$IMG"
TOTAL=$(pdfinfo "$PDF" 2>/dev/null | awk -F: '/^Pages/{gsub(/ /,"",$2);print $2}')
NPROC=8
DPI=250   # 250 == 300 quality on this scan, ~40% faster (150 was too low -> blank)

ocr_one() {
  local p="$1"
  local pp; pp=$(printf "%04d" "$p")
  [ -f "$OUT/$pp.txt" ] && return
  pdftoppm -png -r "$DPI" -f "$p" -l "$p" "$PDF" "$IMG/$pp" 2>/dev/null
  local img; img=$(ls "$IMG/$pp"*.png 2>/dev/null | head -1)
  if [ -z "$img" ]; then echo "" > "$OUT/$pp.txt"; return; fi
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
echo "OCR_COMPLETE $(ls "$OUT"/*.txt 2>/dev/null | wc -l)/$TOTAL" > "$OUT/_status.txt"
