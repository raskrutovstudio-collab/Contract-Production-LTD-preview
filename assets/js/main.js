document.documentElement.classList.add('js');

const toggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const backdrop = document.querySelector('.menu-backdrop');

if (toggle && mobileNav && backdrop) {
  const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let returnFocus = null;

  const setMenuState = open => {
    mobileNav.classList.toggle('is-open', open);
    backdrop.classList.toggle('is-visible', open);
    backdrop.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    mobileNav.setAttribute('aria-hidden', String(!open));
    mobileNav.inert = !open;
    document.body.classList.toggle('menu-open', open);

    if (open) {
      returnFocus = document.activeElement;
      const first = mobileNav.querySelector(focusableSelector);
      first?.focus();
    } else if (returnFocus instanceof HTMLElement) {
      returnFocus.focus();
      returnFocus = null;
    }
  };

  const closeMenu = () => setMenuState(false);

  toggle.addEventListener('click', () => {
    setMenuState(!mobileNav.classList.contains('is-open'));
  });

  backdrop.addEventListener('click', closeMenu);
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', event => {
    if (!mobileNav.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === 'Tab') {
      const focusable = [...mobileNav.querySelectorAll(focusableSelector)];
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
    if (window.innerWidth > 1100 && mobileNav.classList.contains('is-open')) {
      closeMenu();
    }
  });
}

const reveals = [...document.querySelectorAll('.reveal')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach(el => observer.observe(el));
} else {
  reveals.forEach(el => el.classList.add('is-visible'));
}
