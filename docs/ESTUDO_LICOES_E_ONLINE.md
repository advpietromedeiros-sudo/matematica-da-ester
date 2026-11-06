# Estudo — a Jornada no formato de lições curtas, com ranking entre amigas

> Pedido do titular, 06/11/2026, 16h00, textual: *"PEGUE A JORNADA DE ESTER DE MATEMÁTICA E TRANSFORME TIPO NO
> ESTILO DUOLINGO... ANTES ESTUDE COMO SERIA A METODOLOGIA DO DUOLINGO... AI CRIE UM NOME CHAMATIVO MAS GENERICO
> PQ NÃO É SO ESTER QUE IRÁ USAR... VEJA COMO SERIA PRA JOGAR ONLINE ELA E ALGUMAS AMIGAS E FICAR TUDO RANKING..."*
>
> Este documento é **estudo e plano**: nada foi implementado ainda. As decisões em aberto estão em
> `docs/DECISOES.md`.

## 1. O que o Duolingo diz do próprio método (fontes lidas em 06/11/2026)

| princípio | o que é | fonte |
| --- | --- | --- |
| Aprender fazendo | o exercício vem desde o início; a regra se percebe pelo padrão, sem aula expositiva antes | blog oficial, 02/02/2023 |
| Personalização | a ordem e a dificuldade se ajustam ao aluno, equilibrando o que ele domina e o que ainda é difícil | blog oficial, 02/02/2023 |
| Foco no essencial | conteúdo guiado por padrões curriculares | blog oficial, 02/02/2023 |
| Motivação | lições curtas, pontos (XP) e sequência de dias | blog oficial, 02/02/2023 |
| Encantamento | personagens, humor, mensagens de incentivo | blog oficial, 02/02/2023 |
| Repetição espaçada | revisar **quando está quase esquecendo**; o modelo estima a "meia-vida" de cada item na memória: ela sobe no acerto e cai no erro | blog oficial, 14/12/2016 (artigo de Settles e Meeder, ACL 2016) |

Mais duas coisas, cada uma com o grau de confiança declarado:

- **Duolingo Math:** lições de cerca de 5 minutos e números novos a cada vez que a lição se repete (anúncio de 2022,
  em fonte secundária).
- **Ligas:** grupos de cerca de 30 pessoas ranqueadas pelo XP da semana; os primeiros sobem de divisão e os últimos
  descem. ⚠️ Isso vem **só de fontes não oficiais**, que divergem entre si no número de divisões. Para o nosso
  desenho basta o conceito; o detalhe não foi conferido.
- **Crítica registrada:** a liga e a sequência de dias funcionam em parte pelo **medo de perder** (sequência) e
  levam a "farmar" XP sem aprender. Para uma criança de 8 anos, isso pesa no desenho (ver §3).

## 2. O que a Jornada já tem (medido no código em 06/11/2026)

A Jornada já cobre boa parte do método: **6 mundos com 39 fases e chefões**, **XP e nível**, **cristais**,
**armário de acessórios**, **sequência de dias**, **treino diário da tabuada com repetição espaçada** (caixas de
Leitner: intervalos de 0, 1, 2, 4, 7, 14 e 30 dias; 5 contas novas por dia) e **ajuda visual** que some ao longo da
fase (Concreto → Pictórico → Abstrato). Ela é um arquivo único, sem servidor, e o progresso fica no navegador
(`localStorage`).

**O que falta para o "estilo de lições curtas":**

1. **Caminho único** na tela inicial: as fases como "paradas" numa trilha vertical, com a próxima sempre em
   destaque (hoje é um mapa de mundos).
2. **Lição de 5 minutos** com **exercícios variados**: além de digitar o resultado, múltipla escolha, ligar pares
   (conta ↔ resultado), certo ou errado e completar a figura.
3. **Meta diária** (XP do dia, escolhida pelos pais) e **protetor de sequência** ganho por mérito, para um dia de
   folga não zerar a sequência.
4. **Revisão personalizada:** trocar as caixas fixas por uma estimativa de meia-vida simples por conta (sobe no
   acerto limpo, cai no erro). É evolução, não urgência: as caixas atuais já funcionam.
5. **Personagem escolhida pela criança:** a personagem de hoje foi desenhada a partir da Ester. Num app para
   várias crianças, cada uma monta a sua.

## 3. O que **não** copiar

- 🔴 **Nada da identidade do Duolingo:** nem coruja, nem o verde dele, nem o nome. A ideia de método é livre; a
  aparência e a marca têm dono. A personagem e as cores são nossas.
- **"Vidas" que acabam com o erro: recomendo NÃO usar.** O nosso método trata o erro com **ajuda** (a figura
  volta e a dica aparece). Perder vida por errar ensina a criança a ter medo de tentar.
- **Ranking contra desconhecidos: NÃO.** O ranking é só dentro de um grupo fechado de amigas (§4).
- **XP por volume:** para evitar "farmar", conta mais o XP do acerto **sem ajuda** e da revisão em dia, e há um
  teto diário de XP no ranking.

## 4. Jogar online com as amigas, com ranking

**Desenho proposto:**

- **Quem tem conta é o responsável** (pai, mãe), não a criança. É ele quem dá o consentimento pedido pela LGPD
  (art. 14, §1º: *consentimento específico e em destaque* de um dos pais) e quem cria o perfil da filha.
- **O perfil da criança tem só o mínimo:** apelido e a personagem montada. Nada de nome completo, foto, e-mail,
  escola ou localização. É o que manda o art. 14, §4º: o jogo não pode exigir mais dado do que o estritamente
  necessário.
- **Grupo de amigas por código de convite:** um responsável cria o grupo e manda o código aos outros pais. Só entra
  quem tem o código. **Sem chat** e sem mensagem entre crianças.
- **Liga semanal do grupo:** ranking pelo XP da semana (com o teto diário), zerado toda segunda-feira, com troféu
  para as três primeiras. Um segundo quadro, de **dias praticados na semana**, dá chance a quem joga pouco por dia
  mas joga todo dia.
- **Funciona sem internet:** a criança joga, o progresso fica no aparelho e é enviado quando houver conexão. O
  servidor só guarda o progresso e o XP da semana.

**Onde isso mora:** jogo online precisa de servidor e de banco. Pela ordem do titular de 31/10/2026, *"todos os
materiais e apps [...] serão funcionalidades e aplicacoes que ficarão dentro do portal pietro medeiros"*. Então
a versão online seria **funcionalidade do portal**, com a pilha dele: Next, Postgres e Drizzle, banco com três
papéis e RLS, com um teste que tenta ler o dado de outra família e **tem de falhar**.
⚠️ Isso contraria o `CLAUDE.md` deste projeto, que diz *"uso familiar — não é funcionalidade do portal, salvo
ordem em contrário do titular"*. Ele precisa confirmar (D-002), e no portal isso entra na D-003 (inventário).
🔴 A publicação é do **operador do servidor**. A IA prepara o código e o comando; quem sobe é ele.

## 5. Nome

O nome é **dado**, não texto (HARNESS §E6): fica em `marca/marca.json`, e o código escreve `[marca]`. Assim, se o
nome mudar depois, nada se perde.

| candidato | ideia |
| --- | --- |
| **Contaventura** (recomendado) | conta + aventura: diz o que é e combina com os mundos e os chefões |
| Numerolândia | um lugar feito de números, bom para a trilha de mundos |
| Missão Tabuada | direto, mas estreito: o jogo vai até a divisão e aos problemas |
| Matemundo | matemática + mundo, curto |

⚠️ **O que foi conferido no nome:** em 06/11/2026, uma busca na web por "Contaventura" e "Numerolândia" não
achou nenhum app com esses nomes. **Não houve consulta ao INPI** (registro de marca); antes de publicar com o
nome, essa consulta é necessária.

## 6. Plano, em etapas

| etapa | o que entrega | depende de |
| --- | --- | --- |
| 1 | Lições curtas no arquivo atual: caminho único, 4 tipos novos de exercício, meta diária, protetor de sequência, personagem montável e nome por `[marca]`. Continua sem servidor. | D-001 (nome) |
| 2 | Revisão por meia-vida no lugar das caixas fixas, com teste | etapa 1 |
| 3 | Versão online no portal: conta do responsável, perfil da criança, grupo por convite, liga semanal, envio do progresso | D-002 e D-003 do portal |
| 4 | Publicação | operador do servidor |

**Fica de fora, de propósito:** chat, ranking aberto, compras dentro do app, anúncio e notificação insistente.
**Lacunas declaradas:** detalhe das ligas do Duolingo (só fontes não oficiais) e a consulta ao INPI.

## Fontes

- Duolingo, *The Duolingo Method: 5 key principles* (02/02/2023): https://blog.duolingo.com/duolingo-teaching-method
- Duolingo, *How we learn how you learn* (14/12/2016): https://blog.duolingo.com/how-we-learn-how-you-learn
- Settles e Meeder, *A Trainable Spaced Repetition Model for Language Learning* (ACL 2016): https://preview.aclanthology.org/fix_video/P16-1174.pdf
- Duolingo, *Duolingo launches math app*: https://blog.duolingo.com/duolingo-launches-math-app/
- Ligas (não oficial, só o conceito): https://duolingo.deconstructoroffun.com/mechanics/leagues
- Lei 13.709/2018 (LGPD), art. 14: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
