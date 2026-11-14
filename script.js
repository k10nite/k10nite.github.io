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
    holdCard.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-hold]');
      if (!btn) return;
      const approve = btn.dataset.hold === 'approve';
      $('#holdText').textContent = approve
        ? 'Approved by the desk. The order goes to the ERP.'
        : 'Kept stopped. The duplicate never reaches the ERP.';
      $('.float__meta', holdCard).textContent = approve ? 'Approved by a person' : 'Stopped by a person';
      $('.float__actions', holdCard).innerHTML = '<button class="btn-mini" type="button" data-hold-reset>Undo</button>';
      $('[data-hold-reset]', holdCard).addEventListener('click', (ev) => {
        ev.stopPropagation();
        $('#holdText').textContent = 'Held: this looks like the same order we received on Tuesday.';
        $('.float__meta', holdCard).textContent = 'Waiting on you';
        $('.float__actions', holdCard).innerHTML =
          '<button class="btn-mini btn-mini--fill" type="button" data-hold="keep">Keep it stopped</button>' +
          '<button class="btn-mini" type="button" data-hold="approve">Approve</button>';
      });
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
      el.textContent = fmt.format(Math.round(target * (1 - Math.pow(1 - p, 4))));
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

  /* ---------- Scroll receipt ---------- */
  const steps = $('#steps');
  const receipt = $('#receipt');
  const stepEls = $$('.step', steps);
  const blocks = $$('.receipt__block', receipt);
  const onReceipt = () => {
    if (!desktop.matches || reduced) {
      receipt.style.setProperty('--p', 1);
      blocks.forEach((b) => b.classList.remove('is-future'));
      stepEls.forEach((s) => s.classList.add('is-active'));
      return;
    }
    const mid = innerHeight * 0.55;
    let active = -1;
    stepEls.forEach((s, i) => { if (s.getBoundingClientRect().top < mid) active = i; });
    stepEls.forEach((s, i) => s.classList.toggle('is-active', i === active));
    blocks.forEach((b, i) => b.classList.toggle('is-future', i > active));

    // Paper feeds out far enough to show everything up to the active block,
    // then eases toward the next one as that step approaches.
    const h = receipt.offsetHeight;
    const bottomOf = (i) => (i < 0 ? blocks[0].offsetTop : blocks[i].offsetTop + blocks[i].offsetHeight);
    let shown = bottomOf(active);
    const next = stepEls[active + 1];
    if (next) {
      const r = next.getBoundingClientRect();
      const t = clamp(1 - (r.top - mid) / (innerHeight * 0.35));
      shown += (bottomOf(active + 1) - shown) * t * 0.6;
    } else {
      shown = h;
    }
    receipt.style.setProperty('--p', clamp(shown / h).toFixed(4));
  };

  /* ---------- Scroll loop ---------- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onNav(); onReceipt(); ticking = false; });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onNav(); onReceipt();

  /* ---------- Simulator ---------- */
  const CASES = {
    pdf: {
      from: 'Wholesale customer · orders inbox',
      subject: 'Purchase order PO-20418',
      snippet: 'Please find our order attached. PO-20418.pdf (2 pages)',
      notes: ['Tracked as a job', 'New order', 'Fixed reader for this layout, 14 lines', 'Matches the document, no duplicate', 'Sales order created'],
      stop: null,
      tone: 'created', badge: 'Created in the ERP',
      title: 'Clean order, no one had to touch it.',
      body: 'This customer\'s format already passed a replay on real past orders, so auto-send is on for them.'
    },
    sheet: {
      from: 'New stockist · orders inbox',
      subject: 'Order for next week',
      snippet: 'Hi, our order is in the attached sheet. order_wk47.xlsx',
      notes: ['Tracked as a job', 'New order', 'No template fits, Claude reads it', 'Matches the document, no duplicate', 'Held for approval'],
      stop: 4,
      tone: 'held', badge: 'Waiting on you',
      title: 'Read correctly, but a person approves it.',
      body: 'Auto-send is switched on one customer at a time. Until this format has passed a replay, the desk sees the document, what was read, and approves.'
    },
    dup: {
      from: 'Wholesale customer · orders inbox',
      subject: 'RE: Purchase order PO-20418 (resending)',
      snippet: 'Resending in case the first one didn\'t arrive. PO-20418.pdf',
      notes: ['Tracked as a job', 'New order', 'Fixed reader for this layout, 14 lines', 'Same order as one already received', ''],
      stop: 3,
      tone: 'held', badge: 'Duplicate stopped',
      title: 'Stopped at the gate before the ERP.',
      body: 'One of 1,303 duplicates caught in 9 weeks. It is held with the reason in plain English, and the system never clears its own holds.'
    },
    reply: {
      from: 'Existing customer · orders inbox',
      subject: 'RE: Your order confirmation',
      snippet: 'Thanks. Could we move delivery to Thursday instead?',
      notes: ['Tracked as a job', 'Customer reply, not a new order', '', '', ''],
      stop: 1,
      tone: 'routed', badge: 'Routed to a person',
      title: 'A reply goes to someone who can answer it.',
      body: 'Replies are separated from new orders and handed to the desk. They are never auto-closed.'
    },
    news: {
      from: 'Supplier marketing · orders inbox',
      subject: 'Our autumn range is here',
      snippet: 'New season, new flavours. View in browser.',
      notes: ['Tracked as a job', 'Newsletter, not an order', '', '', ''],
      stop: 1,
      tone: 'routed', badge: 'Logged, no action',
      title: 'Sorted out of the way.',
      body: 'Newsletters, invoices and portal notices are logged and kept off the order desk\'s plate.'
    }
  };

  const nodes = $$('.node', $('#track'));
  const outcome = $('#outcome');
  let runId = 0;
  let current = 'pdf';

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

  /* ---------- Email journey switch ---------- */
  const survey = $('#surveyDone');
  survey.addEventListener('change', () => {
    $$('.jstep[data-kind="chaser"]').forEach((j) => j.classList.toggle('is-stopped', survey.checked));
    $('#journeyState').textContent = survey.checked
      ? 'Survey done: both chasers are cancelled. Nobody gets chased after they act.'
      : 'Survey not done yet: chasers are scheduled.';
  });

  /* ---------- Skills ---------- */
  const SKILLS = {
    automation: ['n8n (self-hosted)', 'Zapier', 'Docker', 'Reverse proxy', 'SSL', 'Microsoft Graph', 'Slack alerts'],
    ai: ['Claude API', 'GPT-4 API', 'RAG pipelines', 'FAISS', 'RASA NLU', 'XGBoost', 'Random Forest', 'SHAP'],
    backend: ['Python', 'Node.js', 'FastAPI', 'PostgreSQL', 'Supabase', 'MongoDB'],
    frontend: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    geo: ['Google Earth Engine', 'Sentinel-2', 'Landsat-8', 'Rasterio', 'GDAL']
  };
  const panel = $('#skillPanel');
  const showSkills = (key) => {
    panel.replaceChildren(...SKILLS[key].map((s, i) => {
      const el = document.createElement('span');
      el.textContent = s;
      el.style.animationDelay = `${i * 35}ms`;
      return el;
    }));
  };
  wireTabs($('#skillTabs'), (t) => showSkills(t.dataset.skill));
  showSkills('automation');

  /* ---------- Project filter ---------- */
  const pills = $$('.pill', $('#filters'));
  const cards = $$('.card--proj');
  pills.forEach((p) => p.addEventListener('click', () => {
    pills.forEach((x) => x.setAttribute('aria-pressed', String(x === p)));
    const f = p.dataset.filter;
    cards.forEach((c) => c.classList.toggle('is-out', f !== 'all' && !c.dataset.tags.split(' ').includes(f)));
  }));

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
  const revealEls = $$('.card, .xp__row, .display, .heading, .lede, .sim, .skills');
  revealEls.forEach((el) => el.setAttribute('data-reveal', ''));
  const revIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); revIO.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach((el) => revIO.observe(el));
})();
