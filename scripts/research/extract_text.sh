#!/usr/bin/env bash
set -u
SRC=attached_assets/research_corpus
OUT=$SRC/text
START=$(date +%s); BUDGET=70
for f in $SRC/[0-9][0-9].pdf; do
  nn=$(basename "$f" .pdf)
  txt="$OUT/$nn.txt"
  [ -s "$txt" ] && continue
  now=$(date +%s); [ $((now-START)) -ge $BUDGET ] && { echo MORE; exit 0; }
  pdftotext -enc UTF-8 "$f" "$txt" 2>/dev/null
done
echo DONE
