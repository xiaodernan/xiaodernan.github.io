const topbar = document.querySelector('[data-topbar]');
const themeToggle = document.querySelector('[data-theme-toggle]');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const projectRows = [...document.querySelectorAll('[data-project-table] .index-row')];

const savedTheme = localStorage.getItem('portfolio-theme');
if (savedTheme) document.body.dataset.theme = savedTheme;

window.addEventListener('scroll', () => {
  topbar?.classList.toggle('is-scrolled', window.scrollY > 12);
}, { passive: true });

themeToggle?.addEventListener('click', () => {
  const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = next;
  localStorage.setItem('portfolio-theme', next);
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((item) => item.classList.toggle('is-selected', item === button));
    const filter = button.dataset.filter;
    projectRows.forEach((row) => row.classList.toggle('is-hidden', filter !== 'all' && row.dataset.category !== filter));
  });
});

const sectionLinks = [...document.querySelectorAll('.main-nav a')];
const sections = sectionLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    sectionLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-36% 0px -56% 0px', threshold: 0 });
sections.forEach((section) => sectionObserver.observe(section));
