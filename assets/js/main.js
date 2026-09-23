document.documentElement.classList.add('js');

const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const menuBackdrop = document.querySelector('.menu-backdrop');
const menuClose = document.querySelector('.mobile-menu-close');

if (menuToggle && mobileMenu && menuBackdrop && menuClose) {
  const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const setMenuState = isOpen => {
    mobileMenu.classList.toggle('is-open', isOpen);
    menuBackdrop.classList.toggle('is-visible', isOpen);
    menuBackdrop.hidden = !isOpen;
    mobileMenu.inert = !isOpen;
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('menu-open', isOpen);

    if (isOpen) {
      menuClose.focus();
    } else {
      menuToggle.focus();
    }
  };

  menuToggle.addEventListener('click', () => {
    setMenuState(!mobileMenu.classList.contains('is-open'));
  });

  menuClose.addEventListener('click', () => setMenuState(false));
  menuBackdrop.addEventListener('click', () => setMenuState(false));
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      setMenuState(false);
      window.requestAnimationFrame(() => menuToggle.focus());
    });
  });

  const languageOptions = [...mobileMenu.querySelectorAll('.mobile-language-option')];

  languageOptions.forEach(option => {
    option.addEventListener('click', () => {
      languageOptions.forEach(item => {
        const isActive = item === option;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });
    });
  });

  document.addEventListener('keydown', event => {
    if (!mobileMenu.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      setMenuState(false);
      return;
    }

    if (event.key === 'Tab') {
      const focusable = [...mobileMenu.querySelectorAll(focusableSelector)];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1180 && mobileMenu.classList.contains('is-open')) {
      setMenuState(false);
    }
  });
}

const caseTrack = document.querySelector('[data-case-track]');
const previousCase = document.querySelector('[data-case-prev]');
const nextCase = document.querySelector('[data-case-next]');

if (caseTrack && previousCase && nextCase) {
  const scrollCases = direction => {
    const card = caseTrack.querySelector('.case-card');
    if (!card) return;
    const gap = Number.parseFloat(getComputedStyle(caseTrack).columnGap) || 16;
    caseTrack.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  };

  previousCase.addEventListener('click', () => scrollCases(-1));
  nextCase.addEventListener('click', () => scrollCases(1));
}

const revealCards = [...document.querySelectorAll('.reveal-card')];

if (revealCards.length) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealCards.forEach(card => card.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries
        .filter(entry => entry.isIntersecting)
        .forEach((entry, index) => {
          window.setTimeout(() => {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }, Math.min(index * 60, 240));
        });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.12
    });

    revealCards.forEach(card => revealObserver.observe(card));
  }
}

const hero = document.querySelector('.hero');
const heroMotion = document.querySelector('.hero-motion');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (hero && heroMotion && finePointer.matches && !reducedMotion.matches) {
  let frame = 0;
  let targetX = 0;
  let targetY = 0;

  const renderHeroMotion = () => {
    heroMotion.style.setProperty('--hero-motion-x', `${targetX}px`);
    heroMotion.style.setProperty('--hero-motion-y', `${targetY}px`);
    frame = 0;
  };

  const queueHeroMotion = () => {
    if (!frame) frame = window.requestAnimationFrame(renderHeroMotion);
  };

  hero.addEventListener('pointermove', event => {
    const bounds = hero.getBoundingClientRect();
    targetX = ((event.clientX - bounds.left) / bounds.width - .5) * 12;
    targetY = ((event.clientY - bounds.top) / bounds.height - .5) * 8;
    queueHeroMotion();
  }, { passive: true });

  hero.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
    queueHeroMotion();
  });
}
