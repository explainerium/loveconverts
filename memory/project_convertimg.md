---
name: ConvertImg image converter app
description: Full-stack image converter built in this Next.js project — tech stack, supported formats, and key constraints
type: project
---

A complete image converter web app (ConvertImg) was built in this Next.js 16.2.1 + TypeScript project.

**Stack:**
- `sharp` 0.34.5 (server-side conversion via `/api/convert`)
- `jszip` (Download All as ZIP)
- `react-dropzone` (drag-and-drop UI)
- `lucide-react` (icons)
- Tailwind CSS v4

**Key files:**
- `app/api/convert/route.ts` — POST handler; accepts multipart/form-data with file, targetFormat, quality, width, height, stripMetadata, lockAspectRatio
- `app/components/ImageConverter.tsx` — client component with all UI state
- `app/page.tsx` — just renders `<ImageConverter />`

**Supported output formats:** JPG, PNG, WEBP, GIF, TIFF, AVIF, ICO (BMP removed — not supported by sharp 0.34.5)

**Why:** BMP was omitted because `sharp.toFormat('bmp')` throws at runtime in v0.34.5 — not in the supported format list.

**How to apply:** If user asks to add BMP support, it requires a different library or a newer sharp that includes libvips BMP codec.
