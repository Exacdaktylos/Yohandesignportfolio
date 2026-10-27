/* Projects page: category filter + staggered grid layout */
window.YWPage = function (YW) {
  'use strict';
  const { $, $$, reduce } = YW;
  const grid = $('#pjGrid'), cards = $$('.pj-card', grid), btns = $$('.chip-btn'), count = $('#pjCount');
  const pattern = [7, 5, 5, 7, 6, 6];        /* column spans, repeats */
  const arFor = span => span >= 7 ? '16/10' : span === 5 ? '4/5' : '4/3';

  function layout() {
    cards.filter(c => !c.hidden).forEach((c, i) => {
      const span = pattern[i % pattern.length];
      c.style.setProperty('--span', span);
      c.style.setProperty('--ar', arFor(span));
    });
  }
  layout();
  /* first reveal */
  YW.wipe($$('.pj-mask'), 'top 90%');

  function apply(filter) {
    const show = cards.filter(c => filter === 'all' || c.dataset.cat === filter);
    const finish = () => {
      cards.forEach(c => { c.hidden = !show.includes(c); });
      layout();
      gsap.set($$('.pj-mask'), { clearProps: 'clipPath' });
      count.textContent = show.length + (show.length === 1 ? ' project' : ' projects');
      if (!reduce) gsap.fromTo(show, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, clearProps: 'opacity,transform' });
      ScrollTrigger.refresh();
    };
    if (reduce) return finish();
    gsap.to(cards.filter(c => !c.hidden), { opacity: 0, y: -20, duration: 0.25, ease: 'power2.in', onComplete: finish });
  }
  btns.forEach(b => b.addEventListener('click', () => {
    if (b.getAttribute('aria-pressed') === 'true') return;
    btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    apply(b.dataset.filter);
  }));
};
