#!/usr/bin/env python3
"""
Сканирует photos/events/, определяет landscape через размеры,
заполняет items[] в photos.json.
"""

import json, os, subprocess, re
from pathlib import Path

EVENTS_DIR = Path('photos/events')
MANIFEST   = Path('photos/photos.json')

def get_dims(path):
    """Возвращает (width, height) через sips."""
    try:
        out = subprocess.check_output(
            ['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(path)],
            stderr=subprocess.DEVNULL, text=True
        )
        w = int(re.search(r'pixelWidth:\s*(\d+)', out).group(1))
        h = int(re.search(r'pixelHeight:\s*(\d+)', out).group(1))
        return w, h
    except Exception:
        return 0, 0

def scan_event(event_id):
    event_dir = EVENTS_DIR / event_id
    if not event_dir.is_dir():
        return []

    items = []

    # Все thumb-файлы определяют, что есть в событии
    # Фото: p001.thumb.jpg
    # Видео: v001.mp4 + v001.thumb.jpg

    files = sorted(event_dir.iterdir())

    # Собираем уникальные stems
    photo_stems = sorted({
        f.stem.replace('.thumb', '').replace('.full', '')
        for f in files if f.name.startswith('p') and '.thumb.' in f.name
    })

    video_stems = sorted({
        f.stem.replace('.thumb', '')
        for f in files if f.name.startswith('v') and '.mp4' in f.name
    })

    for stem in photo_stems:
        thumb = event_dir / f'{stem}.thumb.jpg'
        if not thumb.exists():
            continue
        w, h = get_dims(thumb)
        landscape = w > h
        items.append({'type': 'photo', 'file': stem, 'landscape': landscape})

    for stem in video_stems:
        mp4 = event_dir / f'{stem}.mp4'
        if not mp4.exists():
            continue
        thumb = event_dir / f'{stem}.thumb.jpg'
        landscape = False
        if thumb.exists():
            w, h = get_dims(thumb)
            landscape = w > h
        items.append({'type': 'video', 'file': stem, 'landscape': landscape})

    return items

def main():
    with open(MANIFEST) as f:
        data = json.load(f)

    changed = 0
    for event in data.get('events', []):
        eid = event['id']
        items = scan_event(eid)
        event['items'] = items
        print(f'  {eid}: {len(items)} элементов')
        changed += len(items)

    # Специальные — wanted и final
    for key in ('wanted', 'final'):
        entry = data.get(key)
        if entry:
            eid = entry.get('event')
            if eid:
                event_dir = EVENTS_DIR / eid
                # Берём первый p001
                thumb = event_dir / 'p001.thumb.jpg'
                if thumb.exists():
                    entry['file'] = 'p001'
                    print(f'  {key}: {eid}/p001')

    with open(MANIFEST, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'\n✅ photos.json обновлён ({changed} элементов суммарно)')

if __name__ == '__main__':
    main()
