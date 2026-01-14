# AGENTS.md

## Build & Run
- `npm install` (root) → install all workspaces
- `npm run dev:api` → Spring Boot backend (port 8080)
- `npm run dev:h5` → H5 frontend (port 5173)
- `npm run dev:admin` → Admin frontend (port 5174)
- `npm run build:h5` / `npm run build:admin` → production builds
- Backend: `cd services/api && mvn test -Dtest=ClassName#methodName` for single test

## Code Style
- **TypeScript**: strict mode, ES2022 target, path alias `@/*` → `src/*`
- **Vue**: Composition API with `<script setup lang="ts">`, Vant (H5), Arco Design (Admin)
- **Java**: Spring Boot 3, Java 17, record classes for request DTOs, constructor injection
- **Naming**: camelCase (TS/Java), PascalCase (Vue components, Java classes)
- **Imports**: group by external → internal, use path aliases in Vue apps

## Error Handling
- Frontend: axios interceptors in `services/http.ts`, catch with `e?.response?.data?.message`
- Backend: `ApiException` with HttpStatus, `GlobalExceptionHandler` for centralized handling

## Project Structure
- `apps/h5` - H5 client (Vue3 + Vant)
- `apps/admin` - PC admin (Vue3 + Arco)
- `services/api` - Spring Boot API (JPA + MySQL)
