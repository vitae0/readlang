# Readlang

A minimal, local-first reading app for language learning. Static HTML, CSS and JavaScript, designed for GitHub Pages.

## Features

- **German → English** by default, **Kurmanji → Turkish** and **28 more source/target languages** in the two selectors at the top-right.
- Import **text-based PDF** books, convert their pages to reflowable text, and tap/hover words for short translations.
- Word underlines become fainter after repeated lookups. Repeat lookups and starred words appear in the vocabulary drawer.
- Imported books are stored in **IndexedDB**, and the last page/scroll position is remembered in **localStorage**.
- The selected language pair is remembered separately for each book.
- A starter German-English dictionary and Kurmanji-Turkish dictionary provide immediate meanings for included demo stories.
- Export/import your vocabulary as JSON. No login, analytics, or server database.

## GitHub Pages

1. In this repository, open **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions** as **Source**.
3. Run **Actions → Readlang · GitHub Pages → Run workflow** if the first deployment did not start automatically.
4. Open **https://vitae0.github.io/readlang/** after deployment succeeds.

Every push to main runs the tests and updates the site.

## Run locally

No installation necessary. From the repository folder:

    python3 -m http.server 8000

Then open http://localhost:8000.

For tests, run:

    node --check app.js
    node --test tests/core.test.mjs

## Privacy and limitations

The PDF is parsed **in your browser**, not uploaded to our server. Parsed page text is stored in that browser's IndexedDB. Clearing browser site data can erase books and progress. Back up your word history with Export.

PDF.js is imported from a version-pinned CDN when needed; the first import requires a network connection. Image-only or scanned PDF pages need OCR first. Reconstructed text is reflowed, not pixel-identical to the original PDF.

When a word is not in the built-in dictionary or the browser's cache, **only that single word** and the selected language pair are sent to the public MyMemory translation API. Its support and quality vary by language, especially Kurmanji/Sorani. Some pairs may return no translation. You can enter a short correction locally. This is not a full offline dictionary.

GitHub Pages serves only the static app; no book contents are committed to GitHub. This is not affiliated with the commercial Readlang service.
