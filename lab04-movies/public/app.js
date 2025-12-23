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
    throw new Error(msg);
  }
  return data;
}

const fmt2 = (x) => Number(x).toFixed(2);

function buildMoviesUrl() {
  const year = $('#filter-year')?.value?.trim();
  const limit = $('#filter-limit')?.value?.trim();
  const u = new URL('/api/movies', window.location.origin);
  if (year) u.searchParams.set('year', year);
  if (limit) u.searchParams.set('limit', limit);
  return u.pathname + u.search;
}

async function loadMovies() {
  const tbody = $('#movies-body');
  const select = $('#movie_id');
  if (!tbody || !select) return;

  const rows = await fetchJSON(buildMoviesUrl());
  tbody.innerHTML = '';
  rows.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${m.id}</td>
      <td>${escapeHtml(m.title)}</td>
      <td>${m.year}</td>
      <td>${fmt2(m.avg_score)}</td>
      <td>${m.votes}</td>
    `;
    tbody.appendChild(tr);
  });

  const all = await fetchJSON('/api/movies');
  select.innerHTML = '';
  all.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `#${m.id} — ${m.title} (${m.year})`;
    select.appendChild(opt);
  });
}

async function addMovie(e) {
  e.preventDefault();
  const title = $('#title').value.trim();
  const year = parseInt($('#year').value, 10);

  try {
    const r = await fetchJSON('/api/movies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, year })
    });
    $('#movie-result').textContent = `Dodano film. ID: ${r.id}`;
    $('#title').value = '';
    $('#year').value = '';
    await loadMovies();
  } catch (err) {
    alert('Nie udało się dodać filmu: ' + err.message);
  }
}

async function addRating(e) {
  e.preventDefault();
  const movie_id = parseInt($('#movie_id').value, 10);
  const score = parseInt($('#score').value, 10);

  try {
    const r = await fetchJSON('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movie_id, score })
    });
    $('#rate-result').textContent = `Dodano ocenę. ID: ${r.id}`;
    await loadMovies();
  } catch (err) {
    alert('Nie udało się dodać oceny: ' + err.message);
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

window.addEventListener('DOMContentLoaded', () => {
  loadMovies();
  $('#add-movie-form')?.addEventListener('submit', addMovie);
  $('#rate-form')?.addEventListener('submit', addRating);
  $('#apply-filters')?.addEventListener('click', loadMovies);
  $('#clear-filters')?.addEventListener('click', () => {
    $('#filter-year').value = '';
    $('#filter-limit').value = '';
    loadMovies();
  });
});
