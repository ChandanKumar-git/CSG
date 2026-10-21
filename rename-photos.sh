#!/usr/bin/env bash
# Renames all .jpeg / .jpg files inside ./images/ to photo01.jpg, photo02.jpg, ...
# in the order the shell sorts them (which matches the order they appear in Finder).
#
# Usage from the CSG folder:
#   bash rename-photos.sh
#
# Safe: it will not overwrite existing photoNN.jpg files.

set -e
cd "$(dirname "$0")/images"

i=1
shopt -s nullglob nocaseglob
for f in *.jpeg *.jpg *.png; do
  # skip already-renamed files
  if [[ "$f" =~ ^photo[0-9]{2}\.jpg$ ]]; then
    continue
  fi
  new=$(printf "photo%02d.jpg" "$i")
  # find next available slot
  while [[ -e "$new" ]]; do
    i=$((i+1))
    new=$(printf "photo%02d.jpg" "$i")
  done
  mv -n -- "$f" "$new"
  echo "  $f  →  $new"
  i=$((i+1))
done

echo ""
echo "done. renamed files are in ./images/"
