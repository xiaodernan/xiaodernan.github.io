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
window.__teachInteractive = function teachInteractive() {
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
};


/* ── D1433 · 中英一键切换 · one-click EN/zh, block-swap, IDs preserved ── */
(function i18nOneClick() {
  const KEY = 'portfolio-lang';
  const store = {
    get: () => { try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'zh'; } catch (_) { return 'zh'; } },
    set: (v) => { try { localStorage.setItem(KEY, v); } catch (_) { /* private mode */ } },
  };
  const btn = document.querySelector('[data-lang-toggle]');
  const blocks = [...document.querySelectorAll('[data-i18n-block]')];
  const keys = blocks.map((el) => el.getAttribute('data-i18n-block'));
  const zhNodes = {};
  const enNodes = {};
  blocks.forEach((el, i) => { zhNodes[keys[i]] = el; });
  document.querySelectorAll('template[data-i18n-en]').forEach((t) => {
    const key = t.getAttribute('data-i18n-en');
    const wrap = document.createElement('div');
    wrap.innerHTML = t.innerHTML;
    const node = wrap.firstElementChild;
    if (node) enNodes[key] = node;
  });
  const current = {};
  keys.forEach((k) => { current[k] = zhNodes[k]; });
  const NAV_TEXT = {
    en: { 0: 'Home', 1: 'Work', 2: 'Lab', 3: 'Systems', 4: 'Journey', 5: 'Contact' },
    zh: { 0: '首页', 1: '作品', 2: '实验', 3: '能力', 4: '经历', 5: '联系' },
  };
  const navLinks = [...document.querySelectorAll('.main-nav a')];
  function applyLang(lang) {
    for (const key of keys) {
      const target = lang === 'en' ? enNodes[key] : zhNodes[key];
      if (target && current[key] !== target) {
        current[key].replaceWith(target);
        current[key] = target;
      }
    }
    navLinks.forEach((a, i) => { const t = NAV_TEXT[lang] && NAV_TEXT[lang][i]; if (t) a.textContent = t; });
    // Keep title hints truly bilingual: data-tip-zh / data-tip-en ride along with the text swap.
    document.querySelectorAll('[data-tip-zh]').forEach((el) => {
      const tip = lang === 'en' ? el.dataset.tipEn : el.dataset.tipZh;
      if (tip) el.setAttribute('title', tip);
    });
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.documentElement.dataset.lang = lang;
    if (btn) {
      btn.textContent = lang === 'en' ? '中' : 'EN';
      btn.setAttribute('aria-pressed', String(lang === 'en'));
      btn.setAttribute('title', lang === 'en' ? '切换到中文版 · Switch to Chinese' : '切换到英文版 · Switch to English');
    }
    store.set(lang);
    // Let the live fact-pack updaters re-paint the swapped-in tower immediately —
    // the EN tower is a template until this runs, and a static bake is not evidence.
    try { window.dispatchEvent(new CustomEvent('portfolio:lang', { detail: lang })); } catch (_) {}
    if (typeof window.__teachInteractive === 'function') window.__teachInteractive();
  }
  btn?.addEventListener('click', () => applyLang(store.get() === 'en' ? 'zh' : 'en'));
  applyLang(store.get());
})();
