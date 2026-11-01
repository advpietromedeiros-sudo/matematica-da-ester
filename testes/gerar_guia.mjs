// Gera Guia_para_os_pais.pdf a partir de Guia_para_os_pais.html (Chrome headless, A4) e confere:
// páginas, as 9 seções e as 2 folhas para imprimir, e nenhum erro de JavaScript.
// Uso: node testes/gerar_guia.mjs   → sai 0 só se tudo passar
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const FONTE = resolve('Guia_para_os_pais.html'), SAIDA = resolve('Guia_para_os_pais.pdf');
const porta = 9383;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${join(tmpdir(), 'guia-' + Date.now())}`, 'about:blank'], { stdio: 'ignore' });
const espera = ms => new Promise(r => setTimeout(r, ms));
let alvo; for (let i = 0; i < 40 && !alvo; i++) { await espera(250); try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json`)).json()).find(t => t.type === 'page'); } catch { } }
const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const erros = [];
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.text); });
const cdp = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const avalia = async e => (await cdp('Runtime.evaluate', { expression: e, returnByValue: true })).result.result.value;
await cdp('Runtime.enable'); await cdp('Page.enable');
await cdp('Page.navigate', { url: pathToFileURL(FONTE).href }); await espera(1200);
const secoes = await avalia("document.querySelectorAll('h2').length"), bolinhas = await avalia("document.querySelectorAll('#g10 i').length");
const pdf = await cdp('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, headerTemplate: '<div></div>',
  footerTemplate: '<div style="width:100%;font:8px Arial;color:#6b6380;padding:0 15mm;display:flex;justify-content:space-between"><span>Matemática visual da Ester · Guia para os pais</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>' });
const buf = Buffer.from(pdf.result.data, 'base64'); writeFileSync(SAIDA, buf);
const paginas = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
const ok = secoes === 12 && bolinhas === 100 && paginas >= 5 && erros.length === 0;
console.log(`${ok ? 'OK' : 'FALHA'} · ${SAIDA} · ${buf.length} bytes · ${paginas} páginas · ${secoes} seções (10 + 2 folhas) · grade com ${bolinhas} bolinhas · erros JS: ${erros.length}`);
ws.close(); chrome.kill(); process.exit(ok ? 0 : 1);
