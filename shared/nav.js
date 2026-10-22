/* =========================================================
   SAP STUDIOS — SHARED SITE CHROME (header, mobile menu, footers)
   Single source of truth for navigation across all pages.
   
   Two Footers:
     - SHORT: Architecture & Interiors (light) and Team, About, Contact, Privacy (dark)
       (1 line: copyright, Privacy Policy, TOP, Instagram & WhatsApp)
     - LARGER: 404 (12-column architectural footer)
   
   Header:
     - Document-flow header, transparent over hero images and solid on normal pages.
     - Plain light solid on pages without a hero.
     - Consistent navigation: HOME, ARCHITECTURE, INTERIORS, TEAM, ABOUT US, CONTACT US →
   
   Plain ES5, no dependencies, no modules.
   ========================================================= */
(function () {
  'use strict';

  /* ----------------------------------------------------------- Configuration */
  var LOGO_SRC = 'assets/images/sap-logo.png';
  var LOGO_W = 1248, LOGO_H = 507;
  var HOME_HREF = 'index.html';
  var CONTACT_HREF = 'contact.html';
  var PRIVACY_HREF = 'privacy.html';
  var STUDIO_NAME = 'SAP Studios';
  var INSTAGRAM_URL = 'https://www.instagram.com/sap.studios_';
  var WHATSAPP_URL = 'https://wa.me/918328386698';

  var LINKS = [
    { key: 'home', label: 'HOME', href: 'index.html' },
    { key: 'architecture', label: 'ARCHITECTURE', href: 'architecture.html' },
    { key: 'interiors', label: 'INTERIORS', href: 'interiors.html' },
    { key: 'team', label: 'TEAM', href: 'team.html' },
    { key: 'about', label: 'ABOUT US', href: 'about.html' }
  ];

  var ICONS = {
    instagram: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3.5 20.5l1.3-4.6A8.5 8.5 0 1 1 8.2 19.3z"/><path d="M9 8.6c.2 2.9 2.6 5.5 6 6.4l1.2-1.3-2-1-.9.8c-1-.4-1.9-1.3-2.3-2.3l.8-.9-1-2z" fill="currentColor" stroke="none"/></svg>',
    arrowUp: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true" focusable="false"><path d="M6 11V1M2 5l4-4 4 4"/></svg>'
  };

  /* ----------------------------------------------------------- Helpers */
  function el(tag, cls, attrs, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) {
      for (var k in attrs) {
        if (attrs[k] != null) n.setAttribute(k, attrs[k]);
      }
    }
    if (text != null) n.textContent = text;
    return n;
  }

  function onMedia(mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn);
  }

  function getPageKey() {
    var p = (document.body.getAttribute('data-page') || '').toLowerCase();
    if (p) return p;
    var path = (window.location.pathname || '').toLowerCase();
    if (path.indexOf('architecture') !== -1) return 'architecture';
    if (path.indexOf('interiors') !== -1) return 'interiors';
    if (path.indexOf('team') !== -1) return 'team';
    if (path.indexOf('about') !== -1) return 'about';
    if (path.indexOf('contact') !== -1) return 'contact';
    if (path.indexOf('privacy') !== -1) return 'privacy';
    if (path.indexOf('404') !== -1) return '404';
    return 'home';
  }

  /* ----------------------------------------------------------- Header Construction */
  function mountHeader(current) {
    var header = el('header', 'topbar');
    header.setAttribute('id', 'site-header');

    function syncViewportInsets() {
      var gutter = Math.max(0, window.innerWidth - document.documentElement.getBoundingClientRect().width);
      var logoWidth = Math.max(126, Math.min(205, window.innerWidth * 0.105));
      header.style.setProperty('--header-scrollbar-gap', gutter + 'px');
      header.style.setProperty('--header-scrollbar-half-gap', (gutter / 2) + 'px');
      header.style.setProperty('--header-logo-width', logoWidth + 'px');
    }
    syncViewportInsets();
    window.addEventListener('resize', syncViewportInsets, { passive: true });

    var brand = el('a', 'topbar__brand', { href: HOME_HREF, 'aria-label': STUDIO_NAME + ', home' });
    var logoImg = el('img', 'topbar__logo', {
      src: LOGO_SRC,
      alt: STUDIO_NAME,
      width: LOGO_W,
      height: LOGO_H,
      decoding: 'async'
    });
    brand.appendChild(logoImg);

    var nav = el('nav', 'topbar__nav', { 'aria-label': 'Primary' });
    var menuLinks = [];
    LINKS.forEach(function (l) {
      var a = el('a', 'topbar__link', { href: l.href }, l.label);
      if (l.key === current) a.setAttribute('aria-current', 'page');
      nav.appendChild(a);

      var m = el('a', 'menu__link', { href: l.href }, l.label.charAt(0) + l.label.slice(1).toLowerCase());
      if (l.key === current) m.setAttribute('aria-current', 'page');
      menuLinks.push(m);
    });

    var cta = el('a', 'topbar__cta', { href: CONTACT_HREF, 'aria-label': 'Contact SAP Studios' }, 'CONTACT US');
    if (current === 'contact') cta.setAttribute('aria-current', 'page');

    var menuBtn = el('button', 'topbar__menu-btn', {
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': 'site-menu'
    }, 'Menu');

    header.appendChild(brand);
    header.appendChild(nav);
    header.appendChild(cta);
    header.appendChild(menuBtn);

    // Mobile menu dialog
    var menu = el('div', 'menu', {
      id: 'site-menu',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Menu'
    });
    menu.hidden = true;

    var closeBtn = el('button', 'menu__close', { type: 'button' }, 'Close');
    menu.appendChild(closeBtn);
    menuLinks.forEach(function (m) { menu.appendChild(m); });
    var menuCta = el('a', 'menu__cta', { href: CONTACT_HREF, 'aria-label': 'Contact SAP Studios' }, 'contact');
    if (current === 'contact') menuCta.setAttribute('aria-current', 'page');
    menu.appendChild(menuCta);

    function pageBehind() {
      return document.querySelectorAll('main, [data-sap-footer], footer, .skip-link');
    }

    function setMenu(open) {
      menu.hidden = !open;
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      var behind = pageBehind();
      for (var i = 0; i < behind.length; i++) {
        if (open) behind[i].setAttribute('inert', '');
        else behind[i].removeAttribute('inert');
      }
      (open ? closeBtn : menuBtn).focus();
    }

    menuBtn.addEventListener('click', function () { setMenu(true); });
    closeBtn.addEventListener('click', function () { setMenu(false); });

    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setMenu(false); return; }
      if (e.key !== 'Tab') return;
      var focusables = menu.querySelectorAll('a[href], button');
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    onMedia(matchMedia('(min-width:900px)'), function (q) {
      if (q.matches && !menu.hidden) setMenu(false);
    });

    // Header styling:
    // Pages without hero (Contact, Privacy, 404): relative in flow with solid light background
    // Hero pages (Architecture, Interiors, Team, About): absolute transparent overlay at top of hero
    if (current === 'contact' || current === 'privacy' || current === '404') {
      header.classList.add('topbar--relative');
    }

    // Insert menu inside header so it belongs to header and scrolls away
    header.appendChild(menu);

    // Insert header at very top of body
    document.body.insertBefore(header, document.body.firstChild);
  }

  /* ----------------------------------------------------------- SHORT Footer (Architecture, Interiors, Team, About, Contact, Privacy) */
  function mountShortFooter(host, variant) {
    host.className = 'site-footer site-footer--short' + (variant === 'dark' ? ' site-footer--dark' : '');
    host.innerHTML = '';

    var leftWrap = el('div', 'site-footer__left');
    var copy = el('span', 'site-footer__text', null, '\u00A9 ' + new Date().getFullYear() + ' ' + STUDIO_NAME + '. All rights reserved. ');
    var privLink = el('a', 'site-footer__privacy-link', { href: PRIVACY_HREF }, 'Privacy Policy');
    leftWrap.appendChild(copy);
    leftWrap.appendChild(privLink);
    host.appendChild(leftWrap);

    var rightWrap = el('div', 'site-footer__right');
    var topBtn = el('a', 'site-footer__top', { href: '#top', 'aria-label': 'Back to top' });
    topBtn.innerHTML = ICONS.arrowUp + ' TOP';
    topBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
    rightWrap.appendChild(topBtn);

    var socialWrap = el('div', 'site-footer__social');
    var ig = el('a', 'site-footer__icon', {
      href: INSTAGRAM_URL,
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': STUDIO_NAME + ' on Instagram'
    });
    ig.innerHTML = ICONS.instagram;
    socialWrap.appendChild(ig);

    var wa = el('a', 'site-footer__icon', {
      href: WHATSAPP_URL,
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': 'Message ' + STUDIO_NAME + ' on WhatsApp'
    });
    wa.innerHTML = ICONS.whatsapp;
    socialWrap.appendChild(wa);

    rightWrap.appendChild(socialWrap);
    host.appendChild(rightWrap);
  }

  /* ----------------------------------------------------------- LARGER Footer (404) */
  function mountLargerFooter(host, current) {
    host.className = 'site-footer site-footer--large';
    host.innerHTML = '';

    var container = el('div', 'footer-container');

    // 12-Column Grid
    var grid = el('div', 'footer-grid');

    // Column 1: Brand
    var brandCol = el('div', 'footer-brand');
    var brandTop = el('div', 'footer-top');
    var brandLink = el('a', 'brand', { href: HOME_HREF, 'aria-label': STUDIO_NAME + ', home' });
    var brandLogo = el('img', 'footer-brand-logo', {
      src: LOGO_SRC,
      alt: STUDIO_NAME,
      width: '1248',
      height: '507',
      loading: 'lazy',
      decoding: 'async'
    });
    brandLink.appendChild(brandLogo);
    brandTop.appendChild(brandLink);
    brandCol.appendChild(brandTop);

    var brandDesc = el('p', 'footer-desc');
    brandDesc.innerHTML = 'Architecture and interiors<br>Lakdikapul, Hyderabad \u2013 500004';
    brandCol.appendChild(brandDesc);
    grid.appendChild(brandCol);

    // Column 2: Explore
    var exploreCol = el('nav', 'footer-explore', { 'aria-label': 'Footer Explore' });
    var expTop = el('div', 'footer-top');
    expTop.appendChild(el('p', 'footer-heading', null, 'EXPLORE'));
    exploreCol.appendChild(expTop);

    var linksWrap = el('div', 'footer-links');
    LINKS.forEach(function (l) {
      var a = el('a', null, { href: l.href }, l.label);
      if (l.key === current) a.setAttribute('aria-current', 'page');
      linksWrap.appendChild(a);
    });
    exploreCol.appendChild(linksWrap);
    grid.appendChild(exploreCol);

    // Column 3: Contact
    var contactCol = el('address', 'footer-contact');
    var conTop = el('div', 'footer-top');
    conTop.appendChild(el('p', 'footer-heading', null, 'CONTACT'));
    contactCol.appendChild(conTop);

    var dl = el('dl', 'footer-list');
    dl.innerHTML =
      '<dt>EMAIL</dt><dd><a href="mailto:design@sapstudios.in">design@sapstudios.in</a></dd>' +
      '<dt>PHONE</dt><dd><a href="tel:+918328386698">+91 83283 86698</a><small>Also on WhatsApp</small></dd>' +
      '<dt>INSTAGRAM</dt><dd><a href="' + INSTAGRAM_URL + '" target="_blank" rel="noopener noreferrer">@sap.studios_</a></dd>';
    contactCol.appendChild(dl);
    grid.appendChild(contactCol);

    container.appendChild(grid);

    // Bottom Legal Bar
    var legal = el('div', 'footer-legal');
    legal.appendChild(el('span', 'copy', null, '\u00A9 ' + new Date().getFullYear() + ' ' + STUDIO_NAME + '. All rights reserved.'));

    var priv = el('a', 'privacy', { href: PRIVACY_HREF }, 'PRIVACY POLICY');
    legal.appendChild(priv);

    var topBtn = el('a', 'top', { href: '#top', 'aria-label': 'Back to top' });
    topBtn.innerHTML = ICONS.arrowUp + ' BACK TO TOP';
    topBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
    legal.appendChild(topBtn);

    // Bottom Right Social Icons in larger footer
    var socialWrap = el('div', 'footer-legal-social');
    var ig = el('a', 'site-footer__icon', {
      href: INSTAGRAM_URL,
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': STUDIO_NAME + ' on Instagram'
    });
    ig.innerHTML = ICONS.instagram;
    socialWrap.appendChild(ig);

    var wa = el('a', 'site-footer__icon', {
      href: WHATSAPP_URL,
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': 'Message ' + STUDIO_NAME + ' on WhatsApp'
    });
    wa.innerHTML = ICONS.whatsapp;
    socialWrap.appendChild(wa);
    legal.appendChild(socialWrap);

    container.appendChild(legal);
    host.appendChild(container);
  }

  /* ----------------------------------------------------------- Main Initialization */
  function init() {
    var pageKey = getPageKey();
    if (pageKey === 'home') return; // Home keeps its own custom header and no footer

    mountHeader(pageKey);

    // Target any footer or [data-sap-footer]
    var host = document.querySelector('[data-sap-footer], footer.site-footer, footer');
    if (!host) {
      host = el('footer', null, { 'data-sap-footer': '' });
      document.body.appendChild(host);
    }

    if (pageKey === 'architecture' || pageKey === 'interiors') {
      mountShortFooter(host, 'light');
    } else if (pageKey === 'team' || pageKey === 'about' || pageKey === 'contact' || pageKey === 'privacy') {
      mountShortFooter(host, 'dark');
    } else {
      mountLargerFooter(host, pageKey);
    }

    // Wire up any scroll hint on hero
    var hints = document.querySelectorAll('.scroll-hint');
    Array.prototype.forEach.call(hints, function (h) {
      h.addEventListener('click', function (e) {
        var href = h.getAttribute('href');
        if (href && href.charAt(0) === '#') {
          var target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
          }
        }
      });
    });
  }

  window.SAPNav = { init: init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
