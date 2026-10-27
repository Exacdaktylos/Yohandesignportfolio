/* Homepage behaviour. Runs after site.js has set up smooth scroll, nav, cursor and page transitions. */
window.YW_SELF_CTA = true;   /* the homepage sets up its closing section itself, after the pinned sections exist */
window.YWPage = function (YW) {
  'use strict';
  const { $, $$, html, reduce, fine, lenis } = YW;
  const pre = $('.preloader'), nav = $('#nav');
  const title = $('.hero-title'), heroEl = $('.hero');
  const seen = html.classList.contains('no-pre');   /* the counter only plays on the first page of a visit */
  if (seen && pre) pre.remove();
  if (lenis && !reduce) lenis.stop();

  /* ---------- hero title: fit to the column, then make it react to the pointer ---------- */
  function fitHero() {
    const wrap = title.parentElement;
    const avail = wrap.clientWidth;
    title.style.fontSize = '100px';
    let need = $('.l2 .word', title).getBoundingClientRect().width;
    if (innerWidth >= 900) {
      const words = $$('.l3 .word', title);
      const w3 = words.reduce((a, w) => a + w.getBoundingClientRect().width, 0) + 17; /* .17em gap at 100px */
      need = Math.max(need, w3);
    }
    let fs = 100 * avail / need * 0.995;
    if (innerWidth >= 900) fs = Math.min(fs, (innerHeight - 440) / (3 * 0.84));
    title.style.fontSize = Math.max(fs, 40).toFixed(2) + 'px';
  }
  function fitProcessWords() {
    /* each word is sized to fill the column, so short words come out huge */
    const box = $('.p-words'); if (!box || !box.clientWidth) return;
    const avail = box.clientWidth, maxSize = Math.min(innerWidth * 0.15, 270);
    let tallest = 0;
    $$('.p-word').forEach(w => {
      w.style.setProperty('--pw', '100px');
      const size = Math.min(avail / w.offsetWidth * 100 * 0.98, maxSize);
      w.style.setProperty('--pw', size.toFixed(2) + 'px');
      tallest = Math.max(tallest, size);
    });
    box.style.height = (tallest * 0.95).toFixed(0) + 'px';
  }
  YW.kinetic(title, heroEl, fitHero);
  fitProcessWords();
  YW.refits.push(fitProcessWords);

  /* ---------- everything that waits for the intro ---------- */
  function setupAll() {
    /* stats count up */
    ScrollTrigger.create({ trigger: '.stats', start: 'top 94%', once: true, onEnter: () => {
      $$('.stat b').forEach(b => {
        const to = +b.dataset.to, suf = b.dataset.suffix || '', o = { v: 0 };
        b.textContent = '0' + suf;
        gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => { b.textContent = Math.round(o.v) + suf; } });
      });
    } });

    /* hero floats: scroll parallax */
    $$('.float').forEach(f => {
      const d = +f.dataset.depth;
      gsap.to(f, { y: -130 * d, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true } });
    });
    gsap.to('.stamp', { rotation: 360, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true } });

    /* hero floats drift with the pointer */
    if (fine && !reduce) {
      const floatMoves = $$('.float').map(f => {
        const inner = $('.float-in', f), d = +f.dataset.depth;
        const qx = gsap.quickTo(inner, 'x', { duration: 1, ease: 'power3' }), qy = gsap.quickTo(inner, 'y', { duration: 1, ease: 'power3' });
        return (nx, ny) => { qx(nx * 70 * d); qy(ny * 50 * d); };
      });
      heroEl.addEventListener('pointermove', e => {
        const r = heroEl.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
        floatMoves.forEach(m => m(nx, ny));
      });
    }

    /* skills band: drifts, reverses with scroll, skews with speed */
    const track = $('.band-track'), group = $('.band-group');
    track.appendChild(group.cloneNode(true)); track.appendChild(group.cloneNode(true));
    if (!reduce) {
      let bx = 0, dirS = 1;
      gsap.ticker.add((t, dt) => {
        const v = lenis ? lenis.velocity : 0;
        const dir = lenis && lenis.direction ? lenis.direction : 1;
        dirS += (dir - dirS) * 0.05;
        bx -= (70 + Math.min(Math.abs(v), 40) * 14) * dirS * dt / 1000;
        const w = group.offsetWidth;
        if (bx <= -w) bx += w; if (bx > 0) bx -= w;
        gsap.set(track, { x: bx, skewX: gsap.utils.clamp(-14, 14, -v * 0.9) });
      });
    }

    /* work + process need to know the layout mode */
    const mm = gsap.matchMedia();

    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      /* ----- work: pinned horizontal scroll ----- */
      const pin = $('.work-pin'), trackEl = $('.work-track'), bar = $('.w-progress i');
      const dist = () => Math.max(0, trackEl.scrollWidth - innerWidth);
      const frames = $$('.w-frame');
      let workActive = false;
      const tween = gsap.to(trackEl, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: true,
          invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: s => gsap.set(bar, { scaleX: s.progress }),
          onToggle: s => workActive = s.isActive
        }
      });
      $$('.w-panel').forEach(p => {
        const frame = $('.w-frame', p), mask = $('.w-mask', p), img = $('.w-img', p), ghost = $('.ghost', p);
        gsap.fromTo(img, { xPercent: -5 }, { xPercent: 5, ease: 'none', scrollTrigger: { trigger: frame, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
        gsap.fromTo(ghost, { xPercent: -10 }, { xPercent: 10, ease: 'none', scrollTrigger: { trigger: frame, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
        gsap.from(mask, { clipPath: 'inset(0 100% 0 0)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: frame, containerAnimation: tween, start: 'left 90%', toggleActions: 'play none none none' } });
      });
      const skew = gsap.quickSetter(frames, 'skewX', 'deg');
      let sk = 0;
      const tick = () => {
        if (!workActive || !lenis) return;
        sk += (gsap.utils.clamp(-7, 7, lenis.velocity * 0.22) - sk) * 0.12;
        skew(sk);
      };
      gsap.ticker.add(tick);
      YW.revealLines($('.w-intro h2'), 'top 70%');
      return () => { gsap.ticker.remove(tick); gsap.set(frames, { skewX: 0 }); };
    });

    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      /* ----- process: pinned, the big word swaps as you scroll ----- */
      const steps = $$('.p-step'), words = $$('.p-word'), line = $('.p-line');
      const wc = words.map(w => {
        if (!w.dataset.split) {
          const t = w.textContent; w.textContent = '';
          [...t].forEach(c => { const s = document.createElement('span'); s.className = 'ci'; s.textContent = c; w.appendChild(s); });
          w.dataset.split = '1';
        }
        return $$('.ci', w);
      });
      gsap.set(wc.flat(), { yPercent: 120 });
      let cur = -1;
      function show(i) {
        if (i === cur) return;
        const prev = cur, dirn = prev > -1 && i < prev ? -1 : 1;
        cur = i;
        if (prev > -1) gsap.to(wc[prev], { yPercent: -120 * dirn, duration: 0.5, ease: 'power3.in', stagger: 0.015, overwrite: true });
        gsap.set(wc[i], { yPercent: 120 * dirn });
        gsap.to(wc[i], { yPercent: 0, duration: 0.95, ease: 'expo.out', stagger: 0.03, delay: prev > -1 ? 0.28 : 0.1, overwrite: true });
        steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
      }
      show(0);
      const st = ScrollTrigger.create({
        trigger: '.p-pin', start: 'top top', end: '+=300%', pin: true, anticipatePin: 1,
        onUpdate: s => { show(Math.min(3, Math.floor(s.progress * 4))); gsap.set(line, { scaleY: s.progress }); }
      });
      const clicks = steps.map((s, i) => {
        const fn = () => {
          const y = st.start + (i + 0.5) / 4 * (st.end - st.start);
          lenis ? lenis.scrollTo(y, { duration: 1.4 }) : scrollTo({ top: y, behavior: 'smooth' });
        };
        $('button', s).addEventListener('click', fn);
        return [s, fn];
      });
      YW.revealLines($('.p-head h2'), 'top 85%');
      return () => { clicks.forEach(([s, fn]) => $('button', s).removeEventListener('click', fn)); };
    });

    mm.add('(max-width: 899px), (prefers-reduced-motion: reduce)', () => {
      /* stacked layout: simple reveals only */
      if (reduce) return;
      $$('.w-panel').forEach(p => {
        gsap.from($('.w-mask', p), { clipPath: 'inset(0 100% 0 0)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 80%', toggleActions: 'play none none none' } });
      });
      YW.revealLines($('.w-intro h2'), 'top 85%');
      YW.revealLines($('.p-head h2'), 'top 85%');
    });

    YW.setupCta();
    ScrollTrigger.refresh();
  }

  /* ---------- intro sequence ---------- */
  if (reduce) {
    if (pre) pre.remove();
    title.classList.add('is-live');
    setupAll();
    return;
  }

  gsap.set($$('.ci', title), { yPercent: 118 });
  gsap.set('.float', { opacity: 0, scale: 0.7 });
  gsap.set('.hero-foot > *', { opacity: 0, y: 30 });
  gsap.set(nav, { yPercent: -100 });

  const intro = gsap.timeline({ delay: YW.entering ? 0.5 : 0 });
  if (!seen && pre) {
    const num = $('.pre-num'), o = { v: 0 };
    intro.to(o, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => { num.textContent = Math.round(o.v); } })
         .to(pre, { yPercent: -100, duration: 1.05, ease: 'expo.inOut' }, '+=0.15');
  }
  intro
    .to($$('.ci', title), { yPercent: 0, duration: 1.25, ease: 'expo.out', stagger: 0.03 }, seen ? 0 : '-=0.55')
    .to('.float', { opacity: 1, scale: 1, duration: 1.2, ease: 'expo.out', stagger: 0.12 }, '<0.25')
    .to(nav, { yPercent: 0, duration: 0.9, ease: 'expo.out' }, '<')
    .to('.hero-foot > *', { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.12 }, '<0.2')
    .add(() => {
      if (pre) pre.remove();
      title.classList.add('is-live');
      if (lenis) lenis.start();
      setupAll();
    });

  /* safety net: if anything stalls (background tab, slow device), jump to the finished state */
  setTimeout(() => { if (!title.classList.contains('is-live')) intro.progress(1); }, 10000);
};
