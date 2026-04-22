# NutriNest — Recipe & Meal Planning REST API

> CSC337 Advanced Web Technologies SP26 | Midterm Lab CLO4
> Group: Aisha Noor (FA23-BSE-041) & Omar Tariq (FA23-BSE-056)
> GitHub: https://github.com/mumernisar/nutrinest

## Quick Start

```bash
git clone https://github.com/mumernisar/nutrinest.git
cd nutrinest
npm install
cp .env.example .env       # fill in MONGO_URI and JWT secrets
npm run seed               # creates demo users + sample data
npm run dev                # starts on http://localhost:5000
```

## Demo Credentials (after seed)

| Role         | Email                   | Password  |
|--------------|-------------------------|-----------|
| Admin        | admin@nutrinest.app     | Admin1234 |
| Nutritionist | sara@nutrinest.app      | Admin1234 |
| User         | aisha@nutrinest.app     | Admin1234 |

## Tech Stack

- Node.js 18+ / Express.js 4.x
- MongoDB + Mongoose 8.x
- JWT (access 15min + refresh 7d with server-side hash storage)
- bcryptjs, helmet, cors, express-mongo-sanitize, express-rate-limit
- express-validator, nodemailer, morgan

## Actors

| Role | Key Permissions |
|------|----------------|
| User | Browse recipes, bookmark, write reviews, manage meal plans & shopping lists |
| Nutritionist | All user + create/publish nutrition plans, verify recipes & add nutrition info |
| Admin | All + publish/flag recipes, manage all users (roles, activate/deactivate) |

## API Base URL

```
http://localhost:5000/api/v1
```

All protected routes require: `Authorization: Bearer <access_token>`

## Endpoints Summary

### Auth  /api/v1/auth
POST /register | POST /verify-email | POST /login | POST /refresh
POST /logout | POST /forgot-password | POST /reset-password | PATCH /change-password

### Users  /api/v1/users
GET|PATCH|DELETE /me | GET|POST /me/bookmarks | DELETE /me/bookmarks/:id
Admin: GET / | GET|PATCH /:userId/role | PATCH /:userId/toggle-active

### Recipes  /api/v1/recipes
GET / (public, filterable) | GET /:id | GET /my | POST / | PATCH /:id | DELETE /:id
Admin: PATCH /:id/publish | PATCH /:id/flag | GET /admin/all
Nutritionist: PUT /:id/nutrition | GET /unverified
Reviews: GET|POST /:id/reviews | PATCH|DELETE /:id/reviews/:reviewId

### Meal Plans  /api/v1/meal-plans
GET|POST / | GET|PATCH|DELETE /:id
PUT /:id/slots | DELETE /:id/slots
POST|GET /:id/shopping-list | PATCH /:id/shopping-list/toggle

### Nutrition Plans  /api/v1/nutrition-plans
GET / (public) | GET /:id | GET /my
POST|PATCH|DELETE /:id | PATCH /:id/publish  (Nutritionist/Admin)

## Error Envelope

```json
{ "status": "fail", "error": { "code": "401", "message": "Incorrect email or password.", "details": null } }
```

## Setup Notes

- Email verification: use Mailtrap (free) for dev. Without email config the API still works;
  you can manually set isVerified:true in MongoDB Compass, or just use the seeder accounts.
- MongoDB: local instance or Atlas. Set MONGO_URI in .env.
- Rate limits: 20 req/15min on auth routes, 60 req/min general.
