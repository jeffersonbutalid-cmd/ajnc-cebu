/* =====================================================
   AJNC — Experience layer
   Small, dependency-free motion touches: kinetic hero headline,
   count-up stats, scroll progress hairline, hero parallax.
   Everything respects prefers-reduced-motion.
   ===================================================== */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Kinetic hero headline: word-by-word rise ---------- */
  function kineticHero() {
    if (reduced) return;
    const h1 = document.getElementById('hero-h1');
    if (!h1) return;
    let i = 0;
    function wrapWords(node) {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            w.className = 'kin-word';
            w.style.setProperty('--ki', i++);
            w.textContent = part;
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          wrapWords(child);
        }
      });
    }
    wrapWords(h1);
    h1.classList.add('kinetic');
    // the supporting lines follow the headline
    document.querySelectorAll('.hero-eyebrow, .hero .lead, .hero-cta, .hero-times')
      .forEach((el, j) => { el.classList.add('hero-follow'); el.style.setProperty('--hi', j); });
  }

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

  /* ---------- Hero parallax: content drifts up slower than the page ---------- */
  function heroParallax() {
    if (reduced) return;
    const inner = document.querySelector('.hero-inner');
    const hint = document.querySelector('.hero .scroll-hint');
    if (!inner) return;
    let ticking = false;
    function update() {
      ticking = false;
      const y = window.scrollY;
      if (y < window.innerHeight) {
        inner.style.transform = 'translateY(' + (y * 0.16) + 'px)';
        inner.style.opacity = Math.max(1 - y / (window.innerHeight * 0.9), 0);
        if (hint) hint.style.opacity = Math.max(1 - y / 160, 0);
      }
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
  }

  function init() { kineticHero(); countUps(); progressBar(); heroParallax(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
