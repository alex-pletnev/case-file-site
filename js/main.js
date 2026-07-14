/* ═══════════════════════════════════════
   ДЕЛО № 15.07 — Главный скрипт
   ═══════════════════════════════════════ */

'use strict';

/* ─── Звук (синтез через Web Audio API) ─ */
const SFX = (() => {
  let ac = null;
  let muted = false;
  const THROTTLE = 300;
  let lastPlay = 0;

  function getCtx() {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  function createNoise(ctx, duration) {
    const len = Math.ceil(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  function playStamp() {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);

    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(90, now);
    thud.frequency.exponentialRampToValueAtTime(40, now + 0.08);
    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.9, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    thud.connect(thudGain);
    thudGain.connect(master);
    thud.start(now);
    thud.stop(now + 0.15);

    const noise = createNoise(ctx, 0.08);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1200;
    noiseFilter.Q.value = 0.5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now);
    noise.stop(now + 0.08);
  }

  function playPaper() {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const noise = createNoise(ctx, 0.4);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3500;
    filter.Q.value = 0.3;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0, now);
    env.gain.linearRampToValueAtTime(0.25, now + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    noise.connect(filter);
    filter.connect(env);
    env.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.4);
  }

  function play(name) {
    if (muted) return;
    if (!ac) return;
    const now = Date.now();
    if (now - lastPlay < THROTTLE) return;
    lastPlay = now;
    try {
      if (name === 'stamp') playStamp();
      else if (name === 'paper') playPaper();
    } catch { /* ignore */ }
  }

  function toggleMute() {
    muted = !muted;
    sessionStorage.setItem('muted', muted ? '1' : '0');
    return muted;
  }

  function getMuted() { return muted; }

  function restoreState() {
    muted = sessionStorage.getItem('muted') === '1';
  }

  function unlock() {
    try { getCtx(); } catch { /* Safari private */ }
  }

  document.addEventListener('touchstart', unlock, { once: true, passive: true });
  document.addEventListener('click', unlock, { once: true });

  return { play, toggleMute, getMuted, restoreState };
})();

/* ─── Лайтбокс (полный размер фото) ──── */
const LIGHTBOX = (() => {
  let overlay, img, captionEl, dateEl, closeBtn;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const polaroid = document.createElement('div');
    polaroid.className = 'lightbox-polaroid';

    img = document.createElement('img');
    img.alt = '';

    dateEl = document.createElement('div');
    dateEl.className = 'lightbox-date mono';

    captionEl = document.createElement('div');
    captionEl.className = 'lightbox-caption hand';

    const inner = document.createElement('div');
    inner.className = 'lightbox-inner';

    closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.innerHTML = '×';
    closeBtn.setAttribute('aria-label', 'Закрыть');

    polaroid.appendChild(img);
    polaroid.appendChild(dateEl);
    polaroid.appendChild(captionEl);
    inner.appendChild(closeBtn);
    inner.appendChild(polaroid);
    overlay.appendChild(inner);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
  }

  function open(jpgUrl, captionText, dateText) {
    if (!overlay) build();
    img.src = jpgUrl;
    captionEl.textContent = captionText || '';
    dateEl.textContent = dateText || '';
    overlay.classList.add('open');
    closeBtn.focus();
    SFX.play('paper');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  return { open, close };
})();

/* ─── Галерея события ─────────────────── */
const GALLERY = (() => {
  let overlay = null;

  function open(event) {
    if (overlay) close(true);
    SFX.play('paper');

    overlay = document.createElement('div');
    overlay.className = 'gallery-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', event.title);

    /* Заголовок */
    const header = document.createElement('div');
    header.className = 'gallery-header';

    const titleWrap = document.createElement('div');

    const titleEl = document.createElement('div');
    titleEl.className = 'gallery-title stamp-text';
    titleEl.textContent = event.title;

    const dateEl = document.createElement('div');
    dateEl.className = 'gallery-date mono';
    dateEl.textContent = event.dateLabel;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'gallery-close';
    closeBtn.innerHTML = '×';
    closeBtn.setAttribute('aria-label', 'Закрыть галерею');
    closeBtn.addEventListener('click', () => close());

    titleWrap.appendChild(titleEl);
    titleWrap.appendChild(dateEl);
    header.appendChild(titleWrap);
    header.appendChild(closeBtn);

    /* Подпись */
    const capEl = document.createElement('div');
    capEl.className = 'gallery-caption hand';
    capEl.textContent = event.caption || '';

    /* Коллаж */
    const collage = document.createElement('div');
    collage.className = 'gallery-collage';

    const items = event.items || [];
    items.forEach((item, idx) => {
      const el = item.type === 'video'
        ? buildVideo(item, event)
        : buildPhoto(item, event, idx);
      collage.appendChild(el);
    });

    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'gallery-empty mono';
      empty.textContent = 'Фотографии скоро появятся';
      collage.appendChild(empty);
    }

    overlay.appendChild(header);
    overlay.appendChild(capEl);
    overlay.appendChild(collage);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onEsc);

    requestAnimationFrame(() => overlay.classList.add('open'));

    /* Запускаем видео */
    overlay.querySelectorAll('video').forEach(v => v.play().catch(() => {}));
  }

  function buildPhoto(item, event, idx) {
    const wrap = document.createElement('div');
    wrap.className = 'gallery-item gallery-photo';
    /* Чередуем небольшой наклон */
    const rotations = [-3, 1.5, -1, 2.5, -2, 1, -2.5, 3];
    wrap.style.transform = `rotate(${rotations[idx % rotations.length]}deg)`;

    const pin = document.createElement('div');
    pin.className = 'polaroid-pin';
    pin.setAttribute('aria-hidden', 'true');

    const imgEl = document.createElement('img');
    imgEl.src = `./photos/events/${event.id}/${item.file}.thumb.jpg`;
    imgEl.alt = event.caption || '';
    imgEl.loading = 'lazy';
    imgEl.decoding = 'async';

    wrap.appendChild(pin);
    wrap.appendChild(imgEl);

    wrap.addEventListener('click', () => {
      LIGHTBOX.open(
        `./photos/events/${event.id}/${item.file}.full.jpg`,
        event.caption,
        event.dateLabel
      );
    });

    return wrap;
  }

  function buildVideo(item, event) {
    const wrap = document.createElement('div');
    wrap.className = 'gallery-item gallery-video';

    const video = document.createElement('video');
    video.src = `./photos/events/${event.id}/${item.file}.mp4`;
    video.muted = true;
    video.autoplay = false; /* запускаем вручную после открытия */
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');

    const soundBtn = document.createElement('button');
    soundBtn.className = 'video-sound-btn';
    soundBtn.setAttribute('aria-label', 'Включить звук');
    soundBtn.textContent = '🔇';

    const toggleSound = () => {
      video.muted = !video.muted;
      soundBtn.textContent = video.muted ? '🔇' : '🔊';
      soundBtn.setAttribute('aria-label', video.muted ? 'Включить звук' : 'Выключить звук');
    };

    video.addEventListener('click', toggleSound);
    soundBtn.addEventListener('click', e => { e.stopPropagation(); toggleSound(); });

    wrap.appendChild(video);
    wrap.appendChild(soundBtn);
    return wrap;
  }

  function close(immediate) {
    if (!overlay) return;
    overlay.querySelectorAll('video').forEach(v => v.pause());
    document.removeEventListener('keydown', onEsc);

    if (immediate) {
      overlay.remove();
      overlay = null;
      document.body.style.overflow = '';
      return;
    }

    overlay.classList.remove('open');
    const el = overlay;
    setTimeout(() => {
      el.remove();
      if (overlay === el) overlay = null;
    }, 300);
    document.body.style.overflow = '';
  }

  function onEsc(e) { if (e.key === 'Escape') close(); }

  return { open, close };
})();

/* ─── Анимация появления ─────────────── */
function initAppearAnimations() {
  const items = document.querySelectorAll('.timeline-item, .sticky-note');
  if (!items.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });

  items.forEach(el => io.observe(el));
}

/* ─── Штамп-анимация ─────────────────── */
function initStampAnimations() {
  const stamps = document.querySelectorAll('.stamp-detain, .verdict-stamp-wrap');
  if (!stamps.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !e.target.classList.contains('stamped')) {
        setTimeout(() => {
          e.target.classList.add('stamped');
          SFX.play('stamp');
        }, 200);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  stamps.forEach(el => io.observe(el));
}

/* ─── Красная нить (SVG) ─────────────── */
const THREAD = (() => {
  let svgEl, pathEl, totalLen = 0;
  let pinPoints = [];

  function init() {
    const container = document.getElementById('section-timeline');
    if (!container) return;

    const polaroids = container.querySelectorAll('.polaroid');
    if (!polaroids.length) return;

    svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.id = 'timeline-thread';
    svgEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;overflow:visible;pointer-events:none;z-index:4;';

    pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke', '#B3352B');
    pathEl.setAttribute('stroke-width', '3');
    pathEl.setAttribute('stroke-linecap', 'round');
    pathEl.setAttribute('stroke-linejoin', 'round');
    pathEl.style.filter = 'drop-shadow(0 0 3px rgba(179,53,43,0.9)) drop-shadow(0 1px 6px rgba(179,53,43,0.4))';

    svgEl.appendChild(pathEl);
    container.style.position = 'relative';
    container.prepend(svgEl);

    buildPath();
    setupScroll();
  }

  function getPinPoint(el) {
    const container = document.getElementById('section-timeline');
    let top = 0, left = 0;
    let cur = el;
    while (cur && cur !== container) {
      top += cur.offsetTop;
      left += cur.offsetLeft;
      cur = cur.offsetParent;
    }
    return { x: left + el.offsetWidth / 2, y: top + 10 };
  }

  function buildPath() {
    const container = document.getElementById('section-timeline');
    if (!container) return;
    const polaroids = container.querySelectorAll('.polaroid');
    pinPoints = Array.from(polaroids).map(getPinPoint);
    if (pinPoints.length < 2) return;

    const W = container.offsetWidth;
    const leftEdge  = W * 0.06;
    const rightEdge = W * 0.94;

    let d = `M ${pinPoints[0].x} ${pinPoints[0].y}`;
    for (let i = 1; i < pinPoints.length; i++) {
      const p0 = pinPoints[i - 1];
      const p1 = pinPoints[i];
      const dy = p1.y - p0.y;
      const swingX = i % 2 === 1 ? rightEdge : leftEdge;
      d += ` C ${swingX} ${p0.y + dy * 0.32}, ${swingX} ${p0.y + dy * 0.68}, ${p1.x} ${p1.y}`;
    }

    pathEl.setAttribute('d', d);
    try {
      totalLen = pathEl.getTotalLength();
      pathEl.style.strokeDasharray = totalLen;
      pathEl.style.strokeDashoffset = totalLen;
    } catch { totalLen = 0; }

    if (pinPoints.length) {
      const maxY = Math.max(...pinPoints.map(p => p.y));
      svgEl.setAttribute('height', maxY + 60);
    }
  }

  function setupScroll() {
    if (!totalLen) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      pathEl.style.strokeDashoffset = 0;
      return;
    }

    function update() {
      const container = document.getElementById('section-timeline');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const windowH = window.innerHeight;
      const start = rect.top + window.scrollY - windowH;
      const end = rect.bottom + window.scrollY - windowH * 0.3;
      const progress = Math.max(0, Math.min(1, (window.scrollY - start) / (end - start)));
      pathEl.style.strokeDashoffset = totalLen * (1 - progress);
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function rebuild() {
    if (!svgEl) return;
    buildPath();
  }

  return { init, rebuild };
})();

/* ─── Сердце из нити ─────────────────── */
function buildThreadHeart() {
  const wrap = document.querySelector('.thread-heart-wrap');
  if (!wrap) return;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '-60 -60 120 100');
  svg.setAttribute('width', '120');
  svg.setAttribute('height', '100');
  svg.style.display = 'block';
  svg.style.margin = '0 auto';

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M0,20 C0,20 -45,-10 -45,-35 C-45,-55 -20,-65 0,-45 C20,-65 45,-55 45,-35 C45,-10 0,20 0,20 Z');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#B3352B');
  path.setAttribute('stroke-width', '3');
  path.setAttribute('stroke-linecap', 'round');
  path.style.filter = 'drop-shadow(0 2px 6px rgba(179,53,43,0.6))';
  svg.appendChild(path);
  wrap.appendChild(svg);

  const len = path.getTotalLength ? path.getTotalLength() : 300;
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = len;
  path.style.transition = 'stroke-dashoffset 1.5s ease';

  const io = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      path.style.strokeDashoffset = 0;
      io.disconnect();
    }
  }, { threshold: 0.5 });
  io.observe(wrap);
}

/* ─── Анимация открытия папки ────────── */
function initFolderOpen() {
  const btn = document.getElementById('open-case-btn');
  const front = document.querySelector('.folder-front');
  if (!btn || !front) return;

  function doOpen() {
    front.classList.add('open');
    SFX.play('paper');
    setTimeout(() => {
      const target = document.getElementById('section-wanted');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 600);
  }

  btn.addEventListener('click', doOpen);
  document.querySelector('.folder-wrap')?.addEventListener('click', e => {
    if (e.target.closest('#open-case-btn')) return;
    doOpen();
  });
}

/* ─── Кнопка Mute ────────────────────── */
function initMuteBtn() {
  const btn = document.getElementById('mute-btn');
  if (!btn) return;
  SFX.restoreState();
  updateIcon(btn);
  btn.addEventListener('click', () => { SFX.toggleMute(); updateIcon(btn); });
}

function updateIcon(btn) {
  btn.textContent = SFX.getMuted() ? '🔇' : '🔊';
  btn.title = SFX.getMuted() ? 'Включить звук' : 'Выключить звук';
}

/* ─── Рендер таймлайна ───────────────── */
async function renderTimeline() {
  const container = document.getElementById('timeline-items');
  if (!container) return;

  let data;
  try {
    const resp = await fetch('./photos/photos.json');
    data = await resp.json();
  } catch {
    console.warn('photos.json не найден');
    return;
  }

  if (!data.events || !data.events.length) return;

  data.events.forEach((event, idx) => {
    const card = buildEventCard(event, idx + 1);
    container.appendChild(card);

    if (event.note) {
      container.appendChild(buildStickyNote(event.note));
    }
  });

  initAppearAnimations();
  requestAnimationFrame(() => THREAD.init());
}

function buildEventCard(event, num) {
  const div = document.createElement('div');
  div.className = num % 2 === 0 ? 'timeline-item right' : 'timeline-item';

  const polaroid = document.createElement('div');
  polaroid.className = 'polaroid event-card';
  const rotations = [-6, 3, -4, 7, -2.5, 5, -5, 3.5];
  const jitters   = [-5, 10, -8, 12, -10, 7, -6, 11];
  const rotate = rotations[num % rotations.length];
  const jitter = window.innerWidth < 600 ? 0 : jitters[num % jitters.length];
  polaroid.style.transform = `rotate(${rotate}deg) translateX(${jitter}px)`;

  const tape = document.createElement('div');
  tape.className = 'polaroid-tape';
  tape.setAttribute('aria-hidden', 'true');

  const tag = document.createElement('div');
  tag.className = 'evidence-tag mono';
  tag.textContent = `СОБЫТИЕ № ${String(num).padStart(2, '0')}`;

  /* Превью: первое фото или видеоthumb */
  const items = event.items || [];
  const firstPhoto = items.find(i => i.type === 'photo');
  const firstVideo = items.find(i => i.type === 'video');
  const preview = firstPhoto || firstVideo;

  const imgWrap = document.createElement('div');
  imgWrap.className = 'polaroid-img-wrap';

  if (preview) {
    const imgEl = document.createElement('img');
    imgEl.src = `./photos/events/${event.id}/${preview.file}.thumb.jpg`;
    imgEl.alt = event.title;
    imgEl.loading = num <= 2 ? 'eager' : 'lazy';
    imgEl.decoding = 'async';
    if (preview.landscape) {
      imgEl.width = 480; imgEl.height = 360;
    } else {
      imgEl.width = 360; imgEl.height = 480;
    }
    imgWrap.appendChild(imgEl);

    if (firstVideo && !firstPhoto) {
      const playIcon = document.createElement('div');
      playIcon.className = 'card-play-icon';
      playIcon.setAttribute('aria-hidden', 'true');
      playIcon.textContent = '▶';
      imgWrap.appendChild(playIcon);
    }
  } else {
    /* Нет фото — плейсхолдер */
    imgWrap.classList.add('polaroid-placeholder');
    imgWrap.textContent = String(num).padStart(2, '0');
  }

  /* Счётчик медиа */
  if (items.length > 1) {
    const badge = document.createElement('div');
    badge.className = 'card-count mono';
    const photoCount = items.filter(i => i.type === 'photo').length;
    const videoCount = items.filter(i => i.type === 'video').length;
    const parts = [];
    if (photoCount) parts.push(`${photoCount} фото`);
    if (videoCount) parts.push(`${videoCount} видео`);
    badge.textContent = parts.join(' · ');
    imgWrap.appendChild(badge);
  }

  const dateDiv = document.createElement('div');
  dateDiv.className = 'polaroid-date';
  dateDiv.textContent = event.dateLabel || '';

  const capDiv = document.createElement('div');
  capDiv.className = 'polaroid-caption hand';
  capDiv.textContent = event.title || '';

  const pin = document.createElement('div');
  pin.className = 'timeline-pin';
  pin.setAttribute('aria-hidden', 'true');
  polaroid.appendChild(tape);
  polaroid.appendChild(pin);
  polaroid.appendChild(tag);
  polaroid.appendChild(imgWrap);
  polaroid.appendChild(dateDiv);
  polaroid.appendChild(capDiv);

  if (items.length > 0) {
    polaroid.classList.add('clickable');
    polaroid.addEventListener('click', () => GALLERY.open(event));
  }

  div.appendChild(polaroid);
  return div;
}

function buildStickyNote(text) {
  const note = document.createElement('div');
  note.className = 'sticky-note hand';
  note.textContent = text;
  return note;
}

/* ─── Рендер секции 2 (ориентировка) ─── */
async function renderWanted() {
  let content, photos;
  try {
    const [cr, pr] = await Promise.all([fetch('./content.json'), fetch('./photos/photos.json')]);
    content = await cr.json();
    photos = await pr.json();
  } catch { return; }

  const s2 = content.section2?.wanted;
  if (!s2) return;

  const nameEl = document.getElementById('wanted-name');
  if (nameEl) nameEl.textContent = `${content.recipientName}, ${s2.age} лет`;

  const traitsEl = document.getElementById('wanted-traits');
  if (traitsEl && s2.traits) {
    traitsEl.innerHTML = '';
    s2.traits.forEach(t => {
      const p = document.createElement('div');
      p.className = 'trait-item';
      p.textContent = t;
      traitsEl.appendChild(p);
    });
  }

  const dangerEl = document.getElementById('wanted-danger');
  if (dangerEl) dangerEl.textContent = s2.danger;

  const seenEl = document.getElementById('wanted-lastseen');
  if (seenEl) seenEl.textContent = s2.lastSeen;

  const stampEl = document.getElementById('wanted-stamp');
  if (stampEl) stampEl.textContent = content.section2.stampText;

  /* Фото ориентировки */
  if (photos.wanted) {
    const { event: evId, file } = photos.wanted;
    const src = `./photos/events/${evId}/${file}.thumb.jpg`;
    document.querySelector('.wanted-polaroid source')?.remove();
    const imgEl = document.querySelector('.wanted-polaroid img');
    if (imgEl) { imgEl.src = src; imgEl.alt = content.recipientName; }
  }
}

/* ─── Рендер секции 4 (показания) ─────── */
async function renderTestimony() {
  let content;
  try {
    const r = await fetch('./content.json');
    content = await r.json();
  } catch { return; }

  const s4 = content.section4;
  if (!s4) return;

  const introEl = document.getElementById('testimony-intro');
  if (introEl) introEl.textContent = s4.intro;

  const bodyEl = document.getElementById('testimony-body');
  if (bodyEl && s4.paragraphs) {
    bodyEl.innerHTML = '';
    s4.paragraphs.forEach(txt => {
      const p = document.createElement('p');
      p.textContent = txt;
      bodyEl.appendChild(p);
    });
  }

  const sigNameEl = document.getElementById('sig-name');
  if (sigNameEl) sigNameEl.textContent = content.authorName;

  const sigDateEl = document.getElementById('sig-date');
  if (sigDateEl) sigDateEl.textContent = content.acquaintanceDate;
}

/* ─── Рендер секции 5 (вердикт) ─────── */
async function renderVerdict() {
  let content, photos;
  try {
    const [cr, pr] = await Promise.all([fetch('./content.json'), fetch('./photos/photos.json')]);
    content = await cr.json();
    photos = await pr.json();
  } catch { return; }

  const s5 = content.section5;
  if (!s5) return;

  const verdictEl = document.getElementById('verdict-text');
  if (verdictEl) verdictEl.textContent = s5.verdict;

  const subEl = document.getElementById('verdict-sub');
  if (subEl) subEl.textContent = s5.verdictSub;

  const sentenceEl = document.getElementById('sentence-text');
  if (sentenceEl) sentenceEl.textContent = s5.sentence;

  const bdEl = document.getElementById('birthday-text');
  if (bdEl) bdEl.textContent = s5.birthday;

  const footerEl = document.getElementById('footer-text');
  if (footerEl) footerEl.textContent = s5.footer;

  /* Финальное фото */
  if (photos.final) {
    const { event: evId, file } = photos.final;
    const fullSrc = `./photos/events/${evId}/${file}.full.jpg`;
    document.querySelector('.final-polaroid source')?.remove();
    const imgEl = document.querySelector('.final-polaroid img');
    if (imgEl) { imgEl.src = fullSrc; imgEl.alt = photos.final.caption || ''; }
    const cap = document.querySelector('.final-caption');
    if (cap) cap.textContent = photos.final.caption || '';
  }
}

/* ─── Рендер обложки ─────────────────── */
async function renderCover() {
  let content;
  try {
    const r = await fetch('./content.json');
    content = await r.json();
  } catch { return; }

  const numEl = document.getElementById('cover-case-num');
  if (numEl) numEl.textContent = `ДЕЛО № ${content.caseNumber}`;

  const titleEl = document.getElementById('cover-title');
  if (titleEl) titleEl.textContent = content.section1.caseTitle;

  const subEl = document.getElementById('cover-subtitle');
  if (subEl) subEl.textContent = content.section1.subtitle.replace('[Имя]', content.recipientName);

  const btnEl = document.getElementById('open-case-btn');
  if (btnEl) btnEl.textContent = content.section1.buttonText;

  const numStampEl = document.getElementById('cover-stamp-num');
  if (numStampEl) numStampEl.textContent = `Дело № ${content.caseNumber} / стр. 001`;
}

/* ─── Ресайз ─────────────────────────── */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => THREAD.rebuild(), 300);
}, { passive: true });

/* ─── Инициализация ──────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    renderCover(),
    renderWanted(),
    renderTestimony(),
    renderVerdict(),
  ]);

  await renderTimeline();

  buildThreadHeart();
  initFolderOpen();
  initMuteBtn();
  initStampAnimations();
});
