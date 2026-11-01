# CLAUDE.md — Matemática para a Ester

> As regras gerais estão no `CLAUDE.md` da pasta mãe e no `0 Readme First/HARNESS.md` de lá. Aqui fica
> só o que é deste projeto.

- **O que é:** método visual para a Ester aprender tabuada e soma sem contar pauzinhos — pedido do titular,
  01/11/2026. Base: **Concreto → Pictórico → Abstrato** (a do "Método Singapura"), quadros de 10 e grades.
  ⚠️ O titular citou um "método suíço": não há referência conferida com esse nome; o guia diz isso à família.
- **Arquivos:**
  - `Jornada_da_Ester.html` — **o jogo de fases (RPG)**: **🧠 Treino diário da tabuada** (repetição espaçada,
    caixas de Leitner, 5 contas novas por dia) e 6 mundos (Tabuada → Adição → Subtração → Multiplicação → Divisão →
    Vila dos Problemas, com modelo de barras), 39 fases com chefões, conta armada passo a passo, XP, cristais,
    armário de acessórios. O teste aceita `estado._hoje` (AAAA-MM-DD) para simular dias de calendário. Personagem em SVG inspirada na foto da
    Ester — 🔴 **a foto não é usada nem guardada** (é uma criança: decisão de proteção da IA, avisada ao titular em 01/11/2026 — foto não vai a serviço externo nem ao repositório). Progresso em
    `localStorage` (chave `jornada-ester:v1`). Teste: `node testes/teste_jornada.mjs` (+ `--autoteste`).
  - `Matematica_da_Ester.html` — o aplicativo (abre no navegador, sem internet, sem servidor). Progresso só no
    `localStorage` do navegador (chave `ester-matematica:v1`).
  - `Guia_para_os_pais.html` → `Guia_para_os_pais.pdf` (gerado por `node testes/gerar_guia.mjs`).
- **Testes antes de commitar:** `node testes/teste_app.mjs .scratch/prints` (9 conferências, inclusive a conta
  das 100 dicas da tabuada) e `node testes/teste_app.mjs --autoteste .scratch/auto` (tem de acusar o erro
  plantado); `node testes/gerar_guia.mjs` (sai 0 só com o PDF completo).
- **Idade:** 8 anos (titular, 01/11/2026).
- ⚠️ O nome da pasta tem espaço e acento, como o titular pediu (§F58 recomenda sem): caminho sempre entre aspas.
- **Uso familiar** — não é funcionalidade do portal, salvo ordem em contrário do titular.
