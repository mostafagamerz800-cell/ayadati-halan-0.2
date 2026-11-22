import {readFileSync,readdirSync,writeFileSync,copyFileSync,mkdirSync,rmSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
// Keep public fonts out of render-blocking CSS; their licenses remain in public/fonts.
for(const file of readdirSync('dist/assets').filter(file=>file.endsWith('.css'))){
  const filePath=path.join('dist/assets',file);
  const css=readFileSync(filePath,'utf8').replace(/url\(['"]?(?:[^)'"\s]*\/)?(fonts\/[^)'"\s]+\.ttf)['"]?\)/g,(_match,name)=>{
    const font=readFileSync(path.join('public',name));
    const hash=createHash('sha256').update(font).digest('hex').slice(0,12);
    const filename=`${path.basename(name,'.ttf')}-${hash}.ttf`;
    writeFileSync(path.join('dist/assets',filename),font);
    return `url(./${filename})`;
  });
  writeFileSync(filePath,css);
}
const historyPath='scripts/pages-assets-history.json';
const history=JSON.parse(readFileSync(historyPath,'utf8'));
const fresh=readdirSync('dist/assets').sort();
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
// Repeated local builds of one revision must not evict published compatibility files.
const unchanged=JSON.stringify(fresh)===JSON.stringify(history.current);
const baseline=head===history.baseCommit||unchanged?history.baseline:[history.current,...history.baseline].filter(Boolean).slice(0,2);
const groups=[fresh,...baseline];
const keep=new Set(groups.flat());
// Fail closed if a promised compatibility file is missing, rather than publish broken HTML.
for(const name of keep){
  if(path.basename(name)!==name)throw Error('Unsafe asset filename');
  if(!existsSync(path.join('dist/assets',name))&&!existsSync(path.join('assets',name)))throw Error(`Missing retained asset: ${name}`);
}
mkdirSync('assets',{recursive:true});
for(const name of readdirSync('assets'))if(!keep.has(name))rmSync(path.join('assets',name),{recursive:true});
for(const name of fresh)copyFileSync(path.join('dist/assets',name),path.join('assets',name));
const html=readFileSync('dist/index.html','utf8')
 .replace(/<link rel="stylesheet"([^>]*?)>/g,'<link rel="stylesheet"$1 data-app-style media="print" onload="window.__clinicBoot.styleReady(this)" onerror="window.__clinicBoot.fail()">')
 .replace(/<script type="module"([^>]*?)><\/script>/g,'<script type="module"$1 onerror="window.__clinicBoot.fail()"></script>');
writeFileSync('dist/index.html',html);writeFileSync('index.html',html);
writeFileSync(historyPath,JSON.stringify({baseCommit:unchanged?history.baseCommit:head,baseline,current:fresh},null,2)+'\n');
console.log(`Prepared Pages: ${fresh.length} current assets, ${keep.size-fresh.length} retained secure-pilot compatibility assets.`);
