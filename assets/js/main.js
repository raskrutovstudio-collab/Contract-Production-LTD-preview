document.documentElement.classList.add('js');

const SITE_LANGUAGES = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'kk', label: 'KZ' },
  { code: 'ar', label: 'AR' }
];
const LANGUAGE_STORAGE_KEY = 'site-language';

const getSiteLanguage = (code) => SITE_LANGUAGES.find((item) => item.code === code) || SITE_LANGUAGES[0];

const readStoredLanguage = () => {
  try {
    return getSiteLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return SITE_LANGUAGES[0];
  }
};

const applySiteLanguage = (code) => {
  const language = getSiteLanguage(code);

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language.code);
  } catch {
    // Storage can be blocked; UI state still updates.
  }

  document.documentElement.lang = language.code;
  document.documentElement.dir = 'ltr';

  document.querySelectorAll('[data-lang]').forEach((button) => {
    const isActive = button.getAttribute('data-lang') === language.code;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
};

applySiteLanguage(readStoredLanguage().code);

document.querySelectorAll('[data-lang]').forEach((button) => {
  button.addEventListener('click', () => {
    applySiteLanguage(button.getAttribute('data-lang'));
  });
});

const menuToggles = [...document.querySelectorAll('.menu-toggle')];
const menuToggle = menuToggles[0];
const mobileMenu = document.querySelector('.mobile-menu');
const menuBackdrop = document.querySelector('.menu-backdrop');
const menuClose = document.querySelector('.mobile-menu-close');

if (menuToggles.length && mobileMenu && menuBackdrop && menuClose) {
  const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let lastMenuTrigger = menuToggle;
  let menuScrollY = 0;
  let restoreMenuScroll = true;

  const syncMenuToggles = (isOpen) => {
    menuToggles.forEach((toggle) => {
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    });
  };

  const lockPageScroll = () => {
    menuScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${menuScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  };

  const unlockPageScroll = () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';

    if (restoreMenuScroll) {
      window.scrollTo({
        top: menuScrollY,
        left: 0,
        behavior: 'instant'
      });
    }
  };

  const setMenuState = isOpen => {
    if (isOpen) {
      restoreMenuScroll = true;
      lockPageScroll();
    }

    mobileMenu.classList.toggle('is-open', isOpen);
    menuBackdrop.classList.toggle('is-visible', isOpen);
    menuBackdrop.hidden = !isOpen;
    mobileMenu.inert = !isOpen;
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    syncMenuToggles(isOpen);
    document.body.classList.toggle('menu-open', isOpen);

    if (isOpen) {
      menuClose.focus({ preventScroll: true });
    } else {
      unlockPageScroll();
      const visibleToggle = menuToggles.find((toggle) => toggle.offsetParent && !toggle.closest('[inert]'));
      (visibleToggle || lastMenuTrigger || menuToggle).focus({ preventScroll: true });
    }
  };

  menuToggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      lastMenuTrigger = toggle;
      setMenuState(!mobileMenu.classList.contains('is-open'));
    });
  });

  menuClose.addEventListener('click', () => setMenuState(false));
  menuBackdrop.addEventListener('click', () => setMenuState(false));
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      const href = link.getAttribute('href') || '';
      restoreMenuScroll = !(href.startsWith('#') && href.length > 1);
      setMenuState(false);
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

const stickyHeader = document.querySelector('[data-sticky-header]');
const backToTop = document.querySelector('[data-back-to-top]');
const pageHero = document.querySelector('.hero');

if (stickyHeader && backToTop && pageHero) {
  const stickyLinks = [...stickyHeader.querySelectorAll('.desktop-nav a')];
  const sectionIds = ['company', 'solutions', 'applications', 'technology', 'advantages', 'contacts'];
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean)
    .sort((first, second) => first.offsetTop - second.offsetTop);
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const setChromeVisible = (isVisible) => {
    stickyHeader.classList.toggle('is-visible', isVisible);
    stickyHeader.toggleAttribute('inert', !isVisible);
    stickyHeader.setAttribute('aria-hidden', String(!isVisible));
    backToTop.classList.toggle('is-visible', isVisible);
    backToTop.toggleAttribute('inert', !isVisible);
    backToTop.setAttribute('aria-hidden', String(!isVisible));
  };

  const setActiveSection = (id) => {
    stickyLinks.forEach((link) => {
      const href = link.getAttribute('href');
      const isActive = href === `#${id}`;
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  if ('IntersectionObserver' in window) {
    const chromeObserver = new IntersectionObserver((entries) => {
      setChromeVisible(!entries[0].isIntersecting);
    }, { threshold: 0 });

    chromeObserver.observe(pageHero);

    const updateActive = () => {
      const marker = 116;
      let currentId = '';
      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= marker) currentId = section.id;
      });
      if (currentId) setActiveSection(currentId);
    };

    const spyObserver = new IntersectionObserver(updateActive, {
      rootMargin: '-116px 0px -40% 0px',
      threshold: [0, 0.2, 0.45, 0.7]
    });

    sections.forEach((section) => spyObserver.observe(section));
    updateActive();
  } else {
    setChromeVisible(pageHero.getBoundingClientRect().bottom <= 0);
  }

  backToTop.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: motionQuery.matches ? 'auto' : 'smooth'
    });
  });
}
