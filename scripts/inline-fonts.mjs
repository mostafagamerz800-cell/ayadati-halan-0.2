// Keep the static Pages build self-contained. Local development still uses public/fonts.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const directory = 'dist/assets';
for (const file of readdirSync(directory).filter(file => file.endsWith('.css'))) {
  const filePath = path.join(directory, file);
  const css = readFileSync(filePath, 'utf8').replace(/url\(['"]?(?:[^)'"]*\/)?(fonts\/[^)'"]+\.ttf)['"]?\)/g, (_match, name) => {
    const font = readFileSync(path.join('public', name));
    return `url(data:font/ttf;base64,${font.toString('base64')})`;
  });
  writeFileSync(filePath, css);
}
