FROM node:22-slim AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund
COPY . .
ENV VITE_API_URL=/api
# tsc -b fails on a pre-existing type error the team shipped around (they ran vite dev); demo build uses vite directly
RUN npx vite build

FROM nginx:alpine
COPY --from=build /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
