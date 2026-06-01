# VaagBanda Backend

Dependency-free Node.js REST API for the VaagBanda expense-splitting app.

## Run

```powershell
cd Implementation\Backend
npm.cmd start
```

The API starts on `http://localhost:4000`. Set `PORT=4001` to use another port.

Seed login:

```text
email: asim@example.com
password: password123
```

## Main Endpoints

All endpoints default to user `u1`. To act as another user, send `X-User-Id: u2` or `Authorization: Bearer user:u2`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Service status |
| POST | `/auth/signup` | Create user |
| POST | `/auth/login` | Login and receive a simple demo token |
| POST | `/auth/forgot-password` | Record reset request |
| GET | `/me` | Current user |
| GET | `/groups` | Current user's group summaries |
| POST | `/groups` | Create a group |
| GET | `/groups/:groupId` | Group detail, expenses, member balances |
| POST | `/groups/:groupId/expenses` | Add expense and split shares |
| GET | `/groups/:groupId/creditors` | People the current user owes |
| POST | `/groups/:groupId/settlements` | Record external payment |
| POST | `/dev/reset` | Reset local JSON data to seed state |

## Example Requests

```powershell
Invoke-RestMethod http://localhost:4000/groups
```

```powershell
Invoke-RestMethod -Method Post http://localhost:4000/groups/g1/expenses `
  -ContentType 'application/json' `
  -Body '{"description":"Snacks","amount":500,"paidBy":"u1","participants":["u1","u2"],"shares":{"u1":250,"u2":250},"category":"food"}'
```

Data is stored in `Implementation/Backend/data/db.json`, which is created automatically on first run.
