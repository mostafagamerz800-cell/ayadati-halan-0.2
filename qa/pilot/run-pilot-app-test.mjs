import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
const previous=readFileSync('index.html');
copyFileSync('index.source.html','index.html');
const vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'ignore',env:{...process.env,VITE_SECURE_PILOT:'true',VITE_PILOT_EMULATOR:'true'}});
try{
 let ready=false;
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:4173')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}
 if(!ready)throw Error('Local test server did not start');
 const test=spawn(process.execPath,['qa/pilot/test-pilot-app.mjs'],{stdio:'inherit'});
 const code=await new Promise(r=>test.on('exit',r));process.exitCode=code||0;
}finally{vite.kill('SIGTERM');writeFileSync('index.html',previous);}
