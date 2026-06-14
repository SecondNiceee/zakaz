document.addEventListener('DOMContentLoaded', () => {
  initStickyCta();

  const burger = document.querySelector('.burger');
  const headerInner = document.querySelector('.header__inner');
  const refreshStickyCta = window.__refreshStickyCta;

  const closeNav = () => {
    if (!headerInner || !burger) return;
    headerInner.classList.remove('nav-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-menu-open');
    refreshStickyCta?.();
  };

  if (burger && headerInner) {
    burger.addEventListener('click', () => {
      const isOpen = headerInner.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', isOpen);
      document.body.classList.toggle('nav-menu-open', isOpen);
      if (isOpen) {
        document.querySelector('.sticky-cta')?.classList.remove('is-visible');
        document.body.classList.remove('has-sticky-cta');
      } else {
        refreshStickyCta?.();
      }
    });

    headerInner.querySelectorAll('.nav__link, .header__actions a').forEach((link) => {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('click', (event) => {
      if (!headerInner.classList.contains('nav-open')) return;
      if (headerInner.contains(event.target)) return;
      closeNav();
    });
  }

  const aiPanel = document.querySelector('.ai-panel');
  if (aiPanel) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.ai-score__fill').forEach((bar) => {
              const width = bar.style.width;
              bar.style.width = '0';
              requestAnimationFrame(() => {
                bar.style.width = width;
              });
            });
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(aiPanel);
  }

  document.querySelectorAll('[data-kpi-board]').forEach(initKpiBoard);
  document.querySelectorAll('[data-product-slider]').forEach(initProductSlider);
  document.querySelectorAll('[data-kpi-scripts]').forEach(initKpiScripts);
});

function initStickyCta() {
  const sticky = document.querySelector('.sticky-cta');
  const heroCta = document.querySelector('#cta');
  if (!sticky || !heroCta) return;

  const mq = window.matchMedia('(max-width: 768px)');

  const syncSticky = (isVisible) => {
    const menuOpen = document.body.classList.contains('nav-menu-open');
    const show = mq.matches && isVisible && !menuOpen;
    sticky.classList.toggle('is-visible', show);
    document.body.classList.toggle('has-sticky-cta', show);
  };

  window.__refreshStickyCta = () => {
    if (!mq.matches || document.body.classList.contains('nav-menu-open')) return;
    const rect = heroCta.getBoundingClientRect();
    syncSticky(rect.bottom <= 0 || rect.top >= window.innerHeight);
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      syncSticky(!entry.isIntersecting);
    },
    { threshold: 0, rootMargin: '0px 0px -8px 0px' }
  );

  observer.observe(heroCta);

  mq.addEventListener('change', () => {
    if (!mq.matches) {
      sticky.classList.remove('is-visible');
      document.body.classList.remove('has-sticky-cta');
    }
  });
}

function initKpiBoard(board) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const runAnimations = () => {
    board.classList.add('is-visible');

    if (reducedMotion) {
      board.querySelectorAll('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count);
        const suffix = el.dataset.countSuffix ?? '';
        el.textContent = `${target}${suffix}`;
      });
      return;
    }

    board.querySelectorAll('[data-count]').forEach((el) => {
      animateCount(el, Number(el.dataset.count), el.dataset.countSuffix ?? '', 1200);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runAnimations();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.25 }
  );

  observer.observe(board);
}

function animateCount(el, target, suffix, duration) {
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = `${Math.round(target * eased)}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
}

function initKpiScripts(root) {
  const objectionText = root.querySelector('[data-script-objection-text]');
  const answer = root.querySelector('[data-script-answer]');
  const items = root.querySelectorAll('[data-script-item]');

  if (!objectionText || !answer || !items.length) return;

  items.forEach((item) => {
    item.addEventListener('click', () => {
      const nextObjection = item.dataset.objection ?? '';
      const nextAnswer = item.dataset.answer ?? '';

      items.forEach((btn) => btn.classList.remove('is-active'));
      item.classList.add('is-active');

      objectionText.parentElement?.classList.add('is-changing');
      answer.classList.add('is-changing');

      window.setTimeout(() => {
        objectionText.textContent = nextObjection;
        answer.textContent = nextAnswer;
        objectionText.parentElement?.classList.remove('is-changing');
        answer.classList.remove('is-changing');
      }, 180);
    });
  });
}

function initProductSlider(root) {
  const track = root.querySelector('.product-slider__track');
  const slides = root.querySelectorAll('.product-slide');
  const segments = root.querySelectorAll('.product-slider__seg');
  const progressBar = root.querySelector('.product-slider__progress-bar');

  if (!track || !slides.length || !segments.length) return;

  const viewport = root.querySelector('.product-slider__viewport');
  const INTERVAL = 8000;
  const TRANSITION_MS = 900;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;
  let timer = null;
  let resizeObserver = null;

  function syncViewportHeight() {
    if (!viewport) return;

    viewport.style.height = 'auto';

    const kpiInner = slides[0]?.querySelector('.product-slide__inner');
    const kpiHeight = kpiInner ? Math.ceil(kpiInner.scrollHeight) : 0;

    if (kpiHeight > 0) {
      viewport.style.height = `${kpiHeight}px`;
    }
  }

  function goTo(index) {
    current = ((index % slides.length) + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;

    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
    segments.forEach((seg, i) => {
      seg.classList.toggle('is-active', i === current);
      seg.setAttribute('aria-selected', i === current);
    });

    restartProgress();
  }

  function next() {
    goTo(current + 1);
  }

  function restartProgress() {
    if (!progressBar || reducedMotion) return;
    progressBar.style.transition = 'none';
    progressBar.style.width = '0';

    requestAnimationFrame(() => {
      setTimeout(() => {
        progressBar.style.transition = `width ${INTERVAL - TRANSITION_MS}ms linear`;
        progressBar.style.width = '100%';
      }, TRANSITION_MS);
    });
  }

  function startAutoplay() {
    if (reducedMotion) return;
    clearInterval(timer);
    timer = setInterval(next, INTERVAL);
    restartProgress();
  }

  function stopAutoplay() {
    clearInterval(timer);
    timer = null;
    if (progressBar) progressBar.style.transition = 'none';
  }

  segments.forEach((seg) => {
    seg.addEventListener('click', () => {
      goTo(Number(seg.dataset.slide));
      stopAutoplay();
      startAutoplay();
    });
  });

  root.addEventListener('mouseenter', stopAutoplay);
  root.addEventListener('mouseleave', startAutoplay);

  let touchStartX = 0;
  root.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoplay();
  }, { passive: true });

  root.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? current - 1 : current + 1);
    startAutoplay();
  }, { passive: true });

  goTo(0);
  syncViewportHeight();
  requestAnimationFrame(syncViewportHeight);

  window.addEventListener('resize', syncViewportHeight);
  if (document.fonts?.ready) {
    document.fonts.ready.then(syncViewportHeight);
  }

  if (viewport && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(syncViewportHeight);
    slides.forEach((slide) => {
      const inner = slide.querySelector('.product-slide__inner');
      if (inner) resizeObserver.observe(inner);
    });
  }

  startAutoplay();
}
