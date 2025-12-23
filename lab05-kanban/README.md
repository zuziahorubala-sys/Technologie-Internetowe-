# Lab05 — Kanban (Node.js + Express + SQLite)

## Uruchomienie
```bash
npm install
npm run dev
# http://localhost:3000
```

Reset bazy:
```bash
npm run reset:db && npm run dev
```

## Model danych
- `columns(id, name, ord)` — predefiniowane: Todo(1), Doing(2), Done(3)
- `tasks(id, title, col_id -> columns.id, ord)`

## API
- `GET /api/board` → `{ cols: [...], tasks: [...] }` (posortowane po `ord`)
- `POST /api/tasks` `{title,col_id}` → 201 (ustawia `ord = MAX+1` w kolumnie)
- `POST /api/tasks/{id}/move` `{col_id,ord}` → 200 (przeniesienie z przeliczeniem kolejności)

### Zasady kolejności (ord)
- Dodawanie: zawsze na koniec kolumny (`MAX+1`).
- Przenoszenie: transakcyjnie:
  - w starej kolumnie „zamyka” dziurę (ord > stareOrd → ord-1),
  - w nowej robi miejsce od `ord` w górę (ord >= noweOrd → ord+1),
  - ustawia zadaniu nowy `col_id`, `ord`.
- Działa także dla zmiany `ord` w obrębie tej samej kolumny.

## UI
- `/` — trzy kolumny obok siebie, karty w kolejności `ord`
- Formularz dodania w każdej kolumnie
- Przycisk „→” przy karcie: przenosi do kolumny po prawej (na koniec)

## Testy
Plik `tests.rest` zawiera przykładowe wywołania.
