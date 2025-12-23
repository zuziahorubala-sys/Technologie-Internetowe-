# Lab02 — Sklep: koszyk i zamówienia (Node.js + Express + SQLite)

## Wymagania
- Windows 10/11
- Node.js **20 LTS** (zalecane)
- VS Code (opcjonalnie)

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

Baza `shop.db` tworzy się automatycznie z seedem produktów.

## UI
- `/` — lista produktów z „Dodaj do koszyka”
- Panel koszyka: modyfikacja ilości, usuwanie, przycisk „Zamów”
- (Bonus) Historia zamówień na tej samej stronie

## API (kontrakt)
### Produkty
- `GET /api/products`
- `POST /api/products` body: `{ "name":"X", "price":12.34 }` → **201** + `Location`

### Koszyk
- `GET /api/cart`
- `POST /api/cart/add` body: `{ "product_id":1, "qty":2 }`
- `PATCH /api/cart/item` body: `{ "product_id":1, "qty":3 }`
- `DELETE /api/cart/item/:product_id`

### Zamówienie
- `POST /api/checkout` → **201** `{ "order_id":123, "total":999.99 }`
  - Po checkout koszyk jest pusty.
  - Snapshot ceny: `OrderItems.price` zapisuje cenę z momentu zamówienia.

(Bonus) `GET /api/orders` — historia zamówień.

## Walidacje i statusy
- `qty >= 1` → **422**
- `price >= 0` → **422**
- Checkout z pustym koszykiem → **409**
- Nieistniejący produkt → **404**
- Brak `Content-Type: application/json` dla endpointów z body → **415**

## Testy
Plik `tests.rest` zawiera gotowe wywołania do REST Client w VS Code.

## MSSQLEdition (opcjonalnie)
Dla SQL Server: schemat przykładowy w pliku `Lab02_Shop_MSSQLEdition.sql` (jeśli został dostarczony przez prowadzącego).
