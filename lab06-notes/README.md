# Lab06 — Notatki, tagi i wyszukiwanie (Node.js + Express + SQLite)

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
- `notes(id, title, body, created_at)`
- `tags(id, name UNIQUE)`
- `note_tags(note_id, tag_id, PK(note_id,tag_id))`

## API
- `GET /api/notes?q=...&tag=...`
  - filtruje po `q` (LIKE) w `title` lub `body`
  - opcjonalnie filtruje po tagu `tag`
  - zwraca również listę tagów dla każdej notatki (`tags: ["work","home"]`)
- `POST /api/notes` `{title,body}` → 201 + Location
- `GET /api/tags` → lista tagów
- `POST /api/notes/{id}/tags` `{tags:[...]}`
  - tworzy brakujące tagi (`INSERT OR IGNORE`)
  - tworzy relacje (`INSERT OR IGNORE`), unikalność wymuszona przez PK w `note_tags`

## UI (minimum)
- pole „Szukaj…”, lista wyników (tytuł + fragment treści z podświetleniem)
- formularz dodania notatki i tagów (comma‑sep)
- formularz dopisywania tagów do istniejącej notatki

## Akceptacja
- LIKE znajduje frazy w tytule i treści
- ten sam tag nie doda się drugi raz do tej samej notatki (PK + INSERT OR IGNORE)

## Testy
Plik `tests.rest` zawiera przykładowe wywołania.
