# Heimdall

A lightweight JWT authentication service.

## Getting Started

### Prerequisites

- Rust 1.88+ (or Docker)
- PostgreSQL 16

### Running Locally

1. Start PostgreSQL:

```bash
docker compose up -d postgres
```

2. Copy the example env file and adjust as needed:

```bash
cp .env.example .env
```

3. Run the server:

```bash
cargo run
```

Heimdall will be available at `http://localhost:8000`.

### Running with Docker

```bash
docker compose up
```

## API Documentation

All endpoints are nested under `/auth`. See [`src/handlers.rs`](src/handlers.rs) for the full route definitions and request/response types.
