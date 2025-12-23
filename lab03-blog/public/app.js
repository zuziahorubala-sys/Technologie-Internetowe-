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

function getPostIdFromUrl() {
  const u = new URL(window.location.href);
  const id = u.searchParams.get('id');
  const n = parseInt(id, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// ---------- INDEX: POSTS LIST ----------
async function loadPostsList() {
  const container = $('#posts');
  if (!container) return;

  const posts = await fetchJSON('/api/posts');
  container.innerHTML = '';
  posts.forEach(p => {
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = `
      <div class="muted">${p.created_at}</div>
      <h3>${p.title}</h3>
      <p>${p.body.slice(0, 180)}${p.body.length > 180 ? '…' : ''}</p>
      <a href="/post.html?id=${p.id}">Komentarze</a>
    `;
    container.appendChild(div);
  });
}

async function addPost(e) {
  e.preventDefault();
  const title = $('#title').value.trim();
  const body = $('#body').value.trim();

  try {
    await fetchJSON('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body })
    });
    $('#title').value = '';
    $('#body').value = '';
    await loadPostsList();
  } catch (e2) {
    alert('Nie udało się dodać posta: ' + e2.message);
  }
}

// ---------- POST VIEW ----------
async function loadPostView() {
  const postId = getPostIdFromUrl();
  if (!postId) return;

  const posts = await fetchJSON('/api/posts');
  const post = posts.find(x => x.id === postId);
  if (!post) {
    $('#post-title').textContent = 'Post nie istnieje';
    return;
  }

  $('#post-title').textContent = post.title;
  $('#post-meta').textContent = `Utworzono: ${post.created_at} | ID: ${post.id}`;
  $('#post-body').textContent = post.body;

  await loadApprovedComments(postId);
}

async function loadApprovedComments(postId) {
  const container = $('#comments');
  if (!container) return;

  const comments = await fetchJSON(`/api/posts/${postId}/comments`);
  if (comments.length === 0) {
    container.innerHTML = '<div class="muted">Brak zatwierdzonych komentarzy.</div>';
    return;
  }
  container.innerHTML = comments.map(c => `
    <div class="comment">
      <div class="muted">#${c.id} | ${c.created_at} | ${c.author}</div>
      <div>${c.body}</div>
    </div>
  `).join('');
}

async function addComment(e) {
  e.preventDefault();
  const postId = getPostIdFromUrl();
  if (!postId) return;

  const author = $('#author').value.trim();
  const body = $('#comment-body').value.trim();

  try {
    const r = await fetchJSON(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, body })
    });
    $('#author').value = '';
    $('#comment-body').value = '';
    $('#comment-result').textContent = 'Komentarz dodany i oczekuje na moderację (approved=0). ID: ' + r.id;
    // komentarz nie powinien się pojawić publicznie dopóki nie zostanie zatwierdzony
    await loadApprovedComments(postId);
  } catch (e2) {
    alert('Nie udało się dodać komentarza: ' + e2.message);
  }
}

// ---------- MODERATION ----------
async function loadPending() {
  const tbody = $('#pending');
  if (!tbody) return;

  const items = await fetchJSON('/api/comments/pending');
  tbody.innerHTML = '';
  items.forEach(x => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${x.id}</td>
      <td>${x.post_title} (#${x.post_id})</td>
      <td>${x.author}</td>
      <td>${x.body}</td>
      <td>${x.created_at}</td>
      <td><button type="button" class="approve" data-id="${x.id}">Zatwierdź</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('.approve');
    if (!btn) return;
    const id = parseInt(btn.dataset.id, 10);

    try {
      await fetchJSON(`/api/comments/${id}/approve`, { method: 'POST' });
      await loadPending();
    } catch (e2) {
      alert('Nie udało się zatwierdzić: ' + e2.message);
    }
  }, { once: true });
}

window.addEventListener('DOMContentLoaded', () => {
  // index
  if ($('#posts')) {
    loadPostsList();
    $('#add-post-form')?.addEventListener('submit', addPost);
  }
  // post view
  if ($('#post-title')) {
    loadPostView();
    $('#add-comment-form')?.addEventListener('submit', addComment);
  }
  // moderation
  if ($('#pending')) {
    loadPending();
  }
});
