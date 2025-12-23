# Lab01 — Wypożyczalnia książek (Node.js + Express + SQLite)

## Wymagania
- Windows 10/11
- Node.js 20 LTS (zalecane; z NVM `nvm use 20.17.0`)
- VS Code (opcjonalnie z rozszerzeniem REST Client)

## Uruchomienie (kroki)
```bash
# 1) Zainstaluj zależności
npm install

# 2) Start serwera (port 3000)
npm run dev

# 3) (Opcjonalnie) Reset bazy + start
npm run reset:db && npm run dev
```

Po uruchomieniu: http://localhost:3000

Baza `library.db` tworzy się automatycznie (z seedem: 2 członków, 3 książki, 1 wypożyczenie).

## UI (ścieżki)
- `/` — lista książek + dostępność + formularz wypożyczenia
- `/members.html` — lista członków + dodawanie
- `/loans.html` — lista wypożyczeń + przycisk Zwróć

> W widoku książek obok tytułu pojawia się ID (np. `#1 — Wiedźmin`), które wpisujesz w polu `book_id`.

## API (kontrakt)
### Członkowie
- `GET /api/members` — lista
- `POST /api/members`  
  Body:
  ```json
  { "name": "Ala", "email": "ala@example.com" }
  ```
  201 Created (Location), 409 Conflict (duplikat e-mail), 422 (walidacja)

### Książki
- `GET /api/books?author=Kowalski&page=1&pageSize=20` — lista + dostępność
- `POST /api/books`  
  Body:
  ```json
  { "title": "X", "author": "Y", "copies": 2 }
  ```
  201 Created, 422 (walidacja)

### Wypożyczenia
- `GET /api/loans` — wszystkie
- `POST /api/loans/borrow`  
  Body:
  ```json
  { "member_id": 1, "book_id": 2, "days": 14 }
  ```
  201 Created, 404 (brak członka/książki), 409 (brak dostępnych egzemplarzy), 422
- `POST /api/loans/return`  
  Body:
  ```json
  { "loan_id": 1 }
  ```
  200 OK, 404 (brak wypożyczenia), 409 (już zwrócone)
- Bonus: `GET /api/loans/overdue` — zaległe

## Przykładowe żądania (curl)
```bash
# Health
curl -s http://localhost:3000/api/health

# Lista członków
curl -s http://localhost:3000/api/members | jq

# Dodaj członka
curl -s -X POST http://localhost:3000/api/members ^
  -H "Content-Type: application/json" ^
  -d "{ \"name\": \"Jan\", \"email\": \"jan@example.com\" }"

# Lista książek (1 strona po 20)
curl -s "http://localhost:3000/api/books?page=1&pageSize=20" | jq

# Dodaj książkę
curl -s -X POST http://localhost:3000/api/books ^
  -H "Content-Type: application/json" ^
  -d "{ \"title\": \"Nowa\", \"author\": \"Autor\", \"copies\": 2 }"

# Wypożycz (member_id=1, book_id=1)
curl -s -X POST http://localhost:3000/api/loans/borrow ^
  -H "Content-Type: application/json" ^
  -d "{ \"member_id\": 1, \"book_id\": 1, \"days\": 14 }"

# Zwróć
curl -s -X POST http://localhost:3000/api/loans/return ^
  -H "Content-Type: application/json" ^
  -d "{ \"loan_id\": 1 }"

# Zaległe
curl -s http://localhost:3000/api/loans/overdue | jq
```

## Bezpieczeństwo i jakość
- Nagłówki (Helmet): `X-Content-Type-Options: nosniff`, CSP (`default-src 'self'`), `Referrer-Policy: no-referrer`
- Kody statusów: 201, 409, 404, 422, 415, 500
- Walidacja JSON: `zod` po stronie backendu
- Logowanie żądań: `morgan`
- Struktura: `/src` (routes, middleware, seed, db), `/public` (UI), `scripts/resetDb.js`

## Troubleshooting
- `ERR_MODULE_NOT_FOUND: express` → uruchom `npm install` w katalogu z `package.json`.
- Błąd kompilacji `better-sqlite3` na Node 22/24 → użyj Node 20 LTS (NVM), lub zainstaluj Python + Build Tools i kompiluj lokalnie.
- `npm.ps1 cannot be loaded` → PowerShell jako admin:
  ```powershell
  Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
