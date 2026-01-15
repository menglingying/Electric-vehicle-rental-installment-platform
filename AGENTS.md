# AGENTS.md

## Build/Run/Test
- `npm install` → install all workspaces
- `npm run dev:api` → Spring Boot (8080), `npm run dev:h5` → H5 (5173), `npm run dev:admin` → Admin (5174)
- `npm run build:h5` / `npm run build:admin` → production builds
- Backend single test: `cd services/api && mvn test -Dtest=ClassName#methodName`
- Type check: `vue-tsc -b` (run in apps/h5 or apps/admin)

## Code Style
- **TypeScript**: strict mode, ES2022, path alias `@/*` → `src/*`, no ESLint configured
- **Vue**: `<script setup lang="ts">` + Composition API, Vant (H5), Arco Design (Admin)
- **Java**: Spring Boot 3.3, Java 17, record DTOs, constructor injection, JPA entities
- **Naming**: camelCase (TS/Java vars), PascalCase (components/classes), kebab-case (files)
- **Imports**: external → internal, always use `@/` alias in Vue apps

## Error Handling
- Frontend: axios interceptors in `services/http.ts`, catch `e?.response?.data?.message`
- Backend: throw `ApiException(HttpStatus, message)`, handled by `GlobalExceptionHandler`

## Structure
- `apps/h5` - H5 mobile (Vue3+Vant), `apps/admin` - PC admin (Vue3+Arco)
- `services/api` - Spring Boot API (JPA+MySQL), `services/api-node` - Node mock server
