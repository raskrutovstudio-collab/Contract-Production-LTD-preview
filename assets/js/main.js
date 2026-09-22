document.documentElement.classList.add('js');

const toggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');

if (toggle && mobileNav) {
  const closeMenu = () => {
    mobileNav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', () => {
    const open = !mobileNav.classList.contains('is-open');
    mobileNav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
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
