# Lab04 — Filmy i oceny (Node.js + Express + SQLite)

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
- `movies(id, title, year)`
- `ratings(id, movie_id -> movies.id, score CHECK 1..5)`

## API
- `GET /api/movies` — ranking z `avg_score` (2 miejsca) i `votes`, sort malejąco po `avg_score`
  - bonus: `?year=YYYY&limit=N`
- `POST /api/movies` `{title,year}` → 201
- `POST /api/ratings` `{movie_id,score}` → 201 (walidacja 1..5)
- bonus: `GET /api/movies/top?limit=5(&year=YYYY)`

## UI
- `/` — lista filmów + formularz oceny + formularz dodania filmu
- bonus: filtrowanie po roku i limit w UI

## Testy
`tests.rest` — przykładowe żądania.
