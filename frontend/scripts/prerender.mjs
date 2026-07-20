// Post-build step: renders <Home/> to static HTML with react-dom/server and
// inlines it into dist/index.html, so crawlers get real content without
// executing JS. The client bundle still hydrates on top of it normally.
import { build } from 'vite';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ssrOutDir = 'dist-ssr';

await build({
  root: rootDir,
  logLevel: 'silent',
  build: {
    ssr: 'src/entry-server.jsx',
    outDir: ssrOutDir,
    emptyOutDir: true,
  },
});

const entryPath = path.join(rootDir, ssrOutDir, 'entry-server.js');
const { render } = await import(pathToFileURL(entryPath).href);
const appHtml = render();

const indexPath = path.join(rootDir, 'dist', 'index.html');
const template = readFileSync(indexPath, 'utf-8');

if (!template.includes('<div id="root"></div>')) {
  throw new Error('prerender: could not find <div id="root"></div> in dist/index.html');
}

writeFileSync(indexPath, template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`));
rmSync(path.join(rootDir, ssrOutDir), { recursive: true, force: true });

console.log('prerender: injected static markup into dist/index.html');
