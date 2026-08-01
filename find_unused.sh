#!/bin/bash
for f in $(find src -name "*.ts" -o -name "*.tsx"); do
  filename=$(basename "$f")
  basename="${filename%.*}"
  # exclude entry points
  if [[ "$basename" == "main" || "$basename" == "App" || "$basename" == "vite-env.d" || "$basename" == "types" ]]; then continue; fi
  # check if referenced
  count=$(grep -r -l "$basename" src/ | grep -v "$f" | wc -l)
  if [ "$count" -eq 0 ]; then
    echo "$f"
  fi
done
