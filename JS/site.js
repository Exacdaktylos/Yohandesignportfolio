/* ============================================================
   YW. portfolio v3  |  shared behaviour (every page loads this)
   Needs: GSAP 3 + ScrollTrigger, Lenis (all loaded from CDN before this file).
   If they fail to load the pages still work, just without animation.
   A page script defines window.YWPage = function (YW) { ... } BEFORE this file;
   it is called once fonts, smooth scroll and the shared pieces are ready.
   ============================================================ */
(async function () {
  'use strict';
  const html = document.documentElement;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine   = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const nav = $('#nav');
  const YW = window.YW = { $, $$, html, reduce, fine, lenis: null, entering: false, refits: [] };
  try { sessionStorage.setItem('ywSeen', '1'); } catch (e) {}

  /* ---------- mobile menu (needs no libraries) ---------- */
  const burger = $('#burger'), menu = $('#menu');
  function setMenu(open) {
    html.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    if (YW.lenis) { open ? YW.lenis.stop() : YW.lenis.start(); }
    else document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', () => setMenu(!html.classList.contains('menu-open')));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  $$('.menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('resize', () => { if (innerWidth >= 900) setMenu(false); });

  /* ---------- fail safe: no GSAP means no animation, but the page still works ---------- */
  if (!window.gsap || !window.ScrollTrigger) {
    html.classList.add('no-gsap');
    const pre = $('.preloader'); if (pre) pre.remove();
    const t = $('#toTop'); if (t) t.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  if (!reduce && window.Lenis) {
    const lenis = YW.lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const toTop = $('#toTop');
  if (toTop) toTop.addEventListener('click', () => YW.lenis ? YW.lenis.scrollTo(0, { duration: 1.6 }) : scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* ---------- nav: hide on scroll down, change colour over light sections ---------- */
  const themed = $$('[data-theme]');
  const navBg = { ink: 'rgba(7,7,7,.78)', paper: 'rgba(242,237,228,.85)', lime: 'rgba(200,255,0,.88)' };
  let lastY = 0;
  function onScroll(y, dir) {
    nav.classList.toggle('is-hidden', dir > 0 && y > 240 && !html.classList.contains('menu-open'));
    nav.classList.toggle('is-stuck', y > 60);
    let light = false;
    themed.forEach(s => {
      const r = s.getBoundingClientRect();
      if (r.top <= 40 && r.bottom >= 40) {
        light = s.dataset.theme !== 'ink';
        nav.style.setProperty('--nav-bg', navBg[s.dataset.theme]);
      }
    });
    nav.classList.toggle('on-light', light);
  }
  if (YW.lenis) YW.lenis.on('scroll', e => onScroll(e.scroll, e.direction));
  else addEventListener('scroll', () => { const y = scrollY; onScroll(y, y > lastY ? 1 : -1); lastY = y; }, { passive: true });
  onScroll(scrollY, 0);

  /* ---------- helpers other scripts use ---------- */
  /* headings that rise up through a mask */
  YW.revealLines = function (root, start = 'top 82%') {
    if (reduce || !root) return;
    const li = $$('.li', root);
    gsap.set(li, { yPercent: 115 });
    ScrollTrigger.create({ trigger: root, start, once: true,
      onEnter: () => gsap.to(li, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.09 }) });
  };
  /* images that wipe open */
  YW.wipe = function (els, start = 'top 88%') {
    if (reduce) return;
    (els.forEach ? els : [els]).forEach(el => {
      gsap.from(el, { clipPath: 'inset(0 100% 0 0)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start, toggleActions: 'play none none none' } });
    });
  };
  /* hairlines that draw across: any element with [data-rule] */
  YW.rules = function (root = document) {
    $$('[data-rule]', root).forEach(el => {
      const line = document.createElement('i'); line.className = 'rule-line'; line.setAttribute('aria-hidden', 'true');
      el.prepend(line);
      if (reduce) return;
      gsap.from(line, { scaleX: 0, transformOrigin: 'left center', duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none none' } });
    });
  };
  YW.magnetic = function (el, k = 0.35) {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * k, y: (e.clientY - r.top - r.height / 2) * k, duration: 0.5, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1,.4)' }));
  };
  YW.splitChars = function (title) {
    $$('.word', title).forEach(w => {
      if (w.dataset.split) return;
      const text = w.textContent; w.textContent = '';
      [...text].forEach(c => {
        const ch = document.createElement('span'); ch.className = 'ch';
        const ci = document.createElement('span'); ci.className = 'ci'; ci.textContent = c;
        ch.appendChild(ci); w.appendChild(ch);
      });
      w.dataset.split = '1';
    });
    return $$('.ch', title);
  };
  /* shrink a big title until its widest line fits the column */
  YW.fitTitle = function (title) {
    title.style.fontSize = '';
    const lines = $$('.line', title);
    const over = Math.max(...lines.map(l => l.scrollWidth - l.clientWidth));
    if (over > 1) {
      const fs = parseFloat(getComputedStyle(title).fontSize);
      const wide = Math.max(...lines.map(l => l.scrollWidth));
      title.style.fontSize = Math.max(fs * title.clientWidth / wide * 0.985, 34).toFixed(2) + 'px';
    }
  };
  /* characters lift and turn lime near the pointer; the hero's light follows it */
  YW.kinetic = function (title, host, fit) {
    const chars = YW.splitChars(title);
    let centers = [];
    const refit = () => { if (fit) fit(); centers = chars.map(el => ({ el, x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2, s: 0, last: 0 })); };
    refit();
    title.classList.add('is-split');
    YW.refits.push(refit);
    if (fine && !reduce && host) {
      let mx = -9999, my = -9999, tx = 0.7, ty = 0.38, cx = 0.7, cy = 0.38, vis = true;
      new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(host);
      host.addEventListener('pointermove', e => {
        mx = e.clientX; my = e.clientY;
        const r = host.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height;
      });
      host.addEventListener('pointerleave', () => { mx = my = -9999; });
      const b1 = $('.b1', host), b2 = $('.b2', host);
      gsap.ticker.add(() => {
        if (!vis) return;
        cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
        host.style.setProperty('--mx', (cx * 100).toFixed(2) + '%');
        host.style.setProperty('--my', (cy * 100).toFixed(2) + '%');
        if (b1) gsap.set(b1, { x: (cx - 0.5) * -140, y: (cy - 0.5) * -90 });
        if (b2) gsap.set(b2, { x: (cx - 0.5) * 100, y: (cy - 0.5) * 70 });
        const tr = title.getBoundingClientRect();
        const R = parseFloat(getComputedStyle(title).fontSize) * 1.15;
        for (const c of centers) {
          const d = Math.hypot(tr.left + c.x - mx, (tr.top + c.y - my) * 0.9);
          let t = Math.max(0, 1 - d / R); t = t * t * (3 - 2 * t);
          c.s += (t - c.s) * 0.16;
          if (Math.abs(c.s - c.last) > 0.002) { c.el.style.setProperty('--s', c.s.toFixed(3)); c.last = c.s; }
        }
      });
    }
    return { chars, refit };
  };
  /* the standard inner-page title entrance */
  YW.introTitle = function (title, delay = 0) {
    const ci = $$('.ci', title);
    if (reduce) { title.classList.add('is-live'); return null; }
    gsap.set(ci, { yPercent: 118 });
    return gsap.to(ci, { yPercent: 0, duration: 1.25, ease: 'expo.out', stagger: 0.03, delay,
      onComplete: () => title.classList.add('is-live') });
  };

  /* ---------- custom cursor ---------- */
  if (fine && !reduce) {
    html.classList.add('has-cursor');
    const dot = $('.cursor-dot'), bub = $('.cursor-bubble');
    gsap.set([dot, bub], { xPercent: -50, yPercent: -50 });
    gsap.set(bub, { scale: 0 });
    const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' }), dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    const bx = gsap.quickTo(bub, 'x', { duration: 0.5, ease: 'power3' }),  by = gsap.quickTo(bub, 'y', { duration: 0.5, ease: 'power3' });
    addEventListener('pointermove', e => { dx(e.clientX); dy(e.clientY); bx(e.clientX); by(e.clientY); dot.style.opacity = 1; }, { passive: true });
    document.addEventListener('pointerover', e => {
      const lab = e.target.closest('[data-cursor]');
      const hit = e.target.closest('a,button');
      if (lab) { bub.textContent = lab.dataset.cursor; gsap.to(bub, { scale: 1, duration: 0.55, ease: 'expo.out' }); gsap.to(dot, { scale: 0, duration: 0.25 }); }
      else { gsap.to(bub, { scale: 0, duration: 0.35, ease: 'power3.out' }); gsap.to(dot, { scale: hit ? 3.4 : 1, duration: 0.4, ease: 'expo.out' }); }
    });
  }

  /* ---------- page transition ---------- */
  const curtain = $('.curtain');
  try { YW.entering = sessionStorage.getItem('ywNav') === '1'; sessionStorage.removeItem('ywNav'); } catch (e) {}
  if (YW.entering && !reduce) {
    gsap.set(curtain, { yPercent: 0 });
    html.classList.remove('is-entering');
    gsap.to(curtain, { yPercent: -100, duration: 0.9, ease: 'expo.inOut', delay: 0.1 });
  } else {
    html.classList.remove('is-entering');
    gsap.set(curtain, { yPercent: 100 });
  }
  if (!reduce) {
    $$('a[href^="/"]').forEach(a => a.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button || a.target === '_blank') return;
      const url = new URL(a.href, location.href);
      if (url.pathname === location.pathname && url.search === location.search) return;
      e.preventDefault();
      try { sessionStorage.setItem('ywNav', '1'); } catch (err) {}
      gsap.set(curtain, { yPercent: 100 });
      gsap.to(curtain, { yPercent: 0, duration: 0.75, ease: 'expo.inOut', onComplete: () => { location.href = a.href; } });
    }));
  }
  addEventListener('pageshow', e => { if (e.persisted) gsap.set(curtain, { yPercent: 100 }); });

  /* ---------- fonts: ask for them explicitly, fitted titles depend on the real widths ---------- */
  await Promise.race([
    Promise.all([document.fonts.load('italic 900 100px "Barlow Condensed"'), document.fonts.load('400 16px Syne'), document.fonts.load('800 16px Syne')]).then(() => document.fonts.ready),
    new Promise(r => setTimeout(r, 2500))
  ]);
  const refitAll = () => { YW.refits.forEach(f => f()); ScrollTrigger.refresh(); };
  document.fonts.addEventListener('loadingdone', refitAll);
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(refitAll, 160); });
  addEventListener('load', () => ScrollTrigger.refresh());

  /* ---------- shared page furniture ---------- */
  gsap.to('.scrollbar', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });
  $$('.foot').forEach(f => f.setAttribute('data-theme', 'ink'));
  const cta = $('.cta');
  YW.setupCta = function () {
    if (!cta) return;
    YW.revealLines($('.cta-title'), 'top 75%');
    gsap.fromTo('.cta-dome', { scaleY: 1 }, { scaleY: 0, ease: 'none', scrollTrigger: { trigger: cta, start: 'top bottom', end: 'top 25%', scrub: true } });
    if (fine && !reduce) $$('.magnetic').forEach(el => YW.magnetic(el, el.classList.contains('magnet') ? 0.4 : 0.25));
  };

  /* ---------- hand over to the page ---------- */
  if (typeof window.YWPage === 'function') {
    try { await window.YWPage(YW); } catch (err) { console.error(err); html.classList.add('failsafe'); }
  }
  /* defaults every inner page gets: kinetic title, intro, line reveals, image wipes */
  const pt = $('.page-title');
  if (pt && !pt.classList.contains('is-split')) {
    YW.kinetic(pt, pt.closest('.page-hero'), () => YW.fitTitle(pt));
    YW.introTitle(pt, YW.entering ? 0.55 : 0.1);
    if (!reduce) gsap.from('.page-hero [data-intro]', { opacity: 0, y: 28, duration: 1, ease: 'expo.out', stagger: 0.1, delay: (YW.entering ? 0.55 : 0.1) + 0.5 });
  }
  $$('[data-lines]').forEach(el => YW.revealLines(el, el.dataset.lines || 'top 82%'));
  YW.wipe($$('[data-wipe]'));
  if (!window.YW_SELF_CTA) YW.setupCta();
  YW.rules();
  ScrollTrigger.refresh();
  /* safety: never leave a kinetic title hidden */
  setTimeout(() => html.classList.add('failsafe'), 6000);
})();
