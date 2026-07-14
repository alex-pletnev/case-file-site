#!/usr/bin/env python3
"""Process source photos: resize to full/thumb, save as WebP + JPG."""
import os, json
from PIL import Image, ImageOps

SOURCE = 'photos/source'
FULL_DIR = 'photos/full'
THUMB_DIR = 'photos/thumb'
FULL_SIZE = 1200
THUMB_SIZE = 480

MONTHS_RU = {
    '01': 'января', '02': 'февраля', '03': 'марта', '04': 'апреля',
    '05': 'мая', '06': 'июня', '07': 'июля', '08': 'августа',
    '09': 'сентября', '10': 'октября', '11': 'ноября', '12': 'декабря'
}

def date_label(iso):
    y, m, d = iso.split('-')
    return f"{int(d)} {MONTHS_RU[m]} {y}"

def save_image(img, path_no_ext, max_size, webp_quality=82, jpg_quality=85):
    img_copy = img.copy()
    img_copy.thumbnail((max_size, max_size), Image.LANCZOS)
    img_copy.save(path_no_ext + '.webp', 'WEBP', quality=webp_quality, method=4)
    img_copy.save(path_no_ext + '.jpg', 'JPEG', quality=jpg_quality, optimize=True)

def process(src_filename, dest_slug):
    src_path = os.path.join(SOURCE, src_filename)
    img = Image.open(src_path)
    img = ImageOps.exif_transpose(img)
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    save_image(img, os.path.join(FULL_DIR, dest_slug), FULL_SIZE)
    save_image(img, os.path.join(THUMB_DIR, dest_slug), THUMB_SIZE)
    w, h = img.size
    return w, h

timeline_raw = [
    ('IMG_3959.jpeg',  '001-first-look',     '2024-09-25', -3, 'Первое фото вместе. Улика номер один.'),
    ('IMG_4277.jpeg',  '002-spring',          '2025-04-16',  2, 'Весна. Подозреваемая выглядела подозрительно счастливой.'),
    ('IMG_6312.jpeg',  '003-spring-walk',     '2025-04-18', -2, 'Прогулка. Следствие впервые осознало серьёзность ситуации.'),
    ('IMG_4354.jpeg',  '004-june-a',          '2025-06-22',  3, 'Июнь. Улыбка была зафиксирована как основная улика.'),
    ('IMG_4357.jpeg',  '005-june-b',          '2025-06-22', -1, 'Тот же день. Улика приобщена к материалам дела.'),
    ('IMG_4374.jpeg',  '006-june-c',          '2025-06-22',  2, 'Вечер. Потерпевший отмечает: было очень хорошо.'),
    ('IMG_4390.jpeg',  '007-july4',           '2025-07-04', -3, 'Начало июля. Тепло было не только от солнца.'),
    ('IMG_4405.jpeg',  '008-july8a',          '2025-07-08',  1, 'День вместе. Следствие теряет нить — слишком много смеха.'),
    ('IMG_4440.jpeg',  '009-july8b',          '2025-07-08', -2, 'Тот же день. Вещдок: совместное счастье.'),
    ('IMG_4482.jpeg',  '010-july12a',         '2025-07-12',  3, 'Лето в разгаре. Подозреваемая улыбалась особенно ярко.'),
    ('IMG_4507.jpeg',  '011-july12b',         '2025-07-12', -1, 'Продолжение дня. Потерпевший не жалеет ни о чём.'),
    ('IMG_5935.jpeg',  '012-july28a',         '2025-07-28',  2, 'Вечерняя вылазка. Огни города — свидетели.'),
    ('IMG_5944.jpeg',  '013-july28b',         '2025-07-28', -3, 'Тот же вечер. Следователь признаёт: момент был идеальным.'),
    ('IMG_4552.jpeg',  '014-july29',          '2025-07-29',  1, 'Следующий день. Подозреваемая снова была неотразима.'),
    ('IMG_4593.jpeg',  '015-aug16a',          '2025-08-16', -2, 'Август. Лето уходит, улики остаются.'),
    ('IMG_4609.jpeg',  '016-aug16b',          '2025-08-16',  3, 'Послеполудень. Потерпевший зафиксировал улыбку на память.'),
    ('IMG_4655.jpeg',  '017-sep20a',          '2025-09-20', -1, 'Осень пришла. Сердце всё равно тепло.'),
    ('IMG_4664.jpeg',  '018-sep20b',          '2025-09-20',  2, 'Тот же сентябрь. Подозреваемая выглядела осенне-прекрасной.'),
    ('IMG_4697.jpeg',  '019-oct6a',           '2025-10-06', -3, 'Октябрь. Листья падали — взгляды нет.'),
    ('IMG_4700.jpeg',  '020-oct6b',           '2025-10-06',  1, 'Тот же октябрь. Следствие отмечает: холодно снаружи, тепло внутри.'),
    ('IMG_4835.jpeg',  '021-jan6',            '2026-01-06', -2, 'Январь. Новый год, те же чувства — только сильнее.'),
    ('IMG_4878.jpeg',  '022-jan15',           '2026-01-15',  3, 'Середина января. Подозреваемая по-прежнему на свободе — в моём сердце.'),
    ('IMG_4883.jpeg',  '023-jan16a',          '2026-01-16', -1, 'Январский вечер. Улика: совместный смех до слёз.'),
    ('IMG_4896.jpeg',  '024-jan16b',          '2026-01-16',  2, 'Тот же вечер. Следствие окончательно запуталось — и счастливо.'),
    ('IMG_4912.jpeg',  '025-jan29',           '2026-01-29', -3, 'Конец января. Зима, но рядом с ней — лето.'),
    ('IMG_5044.jpeg',  '026-valentine',       '2026-02-14',  1, 'День влюблённых. Потерпевший напоминает: каждый день — такой день.'),
    ('IMG_5084.jpeg',  '027-march',           '2026-03-22', -2, 'Март. Улыбка — главная примета весны.'),
    ('IMG_5178.jpeg',  '028-apr16a',          '2026-04-16',  3, 'Апрель. Год с небольшим. Чувства только растут.'),
    ('IMG_5180.jpeg',  '029-apr16b',          '2026-04-16', -1, 'Тот же день. Подозреваемая снова зафиксирована на месте счастья.'),
    ('IMG_5330.jpeg',  '030-jul5a',           '2026-07-05',  2, 'Начало июля. Лето снова вместе — как и должно быть.'),
    ('IMG_5331.jpeg',  '031-jul5b',           '2026-07-05', -3, 'Тот же день. Следователь отмечает: лучшего напарника не найти.'),
    ('IMG_5339.jpeg',  '032-jul6a',           '2026-07-06',  1, 'Накануне. Подозреваемая не подозревает, что это попадёт в дело.'),
    ('IMG_5340.jpeg',  '033-jul6b',           '2026-07-06', -2, 'Последняя улика перед приговором. Самая любимая.'),
]

notes_at = {
    8:  'Подозреваемая действовала обдуманно: сначала улыбнулась.',
    16: 'Следствие отмечает: потерпевший сопротивления не оказывал.',
    24: 'Следователь начинает подозревать, что сам к ней неравнодушен.',
    31: 'Следствие зашло в тупик: расследовать нечего, он просто её любит.',
}

print("Processing timeline photos...")
timeline_entries = []
for i, (src, slug, date_iso, rotate, caption) in enumerate(timeline_raw, 1):
    print(f"  {i:02d}/{len(timeline_raw)} {src} → {slug}")
    process(src, slug)
    entry = {
        "id": f"{i:03d}",
        "file": slug,
        "date": date_iso,
        "dateLabel": date_label(date_iso),
        "caption": caption,
        "note": notes_at.get(i),
        "rotate": rotate
    }
    timeline_entries.append(entry)

print("Processing wanted portrait...")
process('cafe-portrait.jpeg', 'wanted-portrait')

print("Processing final photo...")
process('spb-sunlight.jpeg', 'final-photo')

photos_json = {
    "timeline": timeline_entries,
    "wanted": {"file": "wanted-portrait", "caption": "[Имя]"},
    "final": {"file": "final-photo", "caption": "Моя любимая улика"}
}

with open('photos/photos.json', 'w', encoding='utf-8') as f:
    json.dump(photos_json, f, ensure_ascii=False, indent=2)

print("Done! photos/photos.json written.")
