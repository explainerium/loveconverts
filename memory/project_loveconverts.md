---
name: LoveConverts project state
description: Full platform build — image tools, downloader system, admin panel, support, auth
type: project
---

App rebranded from ConvertImg → LoveConverts. Full platform built March 2026.

**Why:** Full product build requested — image converter + social media downloader hub + admin + support.

**Key files and features:**

### Auth
- `auth.ts` — NextAuth v5 beta, JWT, Credentials + Google OAuth stubs
- `lib/password.ts` — bcrypt hash/verify helpers
- Pages: `/auth/signin`, `/auth/signup`, `/auth/forgot-password`
- API: `POST /api/auth/register`

### Database (`lib/db.ts`)
Tables: `users`, `conversions`, `daily_usage`, `inquiries`, `admin_notifications`, `download_stats`, `platform_blocklist`
- DB path: `data/convertimg.db`
- Migration for `is_admin` column on existing DBs
- To grant admin: `UPDATE users SET is_admin = 1 WHERE email = 'your@email.com'`

### Image Tools
- `POST /api/convert` — sharp, all formats (jpg/png/webp/avif/gif/bmp/tiff/ico)
- `POST /api/tools/compress|resize|crop|photo-editor|convert-to-jpg`
- Pages: `/tools`, `/tools/compress`, `/tools/resize`, `/tools/crop`, `/tools/photo-editor`, `/tools/convert-to-jpg`
- Limits: free=20/day/10MB, pro=unlimited/50MB

### Downloaders
- Hub: `/downloaders`
- Template: `app/components/downloaders/DownloaderTemplate.tsx`
- 10 platforms: tiktok, instagram, facebook, twitter, youtube, youtube-shorts, pinterest, soundcloud, vimeo, dailymotion
- API: `POST /api/downloaders/fetch` — uses `youtube-dl-exec` with `create(binaryPath)` pattern
- yt-dlp path: `/Users/explainerium/Library/Python/3.9/bin/yt-dlp` (or `YT_DLP_PATH` env var)
- Rate limit: 20/hour per IP, in-memory Map
- YouTube pages show disclaimer modal first (sessionStorage 24hr acceptance)
- No files stored on server — returns direct media URLs

### Admin Panel (`/admin`)
- Protected: `is_admin = 1` checked via DB in layout + all API routes
- Inquiries list/detail, users, stats
- `GET/PATCH /api/admin/downloaders/stats` — per-platform success/error rates, alert if >50% error rate
- `PATCH /api/admin/downloaders/[platform]` — toggle platform disabled in `platform_blocklist`
- `AdminDownloaderToggle.tsx` — client component for enable/disable toggle
- Notification bell at `/api/admin/notifications`

### Support
- `/support` form → `POST /api/support/inquiry` → saves to `inquiries` table
- Reference numbers: `INQ-XXXXX`

### Components
- `Logo.tsx` — SVG heart+arrow gradient, sizes sm/md/lg
- `Toast.tsx` + `ToastProvider` — custom toast system, types: success/error/warning/info
- `FloatingSupport.tsx` — hidden on /support and /faq
- Header: dropdowns for Image Tools and Downloaders, admin link for is_admin users
- Footer: dark navy #1A1A2E, gradient top border, EXPLAINERIUM credit

### Design
- Brand: #FF4747 → #FF8C42 gradient
- Background: #F8FAFC
- Cards: white, border #E2E8F0, radius 12px

**How to apply:** Use `create(ytDlpPath)` from youtube-dl-exec for downloader API. Dynamic route params must use `await ctx.params`. `RouteContext<>` is unreliable — use `{ params: Promise<{ id: string }> }` directly.

**Build status:** `npm run build` passes 0 errors, 58 routes, March 2026.
