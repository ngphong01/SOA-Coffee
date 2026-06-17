# Coffee Shop Management System

Enterprise microservices platform for coffee shop operations.

## Stack

- **API Gateway** (port 3000) — routing, JWT, Swagger docs, rate limiting, circuit breaker
- **8 microservices** — auth, users, products, categories, inventory, orders, payments, analytics
- **MySQL 8** — Database-per-service (8 separate databases)
- **Redis 7** — Distributed caching
- **RabbitMQ 3.12** — Event-driven communication (Topic Exchange)
- **React + Vite** frontend (port 80)

## Observability

- **Jaeger** — Distributed Tracing (port 16686)
- **ELK Stack** — Centralized Logging (Kibana port 5601)
- **Prometheus** — Metrics (port 9090)
- **Grafana** — Dashboards (port 3001)
- **Consul** — Service Discovery (port 8500)

## Quick Start

```bash
cp .env.example .env
# Edit passwords in .env

docker compose up --build -d
```

## URLs

| Service         | URL                            |
| --------------- | ------------------------------ |
| Frontend        | http://localhost               |
| API Gateway     | http://localhost:3000          |
| Swagger Docs    | http://localhost:3000/api/docs |
| RabbitMQ UI     | http://localhost:15672         |
| Kibana (Logs)   | http://localhost:5601          |
| Jaeger (Traces) | http://localhost:16686         |
| Prometheus      | http://localhost:9090          |
| Grafana         | http://localhost:3001          |
| Consul          | http://localhost:8500          |

## Default Login

- **Email:** `admin@coffeeshop.com`
- **Password:** `Admin@123456`

## Running Tests

```bash
cd shared && npm install
npx jest --config jest.config.js
npx jest --config jest.config.js --coverage
```

## Architecture

```
Client → Nginx (Frontend) → API Gateway ──→ Monitoring (Prometheus/Grafana/Jaeger/ELK)
                              │  ↓
                              │  Consul (Service Discovery)
                    ┌─────────┼───────────┐
                    ↓         ↓           ↓
              auth-svc   order-svc   product-svc  ...
              auth_db    order_db    product_db   ...
                    ↓         ↓           ↓
              RabbitMQ (Event Bus)  +  Redis (Cache)
```
