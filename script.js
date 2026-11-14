(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = matchMedia('(min-width: 901px)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  document.documentElement.classList.add('js');

  /* ---------- Nav: blur + hairline once content scrolls underneath ---------- */
  const nav = $('#nav');
  const onNav = () => nav.classList.toggle('is-stuck', nav.getBoundingClientRect().top <= 0 && scrollY > 8);

  /* ---------- Hero: floating cards follow the pointer ---------- */
  const stage = $('#heroStage');
  if (stage && !reduced && matchMedia('(hover: hover)').matches) {
    const floats = $$('.float', stage);
    const hero = $('.hero');
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      floats.forEach((f) => {
        const d = Number(f.dataset.depth) || 10;
        f.style.transform = `translate(${(x * d).toFixed(1)}px, ${(y * d).toFixed(1)}px)`;
      });
    });
    hero.addEventListener('pointerleave', () => floats.forEach((f) => (f.style.transform = '')));
  }

  /* Hero hold card: the desk decides, not the system */
  const holdCard = $('#holdCard');
  if (holdCard) {
    const initial = $('.float__actions', holdCard).innerHTML;
    holdCard.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.dataset.hold) {
        $('#holdText').textContent = `Thanks. Order created for 12 ${btn.dataset.hold}.`;
        $('.float__meta', holdCard).textContent = 'Answered by a person';
        $('.float__actions', holdCard).innerHTML = '<button class="btn-mini" type="button" data-reset>Undo</button>';
      } else {
        $('#holdText').textContent = 'Flagged: "12" could mean units or cases.';
        $('.float__meta', holdCard).textContent = 'Needs a person';
        $('.float__actions', holdCard).innerHTML = initial;
      }
    });
  }

  /* ---------- Count-up stats ---------- */
  const fmt = new Intl.NumberFormat('en-GB');
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    if (reduced) return;
    const t0 = performance.now();
    const dur = 1400;
    const tick = (t) => {
      const p = clamp((t - t0) / dur);
      el.textContent = fmt.format(Math.round(target * (1 - Math.pow(1 - p, 4)))) + (el.dataset.suffix || '');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { countUp(en.target); countIO.unobserve(en.target); }
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  /* ---------- Scroll loop ---------- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onNav(); ticking = false; });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onNav();

  /* ---------- Simulator ---------- */
  const CASES = {
    clean: {
      from: 'Known customer · order inbox',
      subject: 'Purchase order PO-20418',
      snippet: 'Please find our order attached. PO-20418.pdf',
      notes: ['Picked up from the inbox', 'A real order', 'Email and attachment read', 'Customer, SKU, unit and price all match', 'Sales order created through the ERP API'],
      stop: null,
      tone: 'created', badge: 'Order created',
      title: 'Everything matched, so nobody had to touch it.',
      body: 'The order agreed with live ERP data on customer, SKU, unit vs case and price, so the sales order was created.'
    },
    unit: {
      from: 'Known customer · order inbox',
      subject: 'Order for next week',
      snippet: 'Hi, 12 of the usual please. Thanks!',
      notes: ['Picked up from the inbox', 'A real order', 'Email read', '"12" could mean units or cases', ''],
      stop: 3,
      tone: 'held', badge: 'Flagged for a person',
      title: 'It asks instead of guessing.',
      body: 'The email does not say whether 12 means units or cases. A wrong guess ships the wrong amount, so a person decides.'
    },
    sender: {
      from: 'First-time sender · order inbox',
      subject: 'New order',
      snippet: 'Hello, we would like to place an order. See attached.',
      notes: ['Picked up from the inbox', 'Sender not seen before', '', '', ''],
      stop: 1,
      tone: 'held', badge: 'Not trusted yet',
      title: 'New senders are checked before they are trusted.',
      body: 'An address the system has not seen has its SPF and DKIM checked first. Nothing is created from a sender it cannot trust.'
    },
    reply: {
      from: 'Known customer · order inbox',
      subject: 'RE: Your order confirmation',
      snippet: 'Thanks, received. Speak soon.',
      notes: ['Picked up from the inbox', 'A reply, not a new order', '', '', ''],
      stop: 1,
      tone: 'routed', badge: 'Not an order',
      title: 'Replies are kept apart from orders.',
      body: 'A reply about an existing order is not a new one, so no order is created from it.'
    },
    noise: {
      from: 'Marketing sender · order inbox',
      subject: 'Our autumn range is here',
      snippet: 'New season, new flavours. View in browser.',
      notes: ['Picked up from the inbox', 'Noise', '', '', ''],
      stop: 1,
      tone: 'routed', badge: 'Noise',
      title: 'Sorted out of the way.',
      body: 'Newsletters and other noise are separated from real orders before anything else happens.'
    }
  };

  const nodes = $$('.node', $('#track'));
  const outcome = $('#outcome');
  let runId = 0;
  let current = 'clean';

  const runCase = (key) => {
    current = key;
    const c = CASES[key];
    const id = ++runId;
    $('#mailFrom').textContent = c.from;
    $('#mailSubject').textContent = c.subject;
    $('#mailSnippet').textContent = c.snippet;
    nodes.forEach((n) => { n.className = 'node'; $('.node__note', n).textContent = ''; });
    outcome.classList.remove('is-in');

    const last = c.stop === null ? nodes.length - 1 : c.stop;
    const stepMs = reduced ? 0 : 520;

    const finish = () => {
      nodes.forEach((n, i) => { if (i > last) n.classList.add('is-skip'); });
      const badge = $('#outcomeBadge');
      badge.textContent = c.badge;
      badge.dataset.tone = c.tone;
      $('#outcomeTitle').textContent = c.title;
      $('#outcomeBody').textContent = c.body;
      outcome.classList.add('is-in');
    };

    const advance = (i) => {
      if (id !== runId) return;
      const n = nodes[i];
      $('.node__note', n).textContent = c.notes[i];
      if (i === last && c.stop !== null) {
        n.classList.add('is-stop');
        setTimeout(() => id === runId && finish(), stepMs * 0.6);
        return;
      }
      n.classList.add('is-done');
      if (i === last) { setTimeout(() => id === runId && finish(), stepMs * 0.6); return; }
      setTimeout(() => advance(i + 1), stepMs);
    };
    advance(0);
  };

  const wireTabs = (root, onPick) => {
    const tabs = $$('[role="tab"]', root);
    const pick = (t, focus) => {
      tabs.forEach((x) => { x.setAttribute('aria-selected', String(x === t)); x.tabIndex = x === t ? 0 : -1; });
      if (focus) t.focus();
      onPick(t);
    };
    tabs.forEach((t, i) => {
      t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
      t.addEventListener('click', () => pick(t));
      t.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        pick(tabs[(i + d + tabs.length) % tabs.length], true);
      });
    });
  };

  wireTabs($('#simTabs'), (t) => runCase(t.dataset.case));
  $('#simReplay').addEventListener('click', () => runCase(current));

  // First run starts when the simulator scrolls into view.
  const simIO = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) { runCase(current); simIO.disconnect(); }
  }, { threshold: 0.35 });
  simIO.observe($('.sim__body'));

  /* ---------- MCP before / after ---------- */
  const before = $('#beforeToggle');
  before.addEventListener('change', () => {
    $('#mcpBox').classList.toggle('is-off', before.checked);
    $('#mcpState').textContent = before.checked
      ? 'Before: the team kept hitting the limits on the inventory system\'s API.'
      : 'Now: the team works through the MCP tool.';
  });

  /* ---------- Toolbox ---------- */
  const TOOLS = [
    ['Claude Code', 'Agents', 'My daily driver since its release. I use it for debugging and scheduled pipeline checks, and I run coding agents in parallel on a server, 10 at once in one design brainstorm.'],
    ['MCP', 'Agents', 'I built an MCP tool for an inventory system after working out an API workaround with that system\'s own developers. The team still uses it.'],
    ['Python', 'Build', 'One of the two languages I build in, from university research work to production tooling.'],
    ['TypeScript', 'Build', 'The other language I build in, for the systems I ship and run.'],
    ['Supabase', 'Data', 'The database behind the order system. It is also what I pitched when Notion was being stretched into a database.'],
    ['Railway', 'Deploy', 'Where I deploy. The order system runs here, and I moved to it from n8n.'],
    ['Microsoft 365 / Outlook', 'Integrate', 'The order system watches a Microsoft 365 inbox and sorts real orders from replies and noise.'],
    ['Notion', 'Data', 'The team\'s workspace. It was being used as a database, so I pitched Supabase and Airtable for better data management.'],
    ['n8n', 'Automate', 'I wrote and published n8n-nodes-unleashed, an open-source community node package.'],
    ['Make.com', 'Automate', 'Visual workflow automation, for the jobs where a scenario is quicker than custom code.'],
    ['Apify', 'Research', 'Web data collection for lead research.'],
    ['Apollo', 'Research', 'Prospect data for lead research.']
  ];
  const toolList = $('#toolList');
  const showTool = (i) => {
    const [name, kind, text] = TOOLS[i];
    $$('button', toolList).forEach((b, n) => b.setAttribute('aria-pressed', String(n === i)));
    $('#toolKind').textContent = kind;
    $('#toolName').textContent = name;
    $('#toolText').textContent = text;
    const p = $('#toolPanel');
    p.classList.remove('is-swap'); void p.offsetWidth; p.classList.add('is-swap');
  };
  TOOLS.forEach(([name], i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pill pill--lg'; b.textContent = name;
    b.addEventListener('click', () => showTool(i));
    toolList.append(b);
  });
  showTool(0);

  /* ---------- Copy email ---------- */
  const copy = $('#copyEmail');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copy.dataset.email);
      copy.textContent = 'Copied';
    } catch {
      copy.textContent = copy.dataset.email;
    }
    setTimeout(() => (copy.textContent = 'Copy address'), 2200);
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.card, .xp__row, .display, .piece, .sim, .toolbox, .repo');
  revealEls.forEach((el) => el.setAttribute('data-reveal', ''));
  const revIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); revIO.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach((el) => revIO.observe(el));
})();
