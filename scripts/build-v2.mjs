// Build the v2 GitHub Pages entrypoint without changing any backend settings.
// Source stays in src/ and index.source.html. The previous entrypoint is recoverable in Git.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
execFileSync('npm', ['run', 'build', '--', '--base=/ayadati-halan-0.2/'], { stdio: 'inherit' });
execFileSync('node', ['scripts/inline-fonts.mjs'], { stdio: 'inherit' });
let html = readFileSync('dist/index.html', 'utf8');
html = html.replace(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g, (_, url) => {
  const js = readFileSync(path.join('dist/assets', path.basename(url)), 'utf8').replace(/<\/script/gi, '<\\/script');
  return '<script type="module">' + js + '</script>';
});
html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_, url) => '<style>' + readFileSync(path.join('dist/assets', path.basename(url)), 'utf8') + '</style>');
html = html.replace('<title>Ayadati Halan - Clinic Management SaaS</title>', '<title>Ayadati Halan v2 - Clinic Management SaaS</title>');
writeFileSync('dist/index.html', html);
writeFileSync('index.html', html);
console.log('v2 entrypoint prepared. Upload index.html only after review. Keep the unchanged speech worker asset in assets/.');
