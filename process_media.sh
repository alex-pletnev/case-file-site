#!/bin/bash
# Конвертация inbox → photos/events
# Фото: sips → JPEG thumb (480px) + full (1200px)
# Видео: ffmpeg → MP4 (720p) + sips → JPEG thumbnail

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

for event_dir in "$INBOX"/*/; do
  event_id=$(basename "$event_dir")
  echo "▶ $event_id"
  out_dir="$OUTPUT/$event_id"
  mkdir -p "$out_dir"

  photo_idx=0
  video_idx=0

  while IFS= read -r -d '' file; do
    fname=$(basename "$file")
    lower=$(echo "${fname##*.}" | tr 'A-Z' 'a-z')
    should_skip "$fname" && continue

    case "$lower" in
      heic|jpg|jpeg|webp)
        photo_idx=$((photo_idx + 1))
        seq=$(printf '%03d' $photo_idx)
        base="$out_dir/p${seq}"
        echo "  📷 $fname → p${seq}"

        sips --resampleHeightWidthMax 480 -s format jpeg -s formatOptions 82 \
          "$file" --out "${base}.thumb.jpg" 2>/dev/null

        sips --resampleHeightWidthMax 1200 -s format jpeg -s formatOptions 85 \
          "$file" --out "${base}.full.jpg" 2>/dev/null
        ;;

      mov|mp4)
        video_idx=$((video_idx + 1))
        seq=$(printf '%03d' $video_idx)
        base="$out_dir/v${seq}"
        echo "  🎬 $fname → v${seq}"

        # VideoToolbox — аппаратное кодирование, намного быстрее для HEVC
        ffmpeg -hwaccel videotoolbox -i "$file" \
          -c:v h264_videotoolbox -b:v 4000k -maxrate 6000k \
          -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2:0:0" \
          -c:a aac -b:a 128k -movflags +faststart \
          -y "${base}.mp4" 2>/dev/null

        # Thumbnail: кадр на 0.5s → sips resize
        ffmpeg -i "$file" -ss 0.5 -vframes 1 -q:v 3 -update 1 \
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
done

echo ""
echo "✅ Готово. Запусти: python3 generate_manifest.py"
