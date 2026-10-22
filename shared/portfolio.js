/* shared/portfolio.js — slider, filters, grid, project popup and gallery viewer for architecture.html and
   interiors.html. Reads window.SAP_PROJECTS (shared/projects.js), filtered by <body data-collection="…">.
   Plain ES5 script, no modules, no dependencies (runs on every browser from the last several years, including
   older iPhones and Android WebViews). */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- tunable values */
  var CONFIG = {
    SHOW_ARROWS: false,
    AUTOPLAY_MS: 2500,             // gap between slides in ms; 0 = off. Pauses on hover and focus, and stays off with reduced motion.
    HEADER_AFTER_SLIDER: 'hide',   // what the header does once the slider has left the viewport:
                                   //   'hide'   gone, so the page shows projects only (default, as requested)
                                   //   'solid'  solid #fbfbf9 bar with a 1px line (the original brief)
                                   //   'reveal' solid bar that returns when scrolling up
    SHOW_FILTERS: false,           // filter row (ALL / typologies). Off = projects only; switch on for more projects.
    FILTER_FADE_MS: 250,           // grid fade when a filter changes
    SWIPE_PX: 50                   // horizontal swipe distance that changes slide
  };

  var body = document.body;
  var collection = body.getAttribute('data-collection');
  var projects = (window.SAP_PROJECTS || []).filter(function (p) { return p.collection === collection; });
  var reduced = function () { return matchMedia('(prefers-reduced-motion: reduce)').matches; };

  function el(tag, cls, attrs, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  function byId(slug) { for (var i = 0; i < projects.length; i++) if (projects[i].slug === slug) return projects[i]; return null; }
  
  /* <picture> with WebP + JPG fallback, srcset/sizes and intrinsic width/height (no layout shift) */
  function picture(img, o) {
    o = o || {};
    var ws = img.widths, pic = el('picture', o.picCls);
    var set = function (ext) { return ws.map(function (w) { return img.src + '-' + w + '.' + ext + ' ' + w + 'w'; }).join(', '); };
    pic.appendChild(el('source', null, { type: 'image/webp', srcset: set('webp'), sizes: o.sizes }));
    var im = el('img', o.cls, {
      src: img.src + '-' + ws[ws.length - 1] + '.jpg', srcset: set('jpg'), sizes: o.sizes,
      alt: o.alt != null ? o.alt : img.alt, width: img.width, height: img.height,
      loading: o.eager ? 'eager' : 'lazy', decoding: 'async', fetchpriority: o.eager ? 'high' : null
    });
    if (o.position) im.style.objectPosition = o.position;
    pic.appendChild(im);
    return pic;
  }

  var popupOpenFlag = false, viewerOpenFlag = false;

  /* ================================================================ SLIDER */
  var sliderEl = document.querySelector('[data-slider]');
  var sliderInView = true;
  (function buildSlider() {
    if (!sliderEl) return;
    var featured = projects.filter(function (p) { return p.featured; })
      .sort(function (a, b) { return (a.featuredOrder || 0) - (b.featuredOrder || 0); });
    var slides = [];
    featured.forEach(function (p) {
      slides.push({ p: p, img: p.cover.hero });          /* one slide per featured project */
    });
    if (!slides.length) { sliderEl.hidden = true; return; }

    var stage = el('div', 'slider__stage');
    var nodes = slides.map(function (s, i) {
      var portrait = (s.img.height && s.img.width) ? (s.img.height > s.img.width) : false;
      var li = el('div', 'slider__slide' + (portrait ? ' slider__slide--portrait' : ''), {
        role: 'group', 'aria-roledescription': 'slide', 'aria-label': (i + 1) + ' of ' + slides.length
      });
      if (portrait) {
        var bgSrc = s.img.src + '-' + (s.img.widths[s.img.widths.length - 1] || s.img.widths[0]) + '.jpg';
        li.appendChild(el('img', 'slider__backdrop', { src: bgSrc, alt: '', 'aria-hidden': 'true', loading: i ? 'lazy' : 'eager' }));
      }
      var picEl = picture(s.img, { picCls: 'slider__picture', cls: 'slider__img', sizes: '100vw', eager: i === 0 });
      var imgTag = picEl.querySelector('img');
      if (imgTag) {
        imgTag.addEventListener('load', function () {
          if (this.naturalHeight > this.naturalWidth && !li.classList.contains('slider__slide--portrait')) {
            li.classList.add('slider__slide--portrait');
            if (!li.querySelector('.slider__backdrop')) {
              var bg = el('img', 'slider__backdrop', { src: this.currentSrc || this.src, alt: '', 'aria-hidden': 'true' });
              li.insertBefore(bg, li.firstChild);
            }
          }
        });
      }
      li.appendChild(picEl);
      stage.appendChild(li);
      return li;
    });
    sliderEl.appendChild(stage);
    sliderEl.appendChild(el('div', 'slider__scrim slider__scrim--top'));
    sliderEl.appendChild(el('div', 'slider__scrim slider__scrim--bottom'));

    var typ = el('span', 'label slider__typology'), view = el('button', 'slider__view', { type: 'button' }, 'View →');
    var title = el('h2', 'slider__title');
    var inner = el('div', 'slider__caption-inner');
    var meta = el('div', 'slider__meta'); meta.appendChild(typ); meta.appendChild(view);
    inner.appendChild(meta); inner.appendChild(title);
    var caption = el('div', 'slider__caption'); caption.appendChild(inner);
    sliderEl.appendChild(caption);

    /* Screen-reader announcements: only for changes the visitor makes. Automatic changes stay silent, otherwise a
       screen reader would interrupt itself every few seconds. */
    var live = el('div', 'sr-only', { 'aria-live': 'polite', 'aria-atomic': 'true' });
    sliderEl.appendChild(live);

    var dashes = el('div', 'slider__dashes', { role: 'group', 'aria-label': 'Choose slide' });
    var dashBtns = slides.map(function (s, i) {
      var b = el('button', 'slider__dash', { type: 'button', 'aria-label': 'Slide ' + (i + 1) + ': ' + s.p.title });
      b.addEventListener('click', function () { go(i, false, true); });
      dashes.appendChild(b); return b;
    });
    if (slides.length > 1) sliderEl.appendChild(dashes);

    var prev = el('button', 'slider__arrow slider__arrow--prev', { type: 'button', 'aria-label': 'Previous project' }, '←');
    var next = el('button', 'slider__arrow slider__arrow--next', { type: 'button', 'aria-label': 'Next project' }, '→');
    if (CONFIG.SHOW_ARROWS) { sliderEl.appendChild(prev); sliderEl.appendChild(next); }   /* off: the slider advances by itself */
    var scroll = el('button', 'slider__scroll', { type: 'button' }, 'Scroll ');
    scroll.appendChild(el('span', null, { 'aria-hidden': 'true' }, '↓'));
    sliderEl.appendChild(scroll);

    var idx = -1, swapTimer;
    function go(i, silent, byUser) {
      i = (i + slides.length) % slides.length;
      if (i === idx) return;
      var first = idx < 0;
      idx = i;
      nodes.forEach(function (n, k) {
        var on = k === i;
        n.classList.toggle('slider__slide--active', on);
        n.setAttribute('aria-hidden', on ? 'false' : 'true');
        if (on) n.removeAttribute('inert'); else n.setAttribute('inert', '');
      });
      dashBtns.forEach(function (b, k) { if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      var s = slides[i];
      var apply = function () {
        typ.textContent = s.p.typology; title.textContent = s.p.title;
        view.setAttribute('aria-label', 'View project: ' + s.p.title);
        inner.classList.remove('slider__caption-inner--swap');
      };
      clearTimeout(swapTimer);
      if (first || reduced()) apply(); else { inner.classList.add('slider__caption-inner--swap'); swapTimer = setTimeout(apply, 180); }
      live.textContent = (byUser && !silent) ? s.p.title + ', ' + s.p.typology + ', slide ' + (i + 1) + ' of ' + slides.length : '';
      current = s;
      if (!first) restartAuto();
    }
    var current;
    prev.addEventListener('click', function () { go(idx - 1, false, true); });
    next.addEventListener('click', function () { go(idx + 1, false, true); });
    view.addEventListener('click', function () { openProject(current.p, view); });
    scroll.addEventListener('click', function () {
      var w = document.querySelector('[data-work]');
      if (w) w.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    });
    go(0, true);

    /* keyboard: arrow keys while the slider is on screen */
    document.addEventListener('keydown', function (e) {
      if (popupOpenFlag || viewerOpenFlag || !sliderInView) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === 'ArrowLeft') go(idx - 1, false, true); else if (e.key === 'ArrowRight') go(idx + 1, false, true);
    });
    /* touch swipe */
    var sx = null;
    sliderEl.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
    sliderEl.addEventListener('touchend', function (e) {
      if (sx == null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > CONFIG.SWIPE_PX) go(idx + (dx < 0 ? 1 : -1), false, true);
    }, { passive: true });
    /* autoplay: one slide every AUTOPLAY_MS, restarted after any manual change so the gap is always the same */
    var paused = false, autoTimer = null;
    function restartAuto() {
      clearTimeout(autoTimer);
      if (!(CONFIG.AUTOPLAY_MS > 0) || reduced() || slides.length < 2) return;
      autoTimer = setTimeout(function () {
        if (!paused && !popupOpenFlag && !document.hidden && sliderInView) go(idx + 1); else restartAuto();
      }, CONFIG.AUTOPLAY_MS);
    }
    ['mouseenter', 'focusin'].forEach(function (t) { sliderEl.addEventListener(t, function () { paused = true; }); });
    ['mouseleave', 'focusout'].forEach(function (t) { sliderEl.addEventListener(t, function (e) { if (t === 'focusout' && sliderEl.contains(e.relatedTarget)) return; paused = false; restartAuto(); }); });
    restartAuto();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { sliderInView = en[0].isIntersecting; }).observe(sliderEl);
    }
  })();


  /* ================================================================ FILTERS + GRID */
  var grid = document.querySelector('[data-grid]');
  var filtersEl = document.querySelector('[data-filters]');
  var activeFilter = 'all';

  function renderGrid() {
    if (!grid) return;
    var list = projects.filter(function (p) { return activeFilter === 'all' || p.typology === activeFilter; });
    grid.textContent = '';
    if (!list.length) { grid.appendChild(el('p', 'grid__empty', null, 'New projects are being added. Please check back soon.')); return; }
    var n = list.length, rem = n % 4, lastRow = n - rem;
    list.forEach(function (p, i) {
      /* Wide 2-column tiles complete the last row (as in the mockup): 3 left → first is wide, 2 left → both are wide */
      var wide = (rem === 3 && i === lastRow) || (rem === 2 && i >= lastRow);
      var a = el('a', 'tile' + (wide ? ' tile--wide' : ''), { href: '#' + p.slug, 'aria-label': p.title + ', ' + p.typology, 'data-slug': p.slug });
      a.appendChild(picture(p.cover.grid, {
        picCls: 'tile__picture', cls: 'tile__img', alt: '', position: p.cover.position,
        sizes: wide ? '(max-width:599px) 100vw, 50vw' : '(max-width:599px) 100vw, (max-width:1099px) 50vw, 25vw'
      }));
      a.appendChild(el('span', 'tile__shade', { 'aria-hidden': 'true' }));
      var cap = el('span', 'tile__caption', { 'aria-hidden': 'true' });
      cap.appendChild(el('span', 'label tile__typology', null, p.typology));
      cap.appendChild(el('span', 'tile__title', null, p.title));
      a.appendChild(cap);
      a.appendChild(el('span', 'tile__arrow', { 'aria-hidden': 'true' }, '↗'));
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        e.preventDefault(); openProject(p, a);
      });
      grid.appendChild(a);
    });
  }
  function buildFilters() {
    if (!filtersEl || !CONFIG.SHOW_FILTERS) return;
    var types = []; projects.forEach(function (p) { if (types.indexOf(p.typology) < 0) types.push(p.typology); });
    filtersEl.hidden = false; filtersEl.textContent = '';
    ['all'].concat(types).forEach(function (t) {
      var b = el('button', 'filters__btn', { type: 'button', 'aria-pressed': t === 'all' ? 'true' : 'false' }, t === 'all' ? 'All' : t);
      b.addEventListener('click', function () {
        if (t === activeFilter) return;
        activeFilter = t;
        Array.prototype.forEach.call(filtersEl.children, function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
        grid.classList.add('grid--fading');
        setTimeout(function () { renderGrid(); grid.classList.remove('grid--fading'); }, reduced() ? 0 : CONFIG.FILTER_FADE_MS);
      });
      filtersEl.appendChild(b);
    });
  }
  buildFilters();
  renderGrid();

  /* ================================================================ PROJECT POPUP */
  var popup = el('div', 'popup', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'popup-title', 'aria-hidden': 'true' });
  popup.innerHTML =
    '<div class="popup__panel">' +
      '<div class="popup__info" tabindex="0" aria-label="Project information">' +
        '<div class="popup__bar">' +
          '<button class="popup__btn popup__btn--icon" type="button" data-close aria-label="Close project">✕</button>' +
          '<button class="popup__btn" type="button" data-gallery>' +
            '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="1" y="1" width="5" height="5" fill="currentColor"/><rect x="8" y="1" width="5" height="5" fill="currentColor"/><rect x="1" y="8" width="5" height="5" fill="currentColor"/><rect x="8" y="8" width="5" height="5" fill="currentColor"/></svg>Gallery</button>' +
        '</div>' +
        '<div class="popup__body">' +
          '<h2 class="popup__title" id="popup-title"></h2>' +
          '<ul class="popup__meta" data-meta></ul>' +
          '<p class="popup__desc popup__desc--short" data-short></p>' +
          '<div class="popup__desc popup__desc--full" data-full hidden></div>' +
          '<button class="popup__more" type="button" data-more aria-expanded="false">Read more <span aria-hidden="true">+</span></button>' +
          '<div data-credits-wrap hidden><h3 class="popup__credits-title">Project details</h3><dl class="popup__credits" data-credits></dl></div>' +
        '</div>' +
      '</div>' +
      '<div class="popup__right"><div class="popup__progress" data-progress></div><div class="popup__media" tabindex="0" aria-label="Project images" data-media></div></div>' +
    '</div>';
  body.appendChild(popup);
  var $ = function (s) { return popup.querySelector(s); };
  var panel = $('.popup__panel'), info = $('.popup__info'), media = $('[data-media]'), progress = $('[data-progress]');
  var closeBtn = $('[data-close]'), galleryBtn = $('[data-gallery]'), moreBtn = $('[data-more]');
  var currentProject = null, opener = null, baseTitle = document.title;
  var stacked = matchMedia('(max-width:899px)');

  function fillPopup(p) {
    $('#popup-title').textContent = p.title;
    var m = $('[data-meta]'); m.textContent = '';
    [p.location, [p.type, p.typology].filter(Boolean).join(' · '), p.year, p.status].forEach(function (v) {
      if (v) m.appendChild(el('li', null, null, v));
    });
    var paras = (p.description || '').split(/\n+/).filter(Boolean);
    $('[data-short]').textContent = paras.join(' ');
    var full = $('[data-full]'); full.textContent = '';
    paras.forEach(function (v) { full.appendChild(el('p', null, null, v)); });
    /* Details table: only fields that exist. Nothing is shown for missing data. */
    var c = p.credits || {}, dl = $('[data-credits]'), rows = 0; dl.textContent = '';
    [['Client', c.client], ['Location', c.location], ['Type', p.type], ['Year', c.year], ['Area', c.area], ['Status', c.status], ['Team', c.team]]
      .forEach(function (r) {
        if (r[1] == null || r[1] === '') return;
        dl.appendChild(el('dt', null, null, r[0])); dl.appendChild(el('dd', null, null, r[1])); rows++;
      });
    popup.setAttribute('data-has-details', rows ? 'true' : 'false');
    media.textContent = '';
    p.images.forEach(function (im) {
      media.appendChild(picture(im, { picCls: 'popup__picture', cls: 'popup__img', sizes: '(max-width:899px) 100vw, 52vw' }));
    });
    setExpanded(false);
  }
  function setExpanded(on) {
    $('[data-short]').hidden = on; $('[data-full]').hidden = !on; $('[data-credits-wrap]').hidden = !on || popup.getAttribute('data-has-details') !== 'true';
    moreBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
    moreBtn.innerHTML = on ? 'Read less <span aria-hidden="true">−</span>' : 'Read more <span aria-hidden="true">+</span>';
  }
  moreBtn.addEventListener('click', function () { setExpanded(moreBtn.getAttribute('aria-expanded') !== 'true'); });

  function scroller() { return stacked.matches ? panel : media; }
  function updateProgress() {
    var s = scroller(), max = s.scrollHeight - s.clientHeight;
    progress.style.setProperty('--p', max > 0 ? Math.min(1, s.scrollTop / max).toFixed(4) : 0);
  }
  media.addEventListener('scroll', updateProgress, { passive: true });
  panel.addEventListener('scroll', updateProgress, { passive: true });

  var inertTargets = function () { return document.querySelectorAll('.topbar,[data-slider],[data-work],[data-sap-footer],.skip-link'); };
  function setHash(slug) { try { if (location.hash !== '#' + slug) location.hash = slug; } catch (e) { /* sandboxed frame */ } }
  function clearHash() {
    try { if (location.hash) history.replaceState(null, '', location.pathname + location.search); }
    catch (e) { try { location.hash = ''; } catch (e2) { /* ignore */ } }
  }

  function openProject(p, from, fromHash) {
    if (currentProject === p) return;
    currentProject = p; opener = from || document.activeElement;
    fillPopup(p);
    popup.classList.add('popup--open'); popup.setAttribute('aria-hidden', 'false');
    popupOpenFlag = true;
    document.title = p.title + ' | ' + baseTitle;
    document.documentElement.style.overflow = 'hidden';
    inertTargets().forEach(function (n) { n.setAttribute('inert', ''); });
    panel.scrollTop = 0; info.scrollTop = 0; media.scrollTop = 0; updateProgress();
    closeBtn.focus({ preventScroll: true });
    if (!fromHash) setHash(p.slug);
  }
  function closeProject(fromHash) {
    if (!currentProject) return;
    if (viewerOpenFlag) closeViewer(true);
    var slug = currentProject.slug, back = opener;
    currentProject = null; popupOpenFlag = false;
    document.title = baseTitle;
    popup.classList.remove('popup--open'); popup.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    inertTargets().forEach(function (n) { n.removeAttribute('inert'); });
    if (!back || !document.contains(back)) back = grid && grid.querySelector('[data-slug="' + slug + '"]');
    if (back && back.focus) back.focus({ preventScroll: true });
    if (!fromHash) clearHash();
  }
  closeBtn.addEventListener('click', function () { closeProject(); });
  popup.addEventListener('click', function (e) { if (e.target === popup) closeProject(); });

  /* ================================================================ GALLERY VIEWER */
  var viewer = el('div', 'viewer', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Image gallery', 'aria-hidden': 'true' });
  viewer.innerHTML =
    '<div class="viewer__bar"><span class="label" data-count aria-live="polite"></span>' +
    '<button class="viewer__btn" type="button" data-vclose aria-label="Close gallery">✕</button></div>' +
    '<div class="viewer__stage"><button class="viewer__btn viewer__nav viewer__nav--prev" type="button" data-vprev aria-label="Previous image">←</button>' +
    '<div class="viewer__slot" data-vimg></div>' +
    '<button class="viewer__btn viewer__nav viewer__nav--next" type="button" data-vnext aria-label="Next image">→</button></div>' +
    '<p class="viewer__foot" data-vcap></p>';
  body.appendChild(viewer);
  var vimg = viewer.querySelector('[data-vimg]'), vcount = viewer.querySelector('[data-count]'), vcap = viewer.querySelector('[data-vcap]');
  var vindex = 0;

  function showViewer(i) {
    var imgs = currentProject.images; vindex = (i + imgs.length) % imgs.length;
    var im = imgs[vindex];
    vimg.textContent = '';
    vimg.appendChild(picture(im, { cls: 'viewer__img', sizes: '100vw', eager: true }));
    vcount.textContent = (vindex + 1) + ' / ' + imgs.length;
    vcap.textContent = im.alt;
  }
  function openViewer() {
    if (!currentProject) return;
    /* start on the image currently in view in the popup */
    var s = scroller(), pics = media.querySelectorAll('.popup__picture'), start = 0;
    for (var i = 0; i < pics.length; i++) { if (pics[i].getBoundingClientRect().bottom > (stacked.matches ? 120 : media.getBoundingClientRect().top + 60)) { start = i; break; } }
    showViewer(start);
    viewer.classList.add('viewer--open'); viewer.setAttribute('aria-hidden', 'false'); viewerOpenFlag = true;
    popup.setAttribute('inert', '');
    viewer.querySelector('[data-vclose]').focus({ preventScroll: true });
  }
  function closeViewer(silent) {
    viewerOpenFlag = false;
    viewer.classList.remove('viewer--open'); viewer.setAttribute('aria-hidden', 'true');
    popup.removeAttribute('inert');
    if (!silent) galleryBtn.focus({ preventScroll: true });
  }
  var vx = null, vstage = viewer.querySelector('.viewer__stage');
  vstage.addEventListener('touchstart', function (e) { vx = e.changedTouches[0].clientX; }, { passive: true });
  vstage.addEventListener('touchend', function (e) {
    if (vx == null) return;
    var dx = e.changedTouches[0].clientX - vx; vx = null;
    if (Math.abs(dx) > CONFIG.SWIPE_PX) showViewer(vindex + (dx < 0 ? 1 : -1));
  }, { passive: true });
  galleryBtn.addEventListener('click', openViewer);
  viewer.querySelector('[data-vclose]').addEventListener('click', function () { closeViewer(); });
  viewer.querySelector('[data-vprev]').addEventListener('click', function () { showViewer(vindex - 1); });
  viewer.querySelector('[data-vnext]').addEventListener('click', function () { showViewer(vindex + 1); });

  /* keyboard: Esc, arrows and the focus trap for whichever layer is on top */
  document.addEventListener('keydown', function (e) {
    var layer = viewerOpenFlag ? viewer : popupOpenFlag ? popup : null;
    if (!layer) return;
    if (e.key === 'Escape') { e.preventDefault(); if (viewerOpenFlag) closeViewer(); else closeProject(); return; }
    if (viewerOpenFlag && e.key === 'ArrowLeft') { showViewer(vindex - 1); return; }
    if (viewerOpenFlag && e.key === 'ArrowRight') { showViewer(vindex + 1); return; }
    if (e.key !== 'Tab') return;
    var f = Array.prototype.filter.call(layer.querySelectorAll('button,a[href],[tabindex="0"]'), function (n) { return !n.hidden && n.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (!layer.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ================================================================ DEEP LINK (#project-slug) */
  function fromHash() {
    var key = location.hash.slice(1);
    try { key = decodeURIComponent(key); } catch (err) { /* keep the raw value */ }
    var p = byId(key);
    if (p) openProject(p, null, true); else if (currentProject) closeProject(true);
  }
  addEventListener('hashchange', fromHash);
  if (location.hash.length > 1) fromHash();
})();
