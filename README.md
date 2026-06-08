# Coffee Shop Management System

Enterprise microservices platform for coffee shop operations.

## Stack

- **API Gateway** (port 3000) — routing, JWT, Swagger docs
- **15 microservices** — auth, users, products, categories, inventory, orders, payments, employees, suppliers, promotions, notifications, analytics, logging
- **MySQL 8**, **Redis 7**, **RabbitMQ 3.12**
- **React + Vite** frontend (port 80)

## Quick Start

```bash
cp .env.example .env
# Edit passwords in .env

docker compose up --build -d
```

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| API Gateway | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api/docs |
| RabbitMQ UI | http://localhost:15672 |

## Default Login

- **Email:** `admin@coffeeshop.com`
- **Password:** `Admin@123456`

## Local Frontend Dev

```bash
cd frontend
npm install
npm run dev
```

## Architecture

```
Client → API Gateway → Microservices → MySQL
                      ↘ Redis (cache)
                      ↘ RabbitMQ (events)
```
