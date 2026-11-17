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

const repoFilterButtons = [...document.querySelectorAll('[data-repo-filter]')];
const repoCards = [...document.querySelectorAll('.repo-card')];
repoFilterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    repoFilterButtons.forEach((item) => item.classList.toggle('is-selected', item === button));
    const filter = button.dataset.repoFilter;
    repoCards.forEach((card) => card.toggleAttribute('data-repo-hidden', filter !== 'all' && card.dataset.repoCategory !== filter));
  });
});

// ── 教学提示：给每个可操作元素补一句「它会做什么」（hover / focus 可见）──
(function teachInteractive() {
  const setAll = (sel, tip) => document.querySelectorAll(sel).forEach((el) => {
    if (!el.getAttribute('title')) el.setAttribute('title', tip);
  });
  const fromText = (sel, prefix) => document.querySelectorAll(sel).forEach((el) => {
    if (el.getAttribute('title')) return;
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    if (label) el.setAttribute('title', `${prefix}「${label}」`);
  });
  // 顶部导航：跳到页面各区块
  document.querySelectorAll('.main-nav a').forEach((a) => {
    if (a.getAttribute('title')) return;
    const label = a.textContent.replace(/\s+/g, ' ').trim();
    a.setAttribute('title', `跳转到区块「${label}」 · Jump to section`);
  });
  setAll('.topbar .text-link', '打开 GitHub 个人主页 · My GitHub profile');
  setAll('[data-theme-toggle]', '切换浅色 / 深色主题 · 偏好保存在本机浏览器 (localStorage)');
  // 英雄区按钮
  setAll('.hero .button-primary', '滚动到「精选作品」 · Jump to featured work');
  setAll('.hero .button-quiet', '滚动到联系方式 · Go to contact');
  // 项目链接与子导航（hover 说明去向）
  fromText('.project-links a', '打开链接 · Open');
  fromText('.sub-link', '跳转 · Go');
  fromText('.lab-link', '打开 · Open');
  // 筛选按钮
  setAll('[data-filter]', '按类别筛选精选作品 · Filter featured work by category');
  setAll('[data-repo-filter]', '按类别筛选下方公开仓库 · Filter public repos by category');
  // 项目索引行：整行可点
  document.querySelectorAll('.index-row').forEach((row) => {
    if (row.getAttribute('title')) return;
    const strong = row.querySelector('.index-main strong');
    const name = strong ? strong.textContent.trim() : '这个项目';
    row.setAttribute('title', `打开「${name}」 · 查看公开仓库与实时事实包 · Open repo & live stats`);
  });
  // 仓库卡片
  document.querySelectorAll('.repo-card').forEach((card) => {
    if (card.getAttribute('title')) return;
    const strong = card.querySelector('.repo-top strong');
    const name = strong ? strong.textContent.trim() : '';
    card.setAttribute('title', `打开公开仓库「${name}」 · Open public repo on GitHub`);
  });
  // 联系卡
  document.querySelectorAll('.contact-card').forEach((card) => {
    if (card.getAttribute('title')) return;
    if ((card.getAttribute('href') || '').indexOf('mailto:') === 0) {
      card.setAttribute('title', '用你的邮件客户端写邮件 · Email me (opens mail client)');
    } else {
      card.setAttribute('title', '打开 GitHub 个人主页 · Open my GitHub profile');
    }
  });
  fromText('.footer a', '打开 · Open');
  fromText('.milestone-cell', '查看 · View');
  fromText('.github-figures a', '查看 · View');
})();
