const topbar = document.querySelector('[data-topbar]');
const themeToggle = document.querySelector('[data-theme-toggle]');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const projectRows = [...document.querySelectorAll('[data-project-table] .index-row')];

const savedTheme = localStorage.getItem('portfolio-theme');
if (savedTheme) document.body.dataset.theme = savedTheme;

// ── 外链星标徽章（img.shields.io）加载失败时直接隐藏该 img——绝不留破图 ——
// （2026-11-19 实测：某网络下 shield 请求一次都没发出，22 枚徽章全悬空；隐藏干净图IO。）
document.addEventListener('error', (event) => {
  const img = event.target;
  if (img instanceof HTMLImageElement) {
    const src = img.currentSrc || img.src || '';
    if (src.includes('img.shields.io')) img.style.display = 'none';
  }
}, true);

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
// 每次切换语言都重新生成，保证提示与页面同语；data-auto-title 标记自动项，
// 既不会覆盖手写提示，也不会在切换后残留旧语言的说明。
window.__teachInteractive = function teachInteractive() {
  const en = document.documentElement.dataset.lang === 'en';
  const T = (zh, eng) => (en ? eng : zh);
  document.querySelectorAll('[data-auto-title]').forEach((el) => {
    el.removeAttribute('title');
    el.removeAttribute('data-auto-title');
    // 切换语言时旧的说明节点要一起收走，否则上一次语言的说明会**叠**在新的上面
    const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id.startsWith('site-tip-'));
    ids.forEach((id) => { const n = document.getElementById(id); if (n) n.remove(); });
    const kept = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && !id.startsWith('site-tip-'));
    if (kept.length) el.setAttribute('aria-describedby', kept.join(' '));
    else el.removeAttribute('aria-describedby');
  });
  /* 提示句的**唯一**出口：它同时落到三个地方——
     ① `title`（鼠标悬停看得见）；
     ② `aria-describedby`（读屏软件念得出来——**触屏根本没有 title 浮层**，
        只写 title 的话，手机上这些说明等于不存在）；
     ③ 一个视觉隐藏的说明节点（给 aria-describedby 指过去）。
     说明书里那句「说明会同步出现在可访问名称中」以前是**没有实现的**（只写了 title），
     而说明书是对外承诺 ⇒ 这里把它变成事实。 */
  let tipSeq = 0;
  const tipHost = document.getElementById('site-tip-host') || (() => {
    const host = document.createElement('div');
    host.id = 'site-tip-host';
    host.setAttribute('aria-live', 'polite');
    host.style.cssText = 'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0';
    document.body.appendChild(host);
    return host;
  })();
  const set = (el, tip) => {
    if (!el || el.getAttribute('title')) return;
    el.setAttribute('title', tip);
    el.setAttribute('data-auto-title', '1');
    const id = `site-tip-${++tipSeq}`;
    const node = document.createElement('span');
    node.id = id;
    node.textContent = tip;
    tipHost.appendChild(node);
    const prev = el.getAttribute('aria-describedby');
    el.setAttribute('aria-describedby', prev ? `${prev} ${id}` : id);
  };
    if (!el || el.getAttribute('title')) return;
    el.setAttribute('title', tip);
    el.setAttribute('data-auto-title', '1');
  };
  const labelOf = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
  const setAll = (sel, zh, eng) => document.querySelectorAll(sel).forEach((el) => set(el, T(zh, eng)));
  const fromText = (sel, zhPrefix, engPrefix) => document.querySelectorAll(sel).forEach((el) => {
    const label = labelOf(el);
    if (label) set(el, T(`${zhPrefix}「${label}」`, `${engPrefix} “${label}”`));
  });

  // 顶部导航：跳到页面各区块
  document.querySelectorAll('.main-nav a').forEach((a) => {
    const label = labelOf(a);
    set(a, T(`跳转到区块「${label}」`, `Jump to the “${label}” section`));
  });
  setAll('.topbar .text-link', '打开 GitHub 个人主页 · 公开作品时间线', 'Open my GitHub profile · public timeline of shipped work');
  setAll('[data-theme-toggle]', '切换浅色 / 深色主题 · 偏好保存在本机浏览器', 'Toggle light / dark theme · saved in this browser');
  // 英雄区按钮：按去向分别说明
  document.querySelectorAll('.hero-actions .button').forEach((el) => {
    const href = el.getAttribute('href') || '';
    if (href === '#work') set(el, T('滚动到「精选作品」· 六件产出与真实数字', 'Scroll to featured work · six shipped projects with real numbers'));
    else if (href.indexOf('yindun') !== -1) set(el, T('打开「隐盾」公网演示 · 无需登录，新窗口', 'Open the live Yindun demo · no login, new tab'));
    else if (href.indexOf('manual.html') !== -1) set(el, T('打开《简明说明书》· 五分钟读懂全部功能', 'Open the Quick Manual · every feature in five minutes'));
  });
  fromText('.project-links a', '打开链接', 'Open link');
  fromText('.sub-link', '跳转', 'Go to');
  fromText('.lab-link', '打开', 'Open');
  // 筛选按钮：说明会过滤什么
  document.querySelectorAll('[data-filter]').forEach((b) => {
    const label = labelOf(b);
    set(b, T(`按「${label}」筛选精选作品 · 只显示这一类`, `Filter featured work by “${label}” · show only this category`));
  });
  document.querySelectorAll('[data-repo-filter]').forEach((b) => {
    const label = labelOf(b);
    set(b, T(`按「${label}」筛选公开仓库 · 只显示这一类`, `Filter public repos by “${label}” · show only this group`));
  });
  // 项目索引行：整行可点
  document.querySelectorAll('.index-row').forEach((row) => {
    const strong = row.querySelector('.index-main strong');
    const name = strong ? strong.textContent.trim() : T('这个项目', 'this project');
    set(row, T(`打开「${name}」· 查看公开仓库与实时事实包`, `Open “${name}” · repo and live fact pack`));
  });
  // 仓库卡片
  document.querySelectorAll('.repo-card').forEach((card) => {
    const strong = card.querySelector('.repo-top strong');
    const name = strong ? strong.textContent.trim() : '';
    // 一张**不能点**的卡片不能说"打开公开仓库"——源仓已下架的卡片要说它自己的实话，
    // 而不是把一个死链接说成活的。
    if (!card.hasAttribute('href')) {
      set(card, T(`「${name}」· 源仓已下架，GitHub 上已无此仓，没有链接也没有星数`,
        `“${name}” · source repo is gone; no link, no star count`));
      return;
    }
    set(card, T(`打开公开仓库「${name}」· 在 GitHub 查看源码与提交`, `Open the public repo “${name}” · source and commits on GitHub`));
  });
  // 联系卡
  document.querySelectorAll('.contact-card').forEach((card) => {
    if ((card.getAttribute('href') || '').indexOf('mailto:') === 0) {
      set(card, T('用你的邮件客户端写邮件 · 当天回复', 'Write an email in your mail client · same-day reply'));
    } else {
      set(card, T('打开 GitHub 个人主页 · 公开仓库与提交', 'Open my GitHub profile · public repos and commits'));
    }
  });
  document.querySelectorAll('.anchor-dock a').forEach((a) => {
    const label = (a.getAttribute('aria-label') || '').split(' · ')[0].trim() || 'section';
    set(a, T(`跳到「${label}」章节`, `Jump to the “${label}” chapter`));
  });
  fromText('.footer a', '打开', 'Open');
  fromText('.milestone-cell', '查看', 'View');
  fromText('.github-figures a', '查看', 'View');

  // 通用兜底：任何仍无说明的链接或按钮，按标签与去向生成一句，保证零遗漏。
  document.querySelectorAll('a, button').forEach((el) => {
    if (el.getAttribute('title')) return;
    if (el.classList.contains('skip-link')) return set(el, T('跳到主内容', 'Skip to main content'));
    if (el.classList.contains('brand')) return set(el, T('返回顶部 · 赵欣曈个人主页', 'Back to top · Xintong Zhao’s portfolio'));
    if (el.matches('[data-lang-toggle]')) return set(el, T('切换到英文版', 'Switch to Chinese'));
    const label = labelOf(el);
    const href = el.getAttribute('href') || '';
    if (href.indexOf('#') === 0) set(el, T(`跳到「${label || href.slice(1)}」`, `Jump to “${label || href.slice(1)}”`));
    else if (href.indexOf('mailto:') === 0) set(el, T('写邮件给赵欣曈', 'Email Xintong Zhao'));
    else if (href) set(el, T(`打开「${label || href}」`, `Open “${label || href}”`));
    else set(el, T(`「${label || '按钮'}」`, `“${label || 'button'}”`));
  });
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
    // 顶栏里不随区块替换的短标签（说明书 / Manual）也必须跟着语言走。
    document.querySelectorAll('[data-label-zh]').forEach((el) => {
      const label = lang === 'en' ? el.dataset.labelEn : el.dataset.labelZh;
      if (label) el.textContent = label;
    });
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

/* Anchor-dock scroll-spy — mirrors the top-nav spy for the bottom chapter
   rail. Marks aria-current and paints the active pill. */
const dockLinks = [...document.querySelectorAll('.anchor-dock a[data-dot-go]')];
if (dockLinks.length) {
  const dockTargets = dockLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  const dockObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      dockLinks.forEach((link) => {
        const hit = link.getAttribute('href') === '#' + entry.target.id;
        link.classList.toggle('is-current', hit);
        if (hit) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });
  dockTargets.forEach((target) => dockObserver.observe(target));
}

/* ── D1500 · 本机行为遥测 ──────────────────────────────────────────────
   纯静态站点没有服务端数据库，所以这里只写 localStorage：
   记录访问、停留、滚动深度、点击热区、迷失点击、焦躁连点与快速退出。
   管理员页（admin.html）读取同一份记录。数据不离开这台浏览器。      */
(function zxTelemetry() {
  const KEY = 'zx-telemetry:v1';
  const CAP = 800;
  const path = location.pathname;
  if (/admin\.html$/.test(path)) return; // 面板自身不计入，避免自观测污染
  const now = () => Date.now();
  const rid = () => Math.random().toString(36).slice(2, 10);

  function readStore() {
    try {
      const raw = localStorage.getItem(KEY);
      const data = raw ? JSON.parse(raw) : null;
      if (data && data.v === 1 && Array.isArray(data.events)) return data;
    } catch (_) { /* 存储被禁用时静默降级 */ }
    return { v: 1, events: [] };
  }
  function writeStore(data) {
    try {
      if (data.events.length > CAP) data.events = data.events.slice(-CAP);
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (_) { /* 隐私模式：不写，不报错 */ }
  }
  const store = readStore();
  let visitor = '';
  let session = '';
  try {
    visitor = localStorage.getItem('zx-visitor') || rid();
    localStorage.setItem('zx-visitor', visitor);
    session = sessionStorage.getItem('zx-session') || rid();
    sessionStorage.setItem('zx-session', session);
  } catch (_) { visitor = 'anon'; session = rid(); }

  const lang = () => document.documentElement.dataset.lang === 'en' ? 'en' : 'zh';
  const theme = () => (document.body.dataset.theme === 'dark' ? 'dark' : 'light');
  function push(kind, extra) {
    store.events.push(Object.assign({
      t: now(), k: kind, p: path, s: session, v: visitor, l: lang(), th: theme(),
    }, extra || {}));
    writeStore(store);
  }
  function zoneOf(el) {
    const host = el && el.closest && el.closest('section, header, footer, nav, article');
    if (!host) return 'body';
    return host.id || host.getAttribute('data-i18n-block') || host.tagName.toLowerCase();
  }
  const labelOf = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 42);

  // 1) 访问
  push('view', {
    ref: document.referrer ? new URL(document.referrer).host : '',
    w: window.innerWidth,
    h: window.innerHeight,
    mobile: window.innerWidth < 760,
  });

  // 2) 滚动深度（只记最大值，退出时落盘一次）
  let maxScroll = 0;
  const readScroll = () => {
    const doc = document.documentElement;
    const span = Math.max(1, doc.scrollHeight - window.innerHeight);
    maxScroll = Math.max(maxScroll, Math.min(1, window.scrollY / span));
  };
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  // 3) 点击：可交互 → 热区；不可交互 → 迷失点击；短时间同点三连 → 焦躁连点
  const recent = [];
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const hit = target.closest('a, button, [role="button"], input, select, textarea, label, [data-filter], [data-repo-filter]');
    if (hit) {
      push('click', {
        z: zoneOf(hit),
        lb: labelOf(hit),
        href: (hit.getAttribute('href') || '').slice(0, 80),
      });
    } else {
      push('lost', {
        z: zoneOf(target),
        tg: target.tagName.toLowerCase(),
        cl: String(target.className || '').slice(0, 60),
        x: Math.round((event.clientX / Math.max(1, window.innerWidth)) * 100),
        y: Math.round(((event.clientY + window.scrollY) / Math.max(1, document.documentElement.scrollHeight)) * 100),
      });
    }
    recent.push({ t: now(), x: event.clientX, y: event.clientY });
    while (recent.length && now() - recent[0].t > 1000) recent.shift();
    const near = recent.filter((c) => Math.abs(c.x - event.clientX) < 40 && Math.abs(c.y - event.clientY) < 40);
    if (near.length === 3) push('rage', { z: zoneOf(target), tg: target.tagName.toLowerCase() });
  }, { capture: true, passive: true });

  // 4) 离开：停留时长 + 滚动深度 + 是否快速退出
  let sent = false;
  function flush() {
    if (sent) return;
    sent = true;
    readScroll();
    push('dwell', { ms: now() - started, pct: Math.round(maxScroll * 100), quick: (now() - started) < 8000 });
  }
  const started = now();
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

  // 供管理员页或调试使用
  window.__zxTelemetry = { key: KEY, read: readStore, push };
})();
