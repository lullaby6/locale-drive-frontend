# Locale Drive — Web app

The web app of [Locale Drive](https://github.com/lullaby6/locale-drive), a "Google Drive" for your local network. Built with React, Vite, Tailwind CSS and daisyUI.

This repository only contains the interface. The server, the CLI and the npm package live in [locale-drive](https://github.com/lullaby6/locale-drive), which includes this repository as a git submodule in `locale-drive-frontend/` and serves its build.

## Development

The easiest way is to work from the server repository, which starts both parts at once:

```bash
git clone --recursive https://github.com/lullaby6/locale-drive.git
cd locale-drive
npm run setup
npm run dev
```

Then open http://localhost:3001.

To work on this repository alone, start a Locale Drive server on port `24680` first (for example `npx locale-drive ./storage --port 24680`), then:

```bash
npm install
npm run dev
```

The Vite dev server runs on port `3001` and forwards `/api` and `/storage` to the server set in `VITE_API_URL` (see `.env`).

## Build

```bash
npm run build
```

The build goes to `dist/`. The server repository builds it into its own `src/public` folder with `npm run build` there, so you normally don't need to copy anything by hand.

The app calls the server with relative URLs (`/api`, `/storage`), so the build works on whatever address and port the server runs.

## Icons

Icons come from [Tabler](https://tabler.io/icons) through Iconify. `iconsPlugin.ts` bundles only the icons used in the code, so the app also works on networks without internet. To add an icon, just use its name (for example `icon="tabler:star"`); it's picked up automatically.

## Adding a language

1. Copy `src/languages/en.ts` to a new file, for example `fr.ts`, and translate the texts. TypeScript reports any text you miss.
2. Register it in `LANGUAGES` in `src/i18n.ts`.
3. If it should be picked automatically from the device language, update `detectLanguage()` in `src/i18n.ts` (today it chooses Spanish for any `es-*` device and English for everything else).

## License

[MIT](https://github.com/lullaby6/locale-drive/blob/main/LICENSE)
