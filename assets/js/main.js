/* Colorificio Papotti — comportamento del sito (vanilla JS, nessuna dipendenza) */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     Modalità demo: unico interruttore = body[data-demo="on|off"].
     Con "off" il CSS nasconde banner e filigrana; qui si ripulisce
     anche titolo e direttiva robots (le pagine statiche vanno comunque
     rigenerate con `python3 tools/build.py --no-demo`, vedi README).
     --------------------------------------------------------------- */
  var demoOn = body.getAttribute('data-demo') === 'on';
  if (!demoOn) {
    doc.title = doc.title.replace(/^\[DEMO\]\s*/, '');
    var robots = doc.querySelector('meta[name="robots"]');
    if (robots) robots.parentNode.removeChild(robots);
  }

  /* L'altezza del banner demo può variare (testo a capo su mobile) */
  var banner = doc.querySelector('.demo-banner');
  function syncBanner() {
    var h = banner && demoOn ? banner.offsetHeight : 0;
    root.style.setProperty('--demo-h', h + 'px');
  }
  if (banner && demoOn) {
    syncBanner();
    if ('ResizeObserver' in window) new ResizeObserver(syncBanner).observe(banner);
    else window.addEventListener('resize', syncBanner);
  }

  /* ---------------------------------------------------------------
     Header: cambia stile dopo un po' di scroll
     --------------------------------------------------------------- */
  var header = doc.querySelector('[data-header]');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------------------------------------------------------
     Menu mobile
     --------------------------------------------------------------- */
  var menuBtn = doc.querySelector('[data-menu-btn]');
  var menu = doc.querySelector('[data-menu]');
  var mobileMq = window.matchMedia('(max-width: 1019px)');

  function setMenu(open) {
    if (!menuBtn || !menu) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.querySelector('.menu-btn__label').textContent = open ? 'Chiudi' : 'Menu';
    menu.classList.toggle('is-open', open);
    body.classList.toggle('menu-open', open && mobileMq.matches);
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a') && mobileMq.matches) setMenu(false);
    });
    mobileMq.addEventListener('change', function () { setMenu(false); });
  }

  /* Sottomenu "Settori" (desktop): apertura con click, hover e tastiera */
  var subItem = doc.querySelector('.nav__item--sub');
  if (subItem) {
    var toggle = subItem.querySelector('.nav__toggle');
    var openSub = function (open) {
      subItem.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', function () {
      openSub(!subItem.classList.contains('is-open'));
    });
    var hoverTimer;
    subItem.addEventListener('mouseenter', function () {
      if (!window.matchMedia('(hover: hover)').matches || mobileMq.matches) return;
      clearTimeout(hoverTimer); openSub(true);
    });
    subItem.addEventListener('mouseleave', function () {
      if (!window.matchMedia('(hover: hover)').matches) return;
      hoverTimer = setTimeout(function () { openSub(false); }, 140);
    });
    subItem.addEventListener('focusout', function (e) {
      if (!subItem.contains(e.relatedTarget)) openSub(false);
    });
  }

  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (menu && menu.classList.contains('is-open') && mobileMq.matches) { setMenu(false); if (menuBtn) menuBtn.focus(); }
    if (subItem && subItem.classList.contains('is-open')) {
      subItem.classList.remove('is-open');
      var t = subItem.querySelector('.nav__toggle'); t.setAttribute('aria-expanded', 'false'); t.focus();
    }
  });
  doc.addEventListener('click', function (e) {
    if (subItem && !subItem.contains(e.target)) {
      subItem.classList.remove('is-open');
      subItem.querySelector('.nav__toggle').setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------------------------------------------------------------
     Comparsa allo scroll (IntersectionObserver)
     --------------------------------------------------------------- */
  var reveals = doc.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------------------------------------------------------------
     Ventaglio dei settori: la striscia attiva si apre con mouse,
     tastiera (focus) e tocco (sotto i 900px diventa un elenco di card).
     --------------------------------------------------------------- */
  var fan = doc.querySelector('[data-fan]');
  if (fan) {
    var items = Array.prototype.slice.call(fan.querySelectorAll('.fan__item'));
    var activate = function (item) {
      items.forEach(function (i) { i.classList.toggle('is-active', i === item); });
    };
    items.forEach(function (item) {
      item.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') activate(item); });
      item.addEventListener('focus', function () { activate(item); });
    });
  }

  /* ---------------------------------------------------------------
     Laboratorio colore: dimostrazione visiva, non una formulazione.
     --------------------------------------------------------------- */
  var lab = doc.querySelector('[data-lab]');
  if (lab) {
    var FAMILIES = [
      { id: 'neutri', name: 'Neutri', tones: ['#efeee9', '#d9d6cf', '#b7b4ad', '#8c8a86', '#5f6165'] },
      { id: 'terre', name: 'Terre', tones: ['#e8d5b9', '#d2b48c', '#b98a5e', '#9a6644', '#6f4631'] },
      { id: 'gialli', name: 'Gialli', tones: ['#f5e6a1', '#f0cf58', '#e3b020', '#c98f0f', '#9a6b0a'] },
      { id: 'rossi', name: 'Rossi', tones: ['#eebcb0', '#e0806a', '#cf3a1e', '#a52a17', '#6f1d12'] },
      { id: 'blu', name: 'Blu', tones: ['#bcd0ea', '#7ea3d6', '#2f6bc2', '#1f4a91', '#14305e'] },
      { id: 'verdi', name: 'Verdi', tones: ['#cfe1c4', '#9cc48b', '#5a9a63', '#2f7348', '#1d4b31'] }
    ];
    var famBox = lab.querySelector('[data-lab-families]');
    var toneBox = lab.querySelector('[data-lab-tones]');
    var readout = lab.querySelector('[data-lab-readout]');
    var stage = lab.querySelector('[data-lab-stage]');
    var surfaceBtns = lab.querySelectorAll('[data-surface]');
    var state = { fam: 1, tone: 1, surface: 'parete' };

    function render() {
      var fam = FAMILIES[state.fam];
      var color = fam.tones[state.tone];
      stage.style.setProperty('--surface', color);
      stage.setAttribute('data-surface', state.surface);
      readout.textContent = 'Anteprima: ' + fam.name + ', tonalità ' + (state.tone + 1) + ' di 5 su ' + (state.surface === 'parete' ? 'parete interna' : 'carrozzeria') + '.';

      Array.prototype.forEach.call(famBox.children, function (b, i) { b.setAttribute('aria-pressed', String(i === state.fam)); });
      toneBox.innerHTML = '';
      fam.tones.forEach(function (c, i) {
        var b = doc.createElement('button');
        b.type = 'button';
        b.className = 'lab__tone';
        b.style.setProperty('--c', c);
        b.setAttribute('aria-pressed', String(i === state.tone));
        b.setAttribute('aria-label', fam.name + ', tonalità ' + (i + 1) + ' di 5');
        b.addEventListener('click', function () { state.tone = i; render(); });
        toneBox.appendChild(b);
      });
      surfaceBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-surface') === state.surface)); });
    }

    FAMILIES.forEach(function (f, i) {
      var b = doc.createElement('button');
      b.type = 'button';
      b.className = 'lab__fam';
      b.innerHTML = '<i style="--c:' + f.tones[2] + '"></i>' + f.name;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { state.fam = i; render(); });
      famBox.appendChild(b);
    });
    surfaceBtns.forEach(function (b) {
      b.addEventListener('click', function () { state.surface = b.getAttribute('data-surface'); render(); });
    });
    render();
  }
})();
