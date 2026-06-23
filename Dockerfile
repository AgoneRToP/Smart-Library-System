# --- Стейдж сборки (Build Stage) ---
FROM node:22-alpine AS build

WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@latest --activate

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

COPY package.json pnpm-lock.yaml* ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

COPY . .

RUN pnpm run build

# --- Стейдж продакшна (Production Stage) ---
FROM node:22-alpine AS production

WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@latest --activate

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

COPY package.json pnpm-lock.yaml* ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --no-frozen-lockfile

# Копируем скомпилированный бэкенд код
COPY --from=build /usr/src/app/dist ./dist

# Копируем шаблоны фронтенда Handlebars (папка views обязательно должна заканчиваться слэшем)
COPY --from=build /usr/src/app/views ./views/

# Создаем папку для загрузки обложек книг
RUN mkdir -p uploads/books

EXPOSE 3000

CMD ["node", "dist/main.js"]

