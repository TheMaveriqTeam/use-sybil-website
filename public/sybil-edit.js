/*
 * Website editor for preview.usesybil.pro (only loaded when the site is
 * built with PUBLIC_SYBIL_EDIT=1; see src/lib/editMode.ts).
 *
 * Every copy string arrives wrapped in zero-width characters that carry its
 * key in src/content/en.json. This script turns those into editable spans,
 * keeps unpublished changes in this browser (across pages) and publishes
 * them through /api/save, which commits en.json: the live site rebuilds.
 */
(() => {
  'use strict';

  const START = '\u2063', SEP = '\u2064', END = '\u2062';
  const DIGITS = ['\u200B', '\u200C', '\u200D', '\u2060'];
  const MARK = new RegExp(`${START}([${DIGITS.join('')}]+)${SEP}([\\s\\S]*?)${END}`, 'g');
  const STRAY = new RegExp(`[${START}${SEP}${END}${DIGITS.join('')}]`, 'g');
  const HAS_STRAY = new RegExp(`[${START}${SEP}${END}]`);
  const STORE = 'sybil-edit-changes';
  const PW = 'sybil-edit-password';
  const MODE = 'sybil-edit-mode';

  const data = JSON.parse(document.getElementById('sybil-copy').textContent);
  const copy = data.copy;
  const tokens = data.tokens;

  // ---- helpers ------------------------------------------------------------

  const decodeKey = (s) => {
    let key = '';
    for (let i = 0; i + 3 < s.length; i += 4) {
      let c = 0;
      for (let j = 0; j < 4; j++) c = (c << 2) | DIGITS.indexOf(s[i + j]);
      key += String.fromCharCode(c);
    }
    return key;
  };

  const getRaw = (key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), copy);

  const fill = (text, extra = {}) => text.replace(/\{(\w+)\}/g, (m, k) => extra[k] ?? tokens[k] ?? m);

  const store = {
    read() { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; } },
    write(v) { try { localStorage.setItem(STORE, JSON.stringify(v)); } catch { /* private window */ } },
  };
  const session = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch { /* ignore */ } },
  };

  /** changes: { key: { from, to } } — `from` is the published text it was edited from. */
  let changes = store.read();
  for (const [k, c] of Object.entries(changes)) {
    // Already live (published from here or elsewhere): forget it.
    if (getRaw(k) === c.to) delete changes[k];
  }
  store.write(changes);

  const current = (key) => (changes[key] ? changes[key].to : getRaw(key));

  const allKeys = [];
  (function walk(o, path) {
    if (typeof o === 'string') { if (!/\.(tone|id)$/.test(path)) allKeys.push(path); return; }
    if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, path ? `${path}.${k}` : k);
  })(copy, '');

  const KNOWN = new Set(Object.keys(tokens).concat('name'));
  const unknownTokens = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((t) => !KNOWN.has(t));

  // ---- turn markers into editable spans -------------------------------------

  const spans = new Map(); // key -> span[]
  const extraFor = (key) => (key === 'ui.languageSoon' ? { name: '' } : {});

  function wrapTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeValue.includes(START) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const parent = node.parentNode;
      if (!parent || /^(SCRIPT|STYLE|TITLE)$/.test(parent.nodeName)) continue;
      const frag = document.createDocumentFragment();
      let last = 0;
      const text = node.nodeValue;
      MARK.lastIndex = 0;
      for (let m; (m = MARK.exec(text));) {
        if (m.index > last) frag.append(text.slice(last, m.index).replace(STRAY, ''));
        const key = decodeKey(m[1]);
        const span = document.createElement('span');
        span.className = 'sy-k';
        span.dataset.k = key;
        span.textContent = m[2];
        if (!spans.has(key)) spans.set(key, []);
        spans.get(key).push(span);
        frag.append(span);
        last = m.index + m[0].length;
      }
      if (last < text.length) frag.append(text.slice(last).replace(STRAY, ''));
      parent.replaceChild(frag, node);
    }
  }

  function cleanAttributes() {
    for (const el of document.querySelectorAll('*')) {
      for (const attr of el.attributes) {
        if (HAS_STRAY.test(attr.value)) {
          el.setAttribute(attr.name, attr.value.replace(MARK, '$2').replace(STRAY, ''));
        }
      }
    }
    document.title = document.title.replace(MARK, '$2').replace(STRAY, '');
  }

  function render(key) {
    for (const span of spans.get(key) || []) {
      if (span === document.activeElement) continue;
      const raw = current(key);
      if (key === 'ui.languageSoon') continue; // shown with a language name filled in
      span.textContent = fill(raw, extraFor(key));
      span.classList.toggle('sy-changed', !!changes[key]);
    }
  }

  // ---- editing ---------------------------------------------------------------

  let editing = session.get(MODE) !== 'preview';

  function setChange(key, to) {
    const from = getRaw(key);
    if (to === from) delete changes[key];
    else changes[key] = { from, to };
    store.write(changes);
    render(key);
    updateBar();
    syncPanelField(key);
  }

  function startEdit(span) {
    const key = span.dataset.k;
    span.contentEditable = 'plaintext-only';
    if (span.contentEditable !== 'plaintext-only') span.contentEditable = 'true';
    span.dataset.before = current(key);
    span.textContent = current(key); // show {tokens} while editing
    span.classList.add('sy-active');
    span.focus();
    const range = document.createRange();
    range.selectNodeContents(span);
    range.collapse(false);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    showHint(span, key);
  }

  function endEdit(span, keep) {
    const key = span.dataset.k;
    span.removeAttribute('contenteditable');
    span.classList.remove('sy-active');
    hideHint();
    const value = keep ? span.textContent.replace(/\s+/g, ' ').trim() : span.dataset.before;
    if (keep && !value) {
      toast('A text can’t be empty. The change was undone.');
      setChange(key, span.dataset.before);
    } else if (keep && unknownTokens(value).length) {
      toast(`Unknown placeholder ${unknownTokens(value).map((t) => `{${t}}`).join(', ')}. The change was undone.`);
      setChange(key, span.dataset.before);
    } else {
      setChange(key, value);
    }
    span.blur();
  }

  document.addEventListener('click', (e) => {
    if (!editing) return;
    const span = e.target.closest && e.target.closest('.sy-k');
    if (!span || e.target.closest('#sy-bar, #sy-panel')) return;
    if (span.dataset.k === 'ui.languageSoon') return;
    // Don't follow the link / toggle the FAQ while editing its words.
    e.preventDefault();
    e.stopPropagation();
    if (span.isContentEditable) return;
    startEdit(span);
  }, true);

  document.addEventListener('keydown', (e) => {
    const span = document.activeElement;
    if (!span || !span.classList || !span.classList.contains('sy-k')) return;
    if (e.key === 'Enter') { e.preventDefault(); endEdit(span, true); }
    if (e.key === 'Escape') { e.preventDefault(); endEdit(span, false); }
  });

  document.addEventListener('focusout', (e) => {
    const span = e.target;
    if (span.classList && span.classList.contains('sy-k') && span.isContentEditable) endEdit(span, true);
  });

  // Paste as plain text on one line.
  document.addEventListener('paste', (e) => {
    const span = document.activeElement;
    if (!span || !span.classList || !span.classList.contains('sy-k')) return;
    e.preventDefault();
    const text = (e.clipboardData.getData('text/plain') || '').replace(/\s+/g, ' ');
    document.execCommand('insertText', false, text);
  });

  // ---- UI: bar, hint, panel, toast ---------------------------------------------

  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'on') for (const [ev, fn] of Object.entries(v)) n.addEventListener(ev, fn);
      else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
    }
    n.append(...kids);
    return n;
  };

  const countEl = el('span', { class: 'sy-count' });
  const modeBtn = el('button', { type: 'button', class: 'sy-btn sy-ghost', on: { click: toggleMode } });
  const listBtn = el('button', { type: 'button', class: 'sy-btn sy-ghost', on: { click: () => togglePanel() } }, 'All texts');
  const discardBtn = el('button', { type: 'button', class: 'sy-btn sy-ghost', on: { click: discard } }, 'Discard');
  const publishBtn = el('button', { type: 'button', class: 'sy-btn', on: { click: publish } }, 'Publish');
  const bar = el('div', { id: 'sy-bar', role: 'region', 'aria-label': 'Website editor' },
    el('span', { class: 'sy-title' }, 'Editing usesybil.pro'), countEl,
    el('span', { class: 'sy-spacer' }), modeBtn, listBtn, discardBtn, publishBtn);

  function updateBar() {
    const n = Object.keys(changes).length;
    countEl.textContent = n ? `${n} unpublished ${n === 1 ? 'change' : 'changes'}` : 'No changes yet';
    publishBtn.disabled = !n;
    discardBtn.disabled = !n;
    modeBtn.textContent = editing ? 'Preview' : 'Edit';
    document.documentElement.classList.toggle('sy-editing', editing);
  }

  function toggleMode() {
    editing = !editing;
    session.set(MODE, editing ? null : 'preview');
    updateBar();
  }

  const hint = el('div', { id: 'sy-hint', hidden: true });
  function showHint(span, key) {
    const raw = current(key);
    const used = [...new Set([...raw.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))];
    hint.textContent = '';
    hint.append(el('b', {}, 'Enter'), ' to keep, ', el('b', {}, 'Esc'), ' to undo.');
    if (used.length) {
      hint.append(el('br'), 'Keep ', ...used.flatMap((t, i) => [i ? ', ' : '', el('code', {}, `{${t}}`)]),
        ': filled in from the price list (', ...used.flatMap((t, i) => [i ? ', ' : '', tokens[t] ?? '?']), ').');
    }
    hint.hidden = false;
    const r = span.getBoundingClientRect();
    hint.style.top = `${Math.max(8, r.top - hint.offsetHeight - 8)}px`;
    hint.style.left = `${Math.min(Math.max(8, r.left), innerWidth - hint.offsetWidth - 8)}px`;
  }
  function hideHint() { hint.hidden = true; }

  const toastEl = el('div', { id: 'sy-toast', role: 'status', 'aria-live': 'polite', hidden: true });
  let toastTimer;
  function toast(msg, ms = 5000) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
  }

  // All texts panel: every key, including those not visible on this page
  // (page titles, descriptions, screen-reader labels, other pages).
  const search = el('input', { type: 'search', placeholder: 'Search texts', class: 'sy-search', on: { input: filterPanel } });
  const onlyChanged = el('input', { type: 'checkbox', on: { change: filterPanel } });
  const list = el('div', { class: 'sy-list' });
  const panel = el('aside', { id: 'sy-panel', hidden: true, 'aria-label': 'All texts' },
    el('div', { class: 'sy-panel-head' },
      el('b', {}, 'All texts'),
      el('button', { type: 'button', class: 'sy-btn sy-ghost', on: { click: () => togglePanel(false) } }, 'Close')),
    search,
    el('label', { class: 'sy-check' }, onlyChanged, ' Only changed'),
    list);
  const fields = new Map();

  const label = (key) => key
    .replace(/\.(\d+)(?=\.|$)/g, (m, n) => ` ${Number(n) + 1}`)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split('.').join(' › ');

  function buildPanel() {
    for (const key of allKeys) {
      const area = el('textarea', { rows: 2, 'data-k': key, on: {
        change: (e) => {
          const v = e.target.value.replace(/\s+/g, ' ').trim();
          if (!v) { toast('A text can’t be empty.'); e.target.value = current(key); return; }
          if (unknownTokens(v).length) { toast(`Unknown placeholder ${unknownTokens(v).map((t) => `{${t}}`).join(', ')}.`); e.target.value = current(key); return; }
          setChange(key, v);
        },
      } });
      area.value = current(key);
      const onPage = spans.has(key);
      const row = el('label', { class: 'sy-row', 'data-k': key },
        el('span', { class: 'sy-key' }, label(key), onPage ? '' : el('em', {}, ' · not on this page')), area);
      fields.set(key, row);
      list.append(row);
    }
  }
  function syncPanelField(key) {
    const row = fields.get(key);
    if (!row) return;
    const area = row.querySelector('textarea');
    if (document.activeElement !== area) area.value = current(key);
    row.classList.toggle('sy-changed', !!changes[key]);
  }
  function filterPanel() {
    const q = search.value.toLowerCase();
    for (const [key, row] of fields) {
      const hit = !q || key.toLowerCase().includes(q) || current(key).toLowerCase().includes(q);
      row.hidden = !hit || (onlyChanged.checked && !changes[key]);
    }
  }
  function togglePanel(force) {
    const open = force ?? panel.hidden;
    panel.hidden = !open;
    if (open) { filterPanel(); search.focus(); }
  }

  // ---- discard / publish ---------------------------------------------------

  function discard() {
    const n = Object.keys(changes).length;
    if (!n || !confirm(`Discard ${n} unpublished ${n === 1 ? 'change' : 'changes'}?`)) return;
    const keys = Object.keys(changes);
    changes = {};
    store.write(changes);
    keys.forEach((k) => { render(k); syncPanelField(k); });
    updateBar();
  }

  async function publish() {
    const entries = Object.entries(changes);
    if (!entries.length) return;
    let password = session.get(PW);
    if (!password) {
      password = prompt('Editor password');
      if (!password) return;
    }
    publishBtn.disabled = true;
    publishBtn.textContent = 'Publishing…';
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-edit-password': password },
        body: JSON.stringify({ changes: entries.map(([key, c]) => ({ key, from: c.from, to: c.to })) }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.status === 401) { session.set(PW, null); toast('That password is not right. Nothing was published.'); return; }
      if (res.status === 409 && out.conflicts) {
        toast(`Someone changed ${out.conflicts.length === 1 ? 'this text' : 'these texts'} in the meantime: ${out.conflicts.map(label).join('; ')}. Reload to see the latest, then edit again.`, 12000);
        return;
      }
      if (!res.ok) { toast(out.error || `Publishing failed (${res.status}). Your changes are kept here.`, 10000); return; }
      session.set(PW, password);
      // Published: these are now the base texts.
      for (const [key, c] of entries) {
        const parts = key.split('.');
        const parent = parts.slice(0, -1).reduce((o, k) => o[k], copy);
        parent[parts[parts.length - 1]] = c.to;
      }
      changes = {};
      store.write(changes);
      entries.forEach(([k]) => { render(k); syncPanelField(k); });
      toast(`Published ${entries.length} ${entries.length === 1 ? 'change' : 'changes'}. The live site updates in about a minute.`, 10000);
    } catch {
      toast('Could not reach the server. Your changes are kept here; try again.');
    } finally {
      publishBtn.textContent = 'Publish';
      updateBar();
    }
  }

  // ---- go ------------------------------------------------------------------------

  function init() {
    wrapTextNodes(document.body);
    cleanAttributes();
    document.body.append(bar, hint, panel, toastEl);
    for (const key of Object.keys(changes)) render(key);
    buildPanel();
    updateBar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
