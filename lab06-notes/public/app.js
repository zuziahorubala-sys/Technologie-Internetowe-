const $ = (sel) => document.querySelector(sel);

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', ...(options.headers || {}) },
    ...options
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || text || `${res.status} ${res.statusText}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function parseTagsComma(s) {
  return [...new Set(
    (s || '')
      .split(',')
      .map(x => x.trim())
      .filter(Boolean)
  )];
}

function highlight(text, q) {
  if (!q) return escapeHtml(text);
  const safe = escapeHtml(text);
  // naive highlight: split by q case-insensitive
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig');
  return safe.replace(re, (m) => `<mark>${m}</mark>`);
}

function snippet(body, q, maxLen = 180) {
  const t = String(body || '');
  if (!q) return t.length > maxLen ? t.slice(0, maxLen) + '…' : t;
  const idx = t.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return t.length > maxLen ? t.slice(0, maxLen) + '…' : t;
  const start = Math.max(0, idx - 60);
  const end = Math.min(t.length, idx + 120);
  const s = (start > 0 ? '…' : '') + t.slice(start, end) + (end < t.length ? '…' : '');
  return s;
}

async function loadTags() {
  const tags = await fetchJSON('/api/tags');
  const sel = $('#tag');
  sel.innerHTML = '<option value="">— wszystkie —</option>';
  for (const t of tags) {
    const opt = document.createElement('option');
    opt.value = t.name;
    opt.textContent = t.name;
    sel.appendChild(opt);
  }
}

function renderNotes(notes, q) {
  $('#count').textContent = `Znaleziono: ${notes.length}`;
  const root = $('#list');
  root.innerHTML = '';
  for (const n of notes) {
    const div = document.createElement('div');
    div.className = 'note';

    const sn = snippet(n.body, q);
    div.innerHTML = `
      <h3>#${n.id} — ${highlight(n.title, q)}</h3>
      <div class="meta">Utworzono: ${escapeHtml(n.created_at)}</div>
      <p>${highlight(sn, q)}</p>
      <div class="tags">
        ${(n.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
      </div>
    `;
    root.appendChild(div);
  }
}

async function search() {
  const q = $('#q').value.trim();
  const tag = $('#tag').value.trim();
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (tag) params.set('tag', tag);

  const notes = await fetchJSON('/api/notes?' + params.toString());
  renderNotes(notes, q);
}

$('#btnSearch').addEventListener('click', () => search().catch(e => alert(e.message)));
$('#btnClear').addEventListener('click', async () => {
  $('#q').value = '';
  $('#tag').value = '';
  await search().catch(e => alert(e.message));
});

$('#addNote').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = e.target.elements.title.value.trim();
  const body = e.target.elements.body.value.trim();
  const tags = parseTagsComma(e.target.elements.tags.value);

  try {
    const created = await fetchJSON('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body })
    });

    if (tags.length) {
      await fetchJSON(`/api/notes/${created.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags })
      });
    }

    e.target.reset();
    await loadTags();
    await search();
  } catch (err) {
    alert('Nie udało się dodać notatki: ' + err.message);
  }
});

$('#addTags').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = Number.parseInt(e.target.elements.id.value, 10);
  const tags = parseTagsComma(e.target.elements.tags.value);
  if (!tags.length) return;

  try {
    const res = await fetchJSON(`/api/notes/${id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags })
    });
    $('#tagResult').textContent = `Zapisano tagi dla notatki #${id}: ${res.tags.join(', ')}`;
    e.target.reset();
    await loadTags();
    await search();
  } catch (err) {
    alert('Nie udało się dopisać tagów: ' + err.message);
  }
});

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadTags();
    await search();
  } catch (e) {
    alert('Błąd: ' + e.message);
  }
});
