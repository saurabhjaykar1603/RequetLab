# RequestLab

A feature-rich API client inspired by Postman, built with React and Fastify.

## Project Structure

- `client/`: React frontend built with Vite.
- `server/`: Fastify backend with PostgreSQL storage.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm
- PostgreSQL

### Installation

1. Clone the repository.
2. Install dependencies for both client and server:
   ```bash
   # From the root directory
   cd client && npm install
   cd ../server && npm install
   ```
3. Set up environment variables:
   - Copy `server/.env.sample` to `server/.env` and update the values.
   - Copy `client/.env.sample` to `client/.env` and update the values.

## Development

To run both the frontend and backend in development mode with hot-reloading:

```bash
cd server
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3001`.

## Production & Hosting

The project is configured for full-stack hosting, where the Fastify server serves the built React application.

### 1. Build the project
This command builds the React client and prepares the server:
```bash
cd server
npm run build
```

### 2. Run in Production
This command runs the server in production mode, serving the static files from `client/dist`:
```bash
cd server
npm run prod
```

The entire application will be accessible at `http://localhost:3001` (or your configured `PORT`).

## Running with Docker

You can run the entire stack (client, server, and database) using Docker Compose.

### Instructions

1. **Build and Start**:
   ```bash
   docker compose up --build
   ```

2. **Access the App**:
   The application will be available at `http://localhost:3001`.

*Note: The database state is persisted in a Docker volume named `postgres_data`.*

## License

ISC
