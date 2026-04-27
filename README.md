# ViewCraft

ViewCraft is a small 3D projection puzzle game. Build a voxel structure on a 3×3 grid so its top, left, and right views match the target projections.

## Features

- Static React + Vite app, deployable on GitHub Pages or Cloudflare Pages
- CSS 3D voxel board
- Eight built-in puzzle levels
- Top / left / right projection matching
- Undo, clear, step counter, completed-level tracking
- Responsive layout for desktop, tablet, and mobile screens
- Chinese / English language switcher, Chinese by default
- Touch drag and mouse drag camera rotation
- Local progress saved in `localStorage`

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

### Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`

### GitHub Pages

This repository includes a GitHub Actions workflow that builds the Vite app and publishes `dist` to GitHub Pages.

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License. Commercial use is not permitted without explicit permission.
