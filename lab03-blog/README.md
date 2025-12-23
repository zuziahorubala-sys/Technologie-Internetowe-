# Lab03 — Blog: komentarze z moderacją (Node.js + Express + SQLite)

## Wymagania
- Windows 10/11
- Node.js **20 LTS** (zalecane)
- VS Code (opcjonalnie, polecam REST Client)

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

Baza `blog.db` tworzy się automatycznie z seedem:
- 2 posty
- kilka komentarzy (część zatwierdzona, część oczekuje)

## UI (minimum)
- `/` — lista postów + formularz dodania
- `/post.html?id=ID` — szczegóły posta + tylko zatwierdzone komentarze + formularz dodania (trafia do moderacji)
- `/moderation.html` — panel moderatora: lista oczekujących + „Zatwierdź”

## API (kontrakt)
- `GET /api/posts`
- `POST /api/posts` body: `{ "title":"...", "body":"..." }` → **201** + Location
- `GET /api/posts/{id}/comments` → tylko `approved=1`
- `POST /api/posts/{id}/comments` body: `{ "author":"...", "body":"..." }` → **201** `{ approved:0 }`
- `POST /api/comments/{id}/approve` → **200** (ustawia `approved=1`)

Dodatkowo dla UI moderacji:
- `GET /api/comments/pending` — lista komentarzy oczekujących (approved=0)

## Akceptacja
- Nowy komentarz nie jest publiczny dopóki nie zostanie zatwierdzony.
- Po zatwierdzeniu jest widoczny natychmiast w widoku posta (po odświeżeniu lub ponownym wejściu).

## Testy
`tests.rest` — przykładowe wywołania do REST Client.

## MSSQLEdition (opcjonalnie)
Jeśli robisz wersję na SQL Server, możesz oprzeć się o plik schematu od prowadzącego.
