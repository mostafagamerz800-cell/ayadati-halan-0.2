// Explicit static synthetic-data pilot build. No local emulator or legacy audio entry.
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
process.env.VITE_SECURE_PILOT='true';
process.env.VITE_PILOT_EMULATOR='false';
const previous=readFileSync('index.html');
try {
  copyFileSync('index.source.html','index.html');
  const {build}=await import('vite');
  await build({base:'/ayadati-halan-0.2/',build:{assetsInlineLimit:10000}});
  await import('./inline-fonts.mjs');
} finally {writeFileSync('index.html',previous);}
