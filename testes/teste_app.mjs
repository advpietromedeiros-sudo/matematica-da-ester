// Teste do aplicativo "Matemática da Ester" no Chrome headless.
// Uso: node testes/teste_app.mjs [pasta-de-prints]            → sai 0 só se tudo passar
//      node testes/teste_app.mjs --autoteste [pasta]          → planta um erro de conta numa dica e sai 0 só se o teste ACUSAR
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2), AUTO = args.includes('--autoteste');
const OUT = resolve(args.find(a => !a.startsWith('--')) || '.scratch/prints'); mkdirSync(OUT, { recursive: true });
let APP = resolve('Matematica_da_Ester.html');
if (AUTO) {
  const s = readFileSync(APP, 'utf8'), sab = s.replace('5 × ${b} = ${5*b}; mais', '5 × ${b} = ${5*b+1}; mais');
  if (sab === s) { console.log('AUTOTESTE: não consegui plantar o defeito'); process.exit(1); }
  APP = join(OUT, 'app-sabotado.html'); writeFileSync(APP, sab);
}
const porta = 9381;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${porta}`, '--window-size=1280,900',
  `--user-data-dir=${join(tmpdir(), 'ester-' + Date.now())}`, 'about:blank'], { stdio: 'ignore' });
const espera = ms => new Promise(r => setTimeout(r, ms));
let alvo; for (let i = 0; i < 40 && !alvo; i++) { await espera(250); try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json`)).json()).find(t => t.type === 'page'); } catch { } }
if (!alvo) { console.log('FALHA: Chrome headless não respondeu'); chrome.kill(); process.exit(1); }
const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const erros = [];
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); });
const cdp = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const avalia = async expr => { const r = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) return { erro: r.result.exceptionDetails.exception?.description }; return r.result.result.value; };
const print = async nome => { const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); writeFileSync(join(OUT, nome), Buffer.from(r.result.data, 'base64')); };
await cdp('Runtime.enable'); await cdp('Page.enable');
await cdp('Page.navigate', { url: pathToFileURL(APP).href }); await espera(1200);
const res = []; const confere = (n, ok, d = '') => { res.push(!!ok); console.log(`${ok ? 'OK   ' : 'FALHA'} ${n}${d ? ' · ' + d : ''}`); };

// T1 · as 100 dicas fazem conta certa: cada número calculado na frase é conferido
const dicas = await avalia(`(function(){const ruins=[];for(let a=1;a<=10;a++)for(let b=1;b<=10;b++){const e=matematicaAPI.estrategia(a,b),t=e.texto,p=a*b;
  const nums=(t.match(/\\d+/g)||[]).map(Number);if(nums[nums.length-1]!==p)ruins.push(a+'×'+b+': termina em '+nums[nums.length-1]);
  for(const m of t.matchAll(/(\\d+) × (\\d+) = (\\d+)/g))if(+m[1]*+m[2]!==+m[3])ruins.push(a+'×'+b+': '+m[0]);
  for(const m of t.matchAll(/(\\d+) \\+ (\\d+) = (\\d+)/g))if(+m[1]+ +m[2]!==+m[3])ruins.push(a+'×'+b+': '+m[0]);
  if(e.a*e.b!==p)ruins.push(a+'×'+b+': giro errado')}return ruins})()`);
confere('T1 · as 100 dicas da tabuada fazem conta certa', Array.isArray(dicas) && dicas.length === 0, Array.isArray(dicas) ? (dicas.slice(0, 3).join(' | ') || '100 de 100') : JSON.stringify(dicas));
if (AUTO) { const acusou = res.some(x => !x); console.log(acusou ? 'AUTOTESTE OK: o erro plantado foi acusado' : 'AUTOTESTE FALHOU: o erro plantado passou'); ws.close(); chrome.kill(); process.exit(acusou ? 0 : 1); }

confere('T2 · 5 telas', (await avalia("document.querySelectorAll('nav [data-tela]').length")) === 5);
// T3 · Ver a conta: 7 × 6 tem 42 bolinhas; partida, a figura continua com 42 (só muda a cor)
await avalia("document.querySelectorAll('#selA .num')[6].click();document.querySelectorAll('#selB .num')[5].click();document.getElementById('bMostrar').click()");
const t3 = await avalia("({bol:document.querySelectorAll('#grade .bol:not(.fant)').length,frase:document.getElementById('frase').textContent})");
await avalia("document.getElementById('bPartir').click()");
const t3b = await avalia("({bol:document.querySelectorAll('#grade .bol:not(.fant)').length,cor2:document.querySelectorAll('#grade .bol.p2').length,dica:document.getElementById('estrategia').textContent})");
confere('T3 · 7 × 6: 42 bolinhas, e partida no 5 continua 42', t3.bol === 42 && /= 42/.test(t3.frase) && t3b.bol === 42 && t3b.cor2 > 0, `${t3.bol} → ${t3b.bol} (${t3b.cor2} na 2ª cor) · ${t3b.dica}`);
await print('1-ver-a-conta-7x6-partida.png');
// T4 · 9 grupos: aparece o 10º grupo "fantasma" para tirar
await avalia("document.querySelectorAll('#selA .num')[8].click();document.querySelectorAll('#selB .num')[8].click();document.getElementById('bMostrar').click()");
const t4 = await avalia("({bol:document.querySelectorAll('#grade .bol:not(.fant)').length,fant:document.querySelectorAll('#grade .bol.fant').length})");
confere('T4 · 9 × 9: 81 bolinhas e o 10º grupo fantasma (9 a tirar)', t4.bol === 81 && t4.fant === 9, JSON.stringify(t4));
await print('2-ver-a-conta-9x9.png');
// T5 · Somar com o 10: 8 + 5
await avalia("matematicaAPI.tela('dez');document.querySelectorAll('#selX .num')[7].click();document.querySelectorAll('#selY .num')[4].click();document.getElementById('bPassos').click()");
const t5 = await avalia("({p:document.getElementById('passos').textContent,a:document.querySelectorAll('#quadros i.a').length,b:document.querySelectorAll('#quadros i.b').length})");
confere('T5 · 8 + 5: completa o 10 e sobram 3', /8 \+ 2 = 10/.test(t5.p) && /10 \+ 3 = 13/.test(t5.p) && t5.a === 8 && t5.b === 5, t5.p);
await print('3-somar-com-10.png');
// T6 · Desafio: acerto dá estrela; erro mostra figura e dica
await avalia("matematicaAPI.tela('desafio')"); await espera(200);
const responder = async v => { for (const c of String(v)) await avalia(`document.querySelector('#teclado [data-t="${c}"]').click()`); await avalia("document.querySelector('#teclado [data-t=\"OK\"]').click()"); };
let q = await avalia('matematicaAPI.atual()'); await responder(q.a * q.b);
const t6a = await avalia("({est:+document.getElementById('nEstrelas').textContent,ret:document.getElementById('retorno').textContent})");
await avalia("document.getElementById('bProxima').click()"); q = await avalia('matematicaAPI.atual()'); await responder(q.a * q.b + 1);
const t6b = await avalia("({dica:!document.getElementById('estrDesafio').hidden,fig:document.querySelectorAll('#gradeDesafio .bol').length,est:+document.getElementById('nEstrelas').textContent})");
confere('T6 · acerto dá estrela; erro mostra a figura e a dica, sem tirar estrela', t6a.est === 1 && /Isso/.test(t6a.ret) && t6b.dica && t6b.fig > 0 && t6b.est === 1, JSON.stringify({ ...t6a, ...t6b }));
await print('4-desafio-erro-com-dica.png');
// T7 · 3 acertos seguidos marcam "já sei" no mapa, nos dois lados do espelho
await avalia("(function(){const d=matematicaAPI.dados();d.fatos['3x7']={ok:3,erro:0,seq:3};localStorage.setItem('ester-matematica:v1',JSON.stringify(d))})()");
await avalia("matematicaAPI.tela('mapa')");
const t7 = await avalia("({cel:document.querySelectorAll('#gradeMapa button').length,sei:[...document.querySelectorAll('#gradeMapa button.sei')].map(b=>b.title)})");
confere('T7 · mapa com 100 contas; "já sei" aparece em 3 × 7 e 7 × 3', t7.cel === 100 && t7.sei.includes('3 × 7') && t7.sei.includes('7 × 3'), JSON.stringify(t7));
await print('5-mapa.png');
// T8 · o progresso volta ao reabrir
await cdp('Page.reload'); await espera(900);
confere('T8 · estrelas e progresso continuam depois de reabrir', (await avalia("+document.getElementById('nEstrelas').textContent")) >= 1);
confere('T9 · zero erro de JavaScript', erros.length === 0, erros.join(' | '));
ws.close(); chrome.kill();
const f = res.filter(x => !x).length; console.log(`\n${res.length - f} de ${res.length} conferências OK`); process.exit(f ? 1 : 0);
