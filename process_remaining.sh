#!/bin/bash
# Обрабатывает только оставшиеся события (06 и далее)

INBOX="./photos/inbox"
OUTPUT="./photos/events"

should_skip() {
  local name="$1"
  local lower
  lower=$(echo "${name##*.}" | tr 'A-Z' 'a-z')
  [[ "$name" == ".DS_Store" ]] && return 0
  [[ "$lower" == "png" ]] && return 0
  [[ "$name" == Duolingo* ]] && return 0
  return 1
}

process_event() {
  local event_dir="$1"
  local event_id
  event_id=$(basename "$event_dir")
  echo "▶ $event_id"
  local out_dir="$OUTPUT/$event_id"
  mkdir -p "$out_dir"

  local photo_idx=0 video_idx=0

  while IFS= read -r -d '' file; do
    local fname lower
    fname=$(basename "$file")
    lower=$(echo "${fname##*.}" | tr 'A-Z' 'a-z')
    should_skip "$fname" && continue

    case "$lower" in
      heic|jpg|jpeg|webp)
        photo_idx=$((photo_idx + 1))
        local seq base
        seq=$(printf '%03d' $photo_idx)
        base="$out_dir/p${seq}"
        echo "  📷 $fname → p${seq}"
        sips --resampleHeightWidthMax 480  -s format jpeg -s formatOptions 82 "$file" --out "${base}.thumb.jpg" 2>/dev/null
        sips --resampleHeightWidthMax 1200 -s format jpeg -s formatOptions 85 "$file" --out "${base}.full.jpg"  2>/dev/null
        ;;
      mov|mp4)
        video_idx=$((video_idx + 1))
        local seq base
        seq=$(printf '%03d' $video_idx)
        base="$out_dir/v${seq}"
        echo "  🎬 $fname → v${seq}"
        ffmpeg -hwaccel videotoolbox -i "$file" \
          -c:v h264_videotoolbox -b:v 4000k -maxrate 6000k \
          -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2:0:0" \
          -c:a aac -b:a 128k -movflags +faststart \
          -y "${base}.mp4" 2>/dev/null
        ffmpeg -hwaccel videotoolbox -i "$file" -ss 0.5 -vframes 1 -q:v 3 -update 1 \
          "${base}.vthumb_raw.jpg" 2>/dev/null
        if [ -f "${base}.vthumb_raw.jpg" ]; then
          sips --resampleHeightWidthMax 480 -s format jpeg -s formatOptions 80 \
            "${base}.vthumb_raw.jpg" --out "${base}.thumb.jpg" 2>/dev/null
          rm "${base}.vthumb_raw.jpg"
        fi
        ;;
    esac
  done < <(find "$event_dir" -maxdepth 1 -type f -print0 | sort -z)

  echo "  ✓ ${photo_idx} фото, ${video_idx} видео"
}

# Оставшиеся события
for event_id in \
  06-akademicheskaya \
  07-ski-zima-2025-2026 \
  08-14-fevralya-i-vesna \
  09-novaya-kvartira \
  10-kadnikov-mayskie \
  11-vr-vecher \
  12-nakanune-dr \
  portrait-wanted \
  portrait-final
do
  process_event "$INBOX/$event_id"
done

echo ""
echo "✅ Готово. Запусти: python3 generate_manifest.py"
