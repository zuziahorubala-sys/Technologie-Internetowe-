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

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

let state = { cols: [], tasks: [] };

function tasksForCol(colId) {
  return state.tasks
    .filter(t => t.col_id === colId)
    .sort((a,b) => a.ord - b.ord || a.id - b.id);
}

function getNextColId(colId) {
  const idx = state.cols.findIndex(c => c.id === colId);
  if (idx < 0) return null;
  return state.cols[idx + 1]?.id ?? null;
}

function maxOrdInCol(colId) {
  const ts = tasksForCol(colId);
  return ts.length ? ts[ts.length - 1].ord : 0;
}

async function loadBoard() {
  state = await fetchJSON('/api/board');
  render();
}

function render() {
  const root = $('#board');
  root.innerHTML = '';

  state.cols
    .slice()
    .sort((a,b) => a.ord - b.ord)
    .forEach(col => {
      const div = document.createElement('div');
      div.className = 'col';
      div.dataset.colId = col.id;

      const header = document.createElement('h2');
      header.textContent = col.name;
      div.appendChild(header);

      const badge = document.createElement('div');
      badge.className = 'muted';
      const cnt = tasksForCol(col.id).length;
      badge.innerHTML = `<span class="pill">Zadań: ${cnt}</span>`;
      div.appendChild(badge);

      const list = document.createElement('div');
      tasksForCol(col.id).forEach(task => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div class="title"><b>#${task.id}</b> ${escapeHtml(task.title)} <span class="muted">(ord: ${task.ord})</span></div>
          <div class="actions"></div>
        `;
        const actions = card.querySelector('.actions');

        const nextCol = getNextColId(col.id);
        if (nextCol) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = '→';
          btn.title = 'Przenieś do kolumny po prawej (na koniec)';
          btn.addEventListener('click', async () => {
            try {
              const ord = maxOrdInCol(nextCol) + 1; // always to end
              await fetchJSON(`/api/tasks/${task.id}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ col_id: nextCol, ord })
              });
              await loadBoard();
            } catch (e) {
              alert('Nie udało się przenieść: ' + e.message);
            }
          });
          actions.appendChild(btn);
        } else {
          const done = document.createElement('span');
          done.className = 'muted';
          done.textContent = '—';
          actions.appendChild(done);
        }

        list.appendChild(card);
      });
      div.appendChild(list);

      const form = document.createElement('form');
      form.innerHTML = `
        <input name="title" maxlength="200" placeholder="Nowe zadanie..." required />
        <button type="submit">Dodaj</button>
      `;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = form.elements.title.value.trim();
        if (!title) return;
        try {
          await fetchJSON('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, col_id: col.id })
          });
          form.reset();
          await loadBoard();
        } catch (err) {
          alert('Nie udało się dodać: ' + err.message);
        }
      });
      div.appendChild(form);

      root.appendChild(div);
    });
}

window.addEventListener('DOMContentLoaded', () => {
  loadBoard().catch(e => alert('Błąd: ' + e.message));
});
