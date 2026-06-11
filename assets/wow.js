/* =====================================================
   AJNC — Experience layer
   Small, dependency-free motion touches: count-up stats,
   scroll progress hairline. Respects prefers-reduced-motion.
   ===================================================== */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Count-up numbers ---------- */
  function countUps() {
    const els = document.querySelectorAll('[data-countup]');
    if (!els.length) return;
    function run(el) {
      const target = parseInt(el.getAttribute('data-countup'), 10) || 0;
      if (reduced) { el.textContent = target; return; }
      const dur = 1500, t0 = performance.now();
      function step(now) {
        const p = Math.min((now - t0) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * ease);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if ('IntersectionObserver' in window && !reduced) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      els.forEach(el => { el.textContent = '0'; io.observe(el); });
    } else {
      els.forEach(run);
    }
  }

  /* ---------- Scroll progress hairline ---------- */
  function progressBar() {
    if (reduced) return;
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    let ticking = false;
    function update() {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  function init() { countUps(); progressBar(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
