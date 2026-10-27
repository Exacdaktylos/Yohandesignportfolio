/* Project case study pages: cover parallax + gallery lightbox */
window.YWPage = function (YW) {
  'use strict';
  const { $, $$, html, reduce } = YW;

  /* cover image wipes open and settles */
  const cover = $('.pr-cover-frame');
  if (cover && !reduce) {
    YW.wipe(cover, 'top 92%');
    gsap.fromTo($('img', cover), { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: cover, start: 'top bottom', end: 'bottom 40%', scrub: true } });
  }

  /* gallery lightbox */
  const items = $$('.m-item');
  const lb = $('#lightbox'), lbImg = $('img', lb), lbCap = $('figcaption', lb);
  const btnClose = $('.lb-close', lb), btnPrev = $('.lb-prev', lb), btnNext = $('.lb-next', lb);
  let cur = 0, opener = null;
  function show(i) {
    cur = (i + items.length) % items.length;
    const it = items[cur];
    lbImg.src = it.dataset.full; lbImg.alt = it.dataset.alt;
    lbCap.textContent = it.dataset.tag + '  (' + (cur + 1) + ' of ' + items.length + ')';
  }
  function open(i, from) {
    opener = from; show(i);
    lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
    if (YW.lenis) YW.lenis.stop(); else document.body.style.overflow = 'hidden';
    btnClose.focus();
  }
  function close() {
    lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true');
    if (YW.lenis) YW.lenis.start(); else document.body.style.overflow = '';
    if (opener) opener.focus();
  }
  items.forEach((it, i) => it.addEventListener('click', () => open(i, it)));
  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', () => show(cur - 1));
  btnNext.addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });
  /* images in the masonry change the page height as they load */
  $$('.m-item img').forEach(img => { if (!img.complete) img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true }); });
};
