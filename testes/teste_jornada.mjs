// Teste do jogo "Jornada da Ester" no Chrome headless.
// Uso: node testes/teste_jornada.mjs [pasta]            → sai 0 só se tudo passar
//      node testes/teste_jornada.mjs --autoteste [pasta] → planta um erro de conta e sai 0 só se o teste ACUSAR
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const args = process.argv.slice(2), AUTO = args.includes('--autoteste');
const OUT = resolve(args.find(a => !a.startsWith('--')) || '.scratch/prints'); mkdirSync(OUT, { recursive: true });
let APP = resolve('Jornada_da_Ester.html');
if (AUTO) { const s = readFileSync(APP, 'utf8'), sab = s.replace('r:a+b,ver:(el)=>vQ10(el,a,b)', 'r:a+b+1,ver:(el)=>vQ10(el,a,b)'); if (sab === s) { console.log('AUTOTESTE: não plantou'); process.exit(1); } APP = join(OUT, 'jornada-sabotada.html'); writeFileSync(APP, sab); }
const porta = 9387;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${porta}`, '--window-size=1366,900', `--user-data-dir=${join(tmpdir(), 'jornada-' + Date.now())}`, 'about:blank'], { stdio: 'ignore' });
const espera = ms => new Promise(r => setTimeout(r, ms));
let alvo; for (let i = 0; i < 40 && !alvo; i++) { await espera(250); try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json`)).json()).find(t => t.type === 'page'); } catch { } }
if (!alvo) { console.log('FALHA: Chrome não respondeu'); chrome.kill(); process.exit(1); }
const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const erros = [];
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); });
const cdp = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const avalia = async e => { const r = await cdp('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) return { erro: r.result.exceptionDetails.exception?.description }; return r.result.result.value; };
const print = async n => { const r = await cdp('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(OUT, n), Buffer.from(r.result.data, 'base64')); };
await cdp('Runtime.enable'); await cdp('Page.enable'); await cdp('Page.navigate', { url: pathToFileURL(APP).href }); await espera(1200);
const res = []; const confere = (n, ok, d = '') => { res.push(!!ok); console.log(`${ok ? 'OK   ' : 'FALHA'} ${n}${d ? ' · ' + d : ''}`); };

// J1 · contas: 200 perguntas por fase; o resultado bate com a conta e a dica termina no resultado (ou o cita)
const j1 = await avalia(`(function(){const ruins=[],div=document.createElement('div');let n=0;
 for(const f of jornadaAPI.TODAS)for(let k=0;k<200;k++){const q=f.g();n++;let m=/^(\\d+) ([+−×÷]) (\\d+)$/.exec(q.p),esp;
  if(m){const a=+m[1],b=+m[3];esp=m[2]==='+'?a+b:m[2]==='−'?a-b:m[2]==='×'?a*b:a/b}else if(m=/^(\\d+) \\+ \\? = 10$/.exec(q.p))esp=10-(+m[1]);
  if(esp===undefined)ruins.push(f.id+': conta desconhecida '+q.p);else if(esp!==q.r||!Number.isInteger(q.r)||q.r<0)ruins.push(f.id+': '+q.p+' = '+q.r+' (certo: '+esp+')');
  const d=q.dica(),nums=(d.match(/\\d+/g)||[]).map(Number);if(!nums.includes(q.r))ruins.push(f.id+': dica sem o resultado · '+d);
  for(const c of d.matchAll(/(\\d+) ([+−×]) (\\d+) = (\\d+)/g)){const a=+c[1],b=+c[3],r=+c[4],v=c[2]==='+'?a+b:c[2]==='−'?a-b:a*b;if(v!==r)ruins.push(f.id+': dica com conta errada · '+c[0])}
  if(!q.hist()||q.hist().length<20)ruins.push(f.id+': missão vazia');
  if(k<3){q.ver(div,false);q.ver(div,true)}}
 return {n,fases:jornadaAPI.TODAS.length,ruins:[...new Set(ruins)].slice(0,6)}})()`);
confere('J1 · contas, dicas e missões de todas as fases', j1.ruins && j1.ruins.length === 0, j1.ruins ? (j1.ruins.join(' | ') || `${j1.n} perguntas em ${j1.fases} fases`) : JSON.stringify(j1));
if (AUTO) { const a = res.some(x => !x); console.log(a ? 'AUTOTESTE OK: o erro plantado foi acusado' : 'AUTOTESTE FALHOU'); ws.close(); chrome.kill(); process.exit(a ? 0 : 1); }

const j2 = await avalia("({mundos:document.querySelectorAll('.mundo').length,trancados:document.querySelectorAll('.mundo.trancado').length,livres:[...document.querySelectorAll('.no:not(:disabled)')].map(b=>b.dataset.fase)})");
confere('J2 · mapa: 5 mundos; só a 1ª fase aberta no começo', j2.mundos === 5 && j2.trancados === 4 && j2.livres.length === 1 && j2.livres[0] === 't2', JSON.stringify(j2));
await print('J-1-mapa.png');
const responder = async v => { for (const c of String(v)) await avalia(`document.querySelector('#teclado [data-t="${c}"]').click()`); await avalia("document.querySelector('#teclado [data-t=\"OK\"]').click()"); };
// J3 · fase inteira certa: 3 estrelas, XP, cristais e a fase seguinte abre
await avalia("document.querySelector('[data-fase=\"t2\"]').click()"); await espera(300);
await print('J-2-fase.png');
for (let k = 0; k < 8; k++) { const q = await avalia('jornadaAPI.atual()'); await responder(q.r); if (k === 7) await print('J-3-missao-certa.png'); await avalia("document.getElementById('bSeguir').click()"); }
await espera(400);
const j3 = await avalia("({fim:document.getElementById('mFim').classList.contains('on'),est:document.getElementById('fimEstrelas').textContent,st:(s=>({xp:s.xp,cr:s.cristais,t2:s.fases.t2}))(jornadaAPI.estado())})");
await print('J-4-fim-de-fase.png');
await avalia("document.getElementById('bMapa').click()"); await espera(200);
const prox = await avalia("!document.querySelector('[data-fase=\"t10\"]').disabled");
confere('J3 · 8 de 8: 3 estrelas, 80 XP, 35 cristais e a Torre do 10 abre', j3.fim && j3.est === '★★★' && j3.st.xp === 80 && j3.st.cr === 35 && prox, JSON.stringify({ ...j3, prox }));
// J4 · erro: personagem "ops", figura e dica; a pergunta volta na revisão
await avalia("document.querySelector('[data-fase=\"t10\"]').click()"); await espera(300);
let q = await avalia('jornadaAPI.atual()'); await responder(q.r + 1);
const j4 = await avalia("({dica:!document.getElementById('dica').hidden,fig:document.querySelectorAll('#visual .bloco,#visual .b').length,fala:document.getElementById('falaFase').textContent})");
await print('J-5-erro-com-ajuda.png');
await responder(q.r); await avalia("document.getElementById('bSeguir').click()");
for (let k = 1; k < 8; k++) { q = await avalia('jornadaAPI.atual()'); await responder(q.r); await avalia("document.getElementById('bSeguir').click()"); }
const rev = await avalia("({titulo:document.getElementById('pergunta').textContent,pontos:document.querySelectorAll('#pontos i').length})");
confere('J4 · erro mostra ajuda; a conta errada volta numa revisão no fim', j4.dica && j4.fig > 0 && /Quase|figura/.test(j4.fala) && rev.pontos === 9, JSON.stringify({ ...j4, ...rev }));
q = await avalia('jornadaAPI.atual()'); await responder(q.r); await avalia("document.getElementById('bSeguir').click()"); await espera(300);
const j4b = await avalia("({est:document.getElementById('fimEstrelas').textContent,txt:document.getElementById('fimTexto').textContent})");
confere('J5 · 7 de 8 de primeira = 2 estrelas (a revisão não infla)', j4b.est === '★★☆', JSON.stringify(j4b));
await avalia("document.getElementById('bMapa').click()");
// J6 · chefão: só números no começo
await avalia("jornadaAPI.comecar('tchefe')"); await espera(300);
const j6 = await avalia("({txt:document.getElementById('visual').textContent,b:document.querySelectorAll('#visual .b').length})");
confere('J6 · chefão começa só com números; a figura fica na ajuda', /só números/.test(j6.txt) && j6.b === 0, JSON.stringify(j6));
await print('J-6-chefao.png');
await avalia("jornadaAPI.ir('mapa')");
// J7 · armário: compra e usa o visor; o desenho da personagem muda
await avalia("jornadaAPI.ir('loja')"); await avalia("document.querySelector('[data-comprar=\"visor\"]').click()"); await espera(200);
const j7 = await avalia("({tem:jornadaAPI.estado().itens.includes('visor'),usa:jornadaAPI.estado().equipado.includes('visor'),cr:jornadaAPI.estado().cristais,visorNoDesenho:document.querySelectorAll('#avaLoja rect[stroke=\"#38e1ff\"]').length})");
confere('J7 · compra no armário: visor equipado e desenhado', j7.tem && j7.usa && j7.visorNoDesenho === 1, JSON.stringify(j7));
await print('J-7-armario.png');
// J8 · progresso volta ao reabrir
await cdp('Page.reload'); await espera(900);
const j8 = await avalia("({xp:jornadaAPI.estado().xp,t2:jornadaAPI.estado().fases.t2?.estrelas,visor:jornadaAPI.estado().equipado.includes('visor')})");
confere('J8 · progresso, estrelas e itens continuam depois de reabrir', j8.xp > 80 && j8.t2 === 3 && j8.visor, JSON.stringify(j8));
// J9 · cada tipo de figura aparece numa fase de cada mundo (pais liberam tudo)
await avalia("jornadaAPI.estado().liberar=true;jornadaAPI.ir('mapa')");
const vis = {}; for (const f of ['a2', 's2', 's5', 'm3', 'd1']) { await avalia(`jornadaAPI.comecar('${f}')`); await espera(150); await avalia("document.getElementById('bAjuda').click()"); await espera(150); vis[f] = await avalia("document.getElementById('visual').innerHTML.length"); await print(`J-8-visual-${f}.png`); await avalia("jornadaAPI.ir('mapa')"); }
confere('J9 · figuras de adição, subtração, multiplicação e divisão aparecem', Object.values(vis).every(v => v > 200), JSON.stringify(vis));
// J11 · a figura da multiplicação nunca mostra a resposta (81 contas de 2 a 10)
// controle (REGRA CINCO): a mesma régua, contra uma figura falsa que mostra a resposta, TEM de acusar
const ctrl = await avalia(`(function(){const d=document.createElement('div');let acusou=0;for(let a=2;a<=10;a++)for(let b=2;b<=10;b++){d.textContent=String(a*b);const nums=(d.textContent.match(/\\d+/g)||[]).map(Number);if(nums.includes(a*b))acusou++}return acusou})()`);
confere('J11a · controle: a régua acusa uma figura que revela a resposta', ctrl === 81, `${ctrl} de 81 acusadas`);
const j11 = await avalia(`(function(){const d=document.createElement('div'),ruins=[];for(let a=2;a<=10;a++)for(let b=2;b<=10;b++){
  const q={...jornadaAPI.TODAS.find(f=>f.id==='t2')};const div=d;const fake=jornadaAPI.TODAS[0].g;
  window.__v(div,a,b);const nums=(div.textContent.match(/\\d+/g)||[]).map(Number);if(nums.includes(a*b))ruins.push(a+'×'+b);if(div.querySelectorAll('.b').length)ruins.push(a+'×'+b+' com bolinhas')}return ruins})()`);
confere('J11 · bloco fechado: nenhuma figura de multiplicação mostra a resposta nem tem bolinhas', Array.isArray(j11) && j11.length === 0, Array.isArray(j11) ? (j11.join(', ') || '81 de 81') : JSON.stringify(j11));
// J12–J14 · a figura vai sumindo e a revisão traz fases já vencidas
await avalia("jornadaAPI.comecar('t5')"); await espera(300);
const p1 = await avalia("({blocos:document.querySelectorAll('#visual .bloco').length,bol:document.querySelectorAll('#visual .b').length})");
confere('J12 · 1ª pergunta: figura de blocos, sem bolinhas para contar', p1.blocos > 0 && p1.bol === 0, JSON.stringify(p1));
await print('J-9-bloco-fechado.png');
for (let k = 0; k < 2; k++) { const q = await avalia('jornadaAPI.atual()'); await responder(q.r); await avalia("document.getElementById('bSeguir').click()"); }
const p3a = await avalia("document.querySelectorAll('#visual .bloco').length"); await espera(2300);
const p3b = await avalia("document.getElementById('visual').textContent");
await print('J-10-figura-sumiu.png');
for (let k = 2; k < 5; k++) { const q = await avalia('jornadaAPI.atual()'); await responder(q.r); await avalia("document.getElementById('bSeguir').click()"); }
const p6 = await avalia("({txt:document.getElementById('visual').textContent,rev:jornadaAPI.atual().revisao===true})");
confere('J13 · 3ª pergunta: a figura aparece e some em 2 s; 6ª: só números', p3a > 0 && /Viu a forma/.test(p3b) && /cabeça/.test(p6.txt), JSON.stringify({ p3a, p3b, p6 }));
confere('J14 · revisão espaçada: a 6ª pergunta vem de uma fase já vencida', p6.rev, JSON.stringify(p6));
await avalia("jornadaAPI.ir('mapa')");
// J15 · conta armada: cada passo aceita a resposta certa e o resultado escrito na conta é o certo (300 por fase + truques)
const resolver = `function resolver(conta){const box=document.createElement('div');__arm.iniciarArmada(conta,box);let r;for(const p of conta.passos){r=__arm.responderArmada(p.resp);if(r==='erro')return 'passo recusado: '+p.txt}return r==='fim'?__arm.resultadoArmada():'não terminou'}`;
const j15 = await avalia(`(function(){${resolver};const ruins=[];let n=0;
 for(const f of jornadaAPI.TODAS)for(let k=0;k<300;k++){const q=f.g();if(!q.armada)continue;n++;const v=resolver(q.armada);if(v!==q.r)ruins.push(f.id+': '+q.p+' deu '+v)}
 for(let a=1;a<=10;a++)for(let b=1;b<=10;b++){const c=__arm.contaDoTruque(a,b);if(!c)continue;n++;const v=resolver(c);if(v!==a*b)ruins.push('truque '+a+'×'+b+' deu '+v)}
 return {n,ruins:[...new Set(ruins)].slice(0,6)}})()`);
confere('J15 · conta armada: passos e resultado certos em todas as fases e truques', j15.ruins && j15.ruins.length === 0 && j15.n > 2000, j15.ruins ? (j15.ruins.join(' | ') || `${j15.n} contas armadas resolvidas`) : JSON.stringify(j15));
const j15a = await avalia(`(function(){${resolver};const c=__arm.armarSoma(38,27);c.passos[0].pos=[{k:'res:0',v:9},{k:'vai:1',v:1}];const v=resolver(c);
 const box=document.createElement('div');__arm.iniciarArmada(__arm.armarSoma(38,27),box);const rec=__arm.responderArmada(14);return {sabotada:v,recusaErrado:rec}})()`);
confere('J15a · controle: a régua acusa conta armada errada e o passo recusa resposta errada', j15a.sabotada !== 65 && j15a.recusaErrado === 'erro', JSON.stringify(j15a));
// J16 · soma armada com "vai 1" jogada pelo teclado
await avalia("jornadaAPI.estado().liberar=true;jornadaAPI.comecar('a5')"); await espera(300);
let qa = await avalia('jornadaAPI.atual()');
const passosA = await avalia('__arm.atual().conta.passos.map(p=>p.resp)');
await responder(passosA[0]); await espera(200); await print('J-11-soma-armada-vai-um.png');
for (const v of passosA.slice(1)) await responder(v);
const j16 = await avalia("({fim:__arm.atual().fim,resp:document.getElementById('resp').textContent,seguir:!document.getElementById('bSeguir').hidden,vai:document.querySelectorAll('#armBox .peq.novo, #armBox .peq').length})");
await print('J-12-soma-armada-pronta.png');
confere('J16 · soma armada passo a passo pelo teclado chega ao resultado', j16.fim && +j16.resp === qa.r && j16.seguir, JSON.stringify({ ...j16, r: qa.r, passos: passosA }));
// J17 · divisão na chave jogada pelo teclado
await avalia("jornadaAPI.comecar('d5')"); await espera(300);
qa = await avalia('jornadaAPI.atual()'); const passosD = await avalia('__arm.atual().conta.passos.map(p=>p.resp)');
for (const [j, v] of passosD.entries()) { await responder(v); if (j === 2) await print('J-13-chave-meio.png'); }
const j17 = await avalia("({fim:__arm.atual().fim,quo:document.querySelector('#armBox .quo').textContent.trim(),seguir:!document.getElementById('bSeguir').hidden})");
await print('J-14-chave-pronta.png');
confere('J17 · divisão na chave passo a passo: o quociente aparece embaixo do divisor', j17.fim && +j17.quo === qa.r && j17.seguir, JSON.stringify({ ...j17, p: qa.p, r: qa.r }));
// J18 · ajuda da tabuada arma a conta do truque (7 × 6 → 35 + 7) e resolver a conta responde a pergunta
await avalia("jornadaAPI.comecar('t7')"); await espera(300);
let t = null; for (let k = 0; k < 20; k++) { t = await avalia("(q=>({a:+q.p.split(' × ')[0],b:+q.p.split(' × ')[1],r:q.r}))(jornadaAPI.atual())"); if (t.a !== 1 && t.b !== 1 && t.a !== 10 && t.b !== 10 && t.a !== 5 && t.b !== 5) break; await avalia("jornadaAPI.comecar('t7')"); }
await avalia("document.getElementById('bAjuda').click()"); await espera(200);
const temArm = await avalia("!!document.querySelector('#armBox .arm')");
await print('J-15-ajuda-tabuada-armada.png');
const passosT = await avalia('__arm.atual()?.conta.passos.map(p=>p.resp)||[]');
for (const v of passosT) await responder(v);
const j18 = await avalia("({seguir:!document.getElementById('bSeguir').hidden,resp:document.getElementById('resp').textContent})");
confere('J18 · ajuda da tabuada arma a conta do truque e resolvê-la responde a pergunta', temArm && passosT.length > 0 && j18.seguir && +j18.resp === t.r, JSON.stringify({ temArm, t, passosT, ...j18 }));
await avalia("jornadaAPI.ir('mapa')");
confere('J10 · zero erro de JavaScript', erros.length === 0, erros.join(' | '));
ws.close(); chrome.kill();
const f = res.filter(x => !x).length; console.log(`\n${res.length - f} de ${res.length} conferências OK`); process.exit(f ? 1 : 0);
