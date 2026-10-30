# 🎌 AniMan · Anime & Manga Finder

[![Angular](https://img.shields.io/badge/Angular_21-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot_4-6DB33F?style=flat&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Jikan API](https://img.shields.io/badge/Jikan_API-2E51A2?style=flat&logo=myanimelist&logoColor=white)](https://jikan.moe/)

A full-stack app for discovering anime and manga and keeping a personal library of what you read and watch.
Catalogue data comes live from MyAnimeList through the [Jikan API](https://jikan.moe/).

**Live demo:** https://animan-f1ym.onrender.com/

---

## 🌟 Features

- **🔍 Browse & search**: full-text search with genre, format, status and minimum-score filters, sorting and pagination. Every filter lives in the URL, so results are shareable.
- **📚 Rich detail pages**: synopsis, stats, characters, related titles, trailers and community recommendations.
- **📖 Personal library**: save manga and anime with a status (reading, planning, completed, …), your own 1–10 score, chapter/episode progress and favourites.
- **🎯 Personalised recommendations**: the API ranks titles recommended alongside your favourites, weighted by how much you liked each one.
- **🔐 Accounts**: sign-up with email confirmation, sign-in, password reset and profile settings, powered by Supabase Auth.
- **📱 Responsive**: designed for phones up to wide desktops, keyboard-accessible.

## 🏗️ Architecture

```
 Angular 21 (Render)  ──── Supabase Auth ──── sign-up, email confirmation, sessions, JWTs
        │       └───────── Jikan API ───────── catalogue data (public, rate-limited, cached client-side)
        │ Bearer <Supabase access token>
        ▼
 Spring Boot 4 API (Render, Docker) ──── Supabase Postgres (library, Flyway migrations)
        └──────────────────────────────── Jikan API (recommendation seeds, cached)
```

- **Frontend** (`manga-proj/frontend`): standalone components, signals, zoneless change detection, lazy-loaded routes, a throttled and cached Jikan client, and optimistic UI updates.
- **Backend** (`manga-proj/manga`): a stateless OAuth2 resource server that verifies Supabase JWTs against the project's JWKS (issuer, audience and role checks). It owns the library domain and the recommendation engine. Includes Flyway migrations, Bean Validation, RFC 9457 problem-detail errors, Caffeine caching, OpenAPI docs at `/docs` and health probes.
- **Database**: Supabase Postgres. Row-level security is enabled on API-owned tables so they aren't exposed through Supabase's auto-generated REST API, and library rows cascade-delete with the auth user.

### API

| Method   | Path                                   | Description                                       |
| -------- | -------------------------------------- | ------------------------------------------------- |
| `GET`    | `/api/library?mediaType=&status=`      | The signed-in user's entries                      |
| `GET`    | `/api/library/{manga\|anime}/{malId}`  | One entry (404 if not saved)                      |
| `PUT`    | `/api/library/{manga\|anime}/{malId}`  | Create or update an entry                         |
| `DELETE` | `/api/library/{manga\|anime}/{malId}`  | Remove an entry                                   |
| `GET`    | `/api/library/stats`                   | Counts per status and average score               |
| `GET`    | `/api/recommendations?mediaType=`      | Personalised recommendations                      |
| `GET`    | `/api/me`                              | Profile from the token plus stats                 |

Interactive docs: `http://localhost:8084/docs`.

## 🏁 Running locally

**Prerequisites:** Node 22.12+, Java 17+, Maven, Docker (for local Postgres), and a free [Supabase](https://supabase.com) project for auth.

```bash
# 1. Database
cd manga-proj/manga
docker compose up -d

# 2. API: copy .env.example to .env and set SUPABASE_URL (the DATABASE_* defaults match docker compose)
./mvnw spring-boot:run          # http://localhost:8084

# 3. Frontend: copy .env.example to .env and set SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY
cd ../frontend
npm install
npm start                       # http://localhost:4200
```

Tests: `./mvnw test` (Postgres repository tests run via Testcontainers when Docker is available) and `npm test`.

## 🚀 Deployment

1. **Supabase**: create a project. Under *Authentication → URL Configuration*, set the Site URL to your frontend URL and add `http://localhost:4200/**` as a redirect URL. Paste the templates from `supabase/email-templates/` into *Authentication → Emails*. For real users, configure custom SMTP (the built-in sender is heavily rate-limited).
2. **Render** (API + frontend): *New → Blueprint* and pick this repo. `render.yaml` creates two services: `animan-api` (Spring Boot, Docker) and `animan` (the Angular static site, which gets the API URL automatically). Fill in the **Session pooler** connection details (`DATABASE_URL` as a `jdbc:postgresql://…` URL, `DATABASE_USERNAME`, `DATABASE_PASSWORD`), since Render needs the IPv4 pooler. Flyway creates the tables on first boot. If you use your own Supabase project, change `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` in `render.yaml`.

> The free Render tier sleeps after inactivity, so the first API call can take up to a minute. The UI shows a "waking up" banner meanwhile.

## 🙏 Credits

Data from [Jikan](https://jikan.moe), the unofficial MyAnimeList API. Not affiliated with MyAnimeList.
