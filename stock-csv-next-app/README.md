# CSVNest Stock Lite — Pro (Next.js App Router)

A zero-config Next.js app to generate platform-ready metadata CSVs for Adobe Stock, Freepik, Shutterstock, Vecteezy, and a General preset.

## Features
- Title Length (10–120) and Keywords Count (5–50) sliders
- Auto remove duplicate keywords
- Bulk keyword merge (comma/newline)
- Prefix/Suffix toggles with inputs
- Image Type dropdown (None, Vector, Illustration, 3D Illustration, 3D Icon)
- CSV For: Adobe/Freepik/Shutterstock/General/Vecteezy
- 3 drag-and-drop zones: SVG, IMAGE (JPG/PNG), VIDEO
- Live preview of generated title & keywords
- Progress counters + Generate & Export (ZIP with AI_CSV, EPS_CSV, SVG_CSV)

## Quick Start
```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploy on Vercel
1. Push this folder to GitHub (or upload via GitHub UI).
2. On vercel.com → New Project → Import from GitHub.
3. Framework is auto-detected. Click Deploy.

## Notes
- This project uses simple Tailwind-based UI primitives (no external UI kit) under `src/components/ui`.
- No server needed. Everything runs client-side.
