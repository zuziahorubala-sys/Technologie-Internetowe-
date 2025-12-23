// public/app.js

// Skrót do wybierania elementów
const $ = (sel) => document.querySelector(sel);

// Pomocnicza funkcja do żądań JSON z obsługą błędów
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", ...(options.headers || {}) },
    ...options,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // jeśli to nie był JSON – trudno
  }

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      text ||
      `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  return data;
}

/* ==================== KSIĄŻKI (strona /) ==================== */

async function loadBooks() {
  const list = $("#books");
  if (!list) return; // nie jesteśmy na tej stronie

  const url = "/api/books?page=1&pageSize=50";
  const data = await fetchJSON(url);

  list.innerHTML = "";
  data.items.forEach((b) => {
    const li = document.createElement("li");
    li.innerHTML =
      `<strong>#${b.id}</strong> — ${b.title} — ${b.author} ` +
      `[dost.: ${b.available}/${b.copies}] ` +
      (b.available > 0
        ? `<button class="borrow-select" data-book="${b.id}">Wybierz tę książkę</button>`
        : `<span style="color:#777">(brak wolnych egz.)</span>`);
    list.appendChild(li);
  });

  // kliknięcie przycisku „Wybierz tę książkę” podstawia ID do formularza
  list.addEventListener(
    "click",
    (ev) => {
      const btn = ev.target.closest(".borrow-select");
      if (!btn) return;
      const bookId = parseInt(btn.dataset.book, 10);
      const input = $("#book_id");
      if (input) input.value = bookId;
    },
    { once: true } // jedno podpięcie na przeładowanie
  );
}

// obsługa formularza wypożyczania
async function borrow(e) {
  e.preventDefault();
  const memberInput = $("#member_id");
  const bookInput = $("#book_id");
  const daysInput = $("#days");

  const member_id = parseInt(memberInput.value, 10);
  const book_id = parseInt(bookInput.value, 10);
  const days = parseInt(daysInput.value, 10);

  if (Number.isNaN(member_id) || Number.isNaN(book_id) || Number.isNaN(days)) {
    alert("Uzupełnij: ID członka, ID książki oraz liczbę dni.");
    return;
  }

  try {
    const r = await fetchJSON("/api/loans/borrow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id, book_id, days }),
    });
    alert("Książka została wypożyczona. ID wypożyczenia: " + r.id);
    await loadBooks(); // odśwież dostępność
  } catch (err) {
    alert("Nie udało się wypożyczyć: " + err.message);
  }
}

/* ==================== CZŁONKOWIE (strona /members.html) ==================== */

async function loadMembers() {
  const list = $("#members");
  if (!list) return;

  const members = await fetchJSON("/api/members");
  list.innerHTML = "";
  members.forEach((m) => {
    const li = document.createElement("li");
    li.textContent = `${m.id}. ${m.name} <${m.email}>`;
    list.appendChild(li);
  });
}

async function addMember(e) {
  e.preventDefault();
  const name = $("#name").value.trim();
  const email = $("#email").value.trim();

  if (!name || !email) {
    alert("Podaj imię/nazwisko i email.");
    return;
  }

  try {
    await fetchJSON("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    $("#name").value = "";
    $("#email").value = "";
    await loadMembers();
  } catch (err) {
    alert("Nie udało się dodać członka: " + err.message);
  }
}

/* ==================== WYPOŻYCZENIA (strona /loans.html) ==================== */

async function loadLoans() {
  const tbody = $("#loans-body");
  if (!tbody) return;

  const loans = await fetchJSON("/api/loans");
  tbody.innerHTML = "";

  loans.forEach((l) => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<td>${l.id}</td>` +
      `<td>${l.member_name}</td>` +
      `<td>${l.book_title}</td>` +
      `<td>${l.loan_date}</td>` +
      `<td>${l.due_date}</td>` +
      `<td>${l.return_date ?? ""}</td>` +
      `<td>${
        l.return_date
          ? ""
          : `<button class="return-btn" data-id="${l.id}">Zwróć</button>`
      }</td>`;
    tbody.appendChild(tr);
  });

  tbody.addEventListener(
    "click",
    async (ev) => {
      const btn = ev.target.closest(".return-btn");
      if (!btn) return;
      const loanId = parseInt(btn.dataset.id, 10);
      try {
        await fetchJSON("/api/loans/return", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loan_id: loanId }),
        });
        await loadLoans();
        await loadBooks(); // odśwież dostępność na stronie książek
      } catch (err) {
        alert("Nie udało się zwrócić książki: " + err.message);
      }
    },
    { once: true }
  );
}

// (opcjonalnie) lista zaległych – jeśli kiedyś dodasz sekcję na /loans.html
async function loadOverdue() {
  const btn = document.querySelector("#load-overdue");
  const list = document.querySelector("#overdue");
  if (!btn || !list) return;

  btn.addEventListener(
    "click",
    async () => {
      const items = await fetchJSON("/api/loans/overdue");
      list.innerHTML = "";
      items.forEach((x) => {
        const li = document.createElement("li");
        li.textContent = `#${x.id} — ${x.member_name} ma zaległą książkę „${x.book_title}” (termin: ${x.due_date})`;
        list.appendChild(li);
      });
    },
    { once: true }
  );
}

/* ==================== INIT ==================== */

window.addEventListener("DOMContentLoaded", () => {
  // strona z książkami
  if ($("#books")) {
    loadBooks();
    const borrowForm = $("#borrow-form");
    if (borrowForm) borrowForm.addEventListener("submit", borrow);
  }

  // strona z członkami
  if ($("#members")) {
    loadMembers();
    const memberForm = $("#member-form");
    if (memberForm) memberForm.addEventListener("submit", addMember);
  }

  // strona z wypożyczeniami
  if ($("#loans-body")) {
    loadLoans();
    loadOverdue();
  }
});