#!/usr/bin/env bash
# Resumable, self-limiting downloader for the Drive corpus listed in ids.txt.
# Skips files already fetched; stops after ~100s so it fits the tool timeout.
# Re-run until it prints DONE. Builds inventory.tsv incrementally.
set -u
cd "$(dirname "$0")/../.."
IDS="scripts/research/ids.txt"
OUT="attached_assets/research_corpus"
INV="scripts/research/inventory.tsv"
LOG="scripts/research/fetch.log"
mkdir -p "$OUT"
[ -f "$INV" ] || echo -e "idx\tid\tbytes\tkind\tpages\ttitle" > "$INV"
START=$(date +%s)

n=0; left=0
while IFS= read -r id; do
  [ -z "$id" ] && continue
  n=$((n+1))
  nn=$(printf "%02d" "$n")
  # skip if already downloaded (any extension)
  if ls "$OUT/${nn}".* >/dev/null 2>&1; then continue; fi
  # stop if we are close to the tool timeout
  if [ $(( $(date +%s) - START )) -ge 100 ]; then left=1; break; fi
  echo "[$nn] downloading $id" >> "$LOG"
  tmp="$OUT/${nn}.bin"
  curl -sL "https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t" \
    -o "$tmp" --max-time 90
  bytes=$(stat -c%s "$tmp" 2>/dev/null || echo 0)
  ft=$(file -b "$tmp")
  kind="other"; ext="bin"; pages=""; title=""
  case "$ft" in
    *PDF*)   kind="pdf";  ext="pdf"
             pages=$(pdfinfo "$tmp" 2>/dev/null | awk -F: '/^Pages/{gsub(/ /,"",$2);print $2}')
             title=$(pdftotext -f 1 -l 2 "$tmp" - 2>/dev/null | tr '\n' ' ' | tr -s ' ' | cut -c1-160)
             ;;
    *Zip*archive*) kind="zip";  ext="zip" ;;
    *image*) kind="image"; ext="img" ;;
    *Excel*|*"Office Open XML"*|*Spreadsheet*) kind="office"; ext="xlsx" ;;
    *HTML*)  kind="HTML_FAIL"; ext="html"
             title=$(head -c 160 "$tmp" | tr '\n' ' ' | tr -s ' ') ;;
    *ASCII*|*UTF-8*|*CSV*|*text*) kind="text"; ext="txt"
             title=$(head -c 160 "$tmp" | tr '\n' ' ' | tr -s ' ') ;;
  esac
  dest="$OUT/${nn}.${ext}"
  mv "$tmp" "$dest"
  printf "%s\t%s\t%s\t%s\t%s\t%s\n" "$nn" "$id" "$bytes" "$kind" "$pages" "$title" >> "$INV"
  echo "[$nn] -> $dest ($bytes bytes, $kind, ${pages:-?}p)" >> "$LOG"
done < "$IDS"

if [ "$left" -eq 0 ]; then echo "DONE" ; else echo "MORE" ; fi
