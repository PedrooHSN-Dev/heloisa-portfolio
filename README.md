# Portfólio da Heloisa S. B. (versão white label)

Site de página única feito com React + Vite + Framer Motion, em português e inglês.

Há dois jeitos de cuidar do conteúdo:

1. **Painel de edição (recomendado):** a Heloisa entra em `endereço-do-site/#admin`, faz login e cria coleções e projetos, envia imagens, edita "sobre mim" e contatos, sem tocar em código. Veja a seção "Painel de edição" abaixo.
2. **Arquivo `src/content.js`:** o conteúdo de exemplo (white label). Continua no projeto como **cópia de reserva**: enquanto o painel não tiver nenhum projeto publicado, ou se o banco estiver fora do ar, o site mostra esse conteúdo.

## Painel de edição (Supabase)

O conteúdo editável fica no Supabase (banco de dados + armazenamento de imagens). O site lê de lá; o painel escreve.

**Como funciona**
- Endereço do painel: `endereço-do-site/#admin` (com o `#`). Não há link para ele no site. Isso não é a segurança: a proteção real é o login, conferido pelo banco.
- Só entra quem tem usuário no Supabase **e** está na tabela `admins`. Qualquer outra conta é recusada, mesmo que consiga fazer login.
- As regras de acesso (RLS) ficam no banco: visitantes só leem projetos **publicados**; só administradoras escrevem ou enviam arquivos.
- Ao enviar imagens, o próprio painel converte para WebP (até 1600 px) e cria a miniatura. Não precisa rodar `npm run imagens` para o que for enviado pelo painel.
- Rascunhos: desmarque "Visível no site" e o projeto só aparece no painel.
- Coleções sem projeto publicado não aparecem no site. Enquanto **nenhum** projeto estiver publicado, o site mostra os exemplos de `content.js`; ao publicar o primeiro, os exemplos somem.
- O site guarda uma cópia do conteúdo no navegador do visitante e atualiza em segundo plano, então abre rápido e ainda funciona se o Supabase estiver fora do ar.

**Configuração (já feita neste projeto)**
- Arquivos em `supabase/migrations/` recriam o banco do zero, na ordem: `001_schema.sql`, `002_seed.sql`, `003_fix_works_read.sql`.
- `.env` precisa de `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY` (chave **publishable**, pública por natureza). Nunca coloque a chave `service_role`/`secret` no projeto.

**Entregar para a Heloisa (quando ela assumir)**
1. No Supabase: Authentication → Users → *Add user* com o e-mail dela e uma senha provisória (marque *Auto Confirm User*).
2. No SQL Editor: `insert into public.admins (user_id) select id from auth.users where email = 'email-dela@exemplo.com';`
3. Ela entra em `#admin` e troca a senha em "Minha conta".
4. Depois, se quiser, remova o seu acesso: `delete from public.admins where user_id = (select id from auth.users where email = 'seu-email');`

**Ajustes de segurança no painel do Supabase (Authentication)**
- *Sign In / Providers*: desligue **Allow new users to sign up**. Ninguém precisa criar conta; só quem você cadastra.
- *Password security*: ligue **Leaked password protection**.
- *URL Configuration*: depois de publicar, coloque o endereço do site em **Site URL** e em **Redirect URLs** (com `#admin` no fim). É isso que faz funcionar o "Esqueci a senha".

**Plano gratuito do Supabase:** o projeto é pausado após cerca de 1 semana sem nenhuma atividade. Visitas ao site contam como atividade, mas um portfólio com poucas visitas pode pausar. Enquanto pausado, o site mostra a última cópia guardada (ou os exemplos, para quem nunca visitou). Reativar é um clique no painel do Supabase, ou use um plano pago para evitar.

## Rodar no computador

Precisa do Node.js instalado (versão 20 ou mais nova).

```bash
npm install
npm run dev        # abre o site para editar, com atualização ao vivo
npm run build      # gera a pasta dist/ pronta para hospedar
```

## Colocar as imagens pelo computador (sem o painel)

Só necessário se você for usar o `content.js` em vez do painel. Pelo painel, basta enviar as imagens.


1. Coloque as imagens originais, do tamanho que vierem, na pasta `originais/`, em subpastas:
   - `originais/foto.jpg` (foto de perfil)
   - `originais/capas/posts.jpg` (capa de uma coleção, opcional)
   - `originais/projetos/nome-do-projeto.jpg` (imagens dos projetos)
2. Rode `npm run imagens`.
3. O comando converte tudo para WebP, cria miniaturas leves para a grade, mede o formato de cada imagem e mostra no final os caminhos para usar, por exemplo `'projetos/cafe-aurora.webp'`.
4. Cole esses caminhos no `src/content.js` (veja abaixo).

Detalhes: os nomes são limpos automaticamente (sem acento, espaço ou maiúscula). PNG com fundo transparente (adesivos) mantém a transparência. O comando só processa o que é novo; para refazer tudo, use `npm run imagens -- --force`. A pasta `originais/` não vai para o GitHub, só as imagens otimizadas da pasta `public/`.

## Como trocar o conteúdo pelo arquivo (src/content.js)

Textos nos dois idiomas usam `{ pt: '...', en: '...' }`. Onde não houver tradução, pode usar texto simples.

- **Foto:** `photo: 'foto.webp'`.
- **Sobre mim:** edite `about` (cada item da lista é um parágrafo).
- **Contatos:** edite `contact`. Deixe `''` para esconder um botão.
- **Coleções:** edite `categories`. Cada item vira um cartão (hoje: Posts, Desenhos, Adesivos e Banners). Campos: `label` (nome), `description` (frase curta), `cover` (imagem do cartão, opcional) e `maxCols` (máximo de colunas dentro da coleção, útil para banners). O `id` precisa ser igual ao `category` dos projetos.
- **Projetos:** edite `works`.

Projeto com uma imagem:

```js
{ id: 'p01', title: 'Café Aurora', category: 'posts', src: 'projetos/cafe-aurora.webp' }
```

Projeto com várias imagens (a primeira é a capa na grade) e descrição:

```js
{ id: 'p02', title: { pt: 'Campanha Primavera', en: 'Spring Campaign' }, category: 'posts',
  images: ['projetos/primavera-1.webp', 'projetos/primavera-2.webp', 'projetos/primavera-3.webp'],
  description: { pt: 'Série de posts para ...', en: 'Series of posts for ...' } }
```

Para adicionar um projeto, copie uma linha e mude o `id` (precisa ser único). Com imagem real, não use `ratio` nem `pieces`: eles só servem para os blocos coloridos de exemplo. Sem `cover`, o cartão da coleção usa a primeira imagem dela.

## Idiomas

O site abre no idioma salvo pelo visitante ou, na primeira vez, no idioma do navegador dele. O botão PT | EN fica no topo e no rodapé. Os textos fixos (botões, avisos, mensagens de orçamento) ficam em `src/ui.js`. Para ter só português, mude para `languages = ['pt']` no `content.js` (o botão some).

## Orçamento

Cada coleção termina com um botão "Pedir orçamento de ..." e cada projeto aberto em tela cheia tem o botão "Quero algo assim". Ambos abrem o WhatsApp com a mensagem já escrita (cliente só aperta enviar). Sem WhatsApp configurado, abrem o e-mail. As mensagens ficam em `src/ui.js`.

## Prévia ao compartilhar o link

Quando o link é enviado no WhatsApp, Instagram ou LinkedIn, aparece um cartão com título, descrição e imagem.

- **Textos:** estão no `index.html` (linhas `og:title` e `og:description`).
- **Imagem:** troque `public/og-image.jpg` (1200 x 630 px, de preferência abaixo de 300 KB). A atual é só um modelo.
- **Endereço do site:** quando o site for publicado, preencha `VITE_SITE_URL` no arquivo `.env` (por exemplo `https://heloisa.com.br`, sem barra no fim) e gere o site de novo. Sem isso, as redes sociais podem não mostrar a imagem.
- **Ícone da aba:** `public/favicon.svg` e `public/apple-touch-icon.png` (180 x 180 px).

## Cores e estilo

As cores ficam no começo de `src/styles.css`, na seção `:root`. Trocando ali, o site inteiro acompanha.

## Estrutura

- `src/content.js`: conteúdo de exemplo (cópia de reserva)
- `src/data.jsx`: lê o conteúdo do Supabase e cai no `content.js` se preciso
- `src/config.js`, `src/supabase.js`: ligação com o Supabase (o site só usa o `config.js`; o cliente completo vai só no painel)
- `src/admin/`: o painel (login, coleções, projetos, sobre e contato, conta)
- `supabase/migrations/`: banco de dados, regras de acesso e armazenamento
- `src/ui.js`: textos fixos nos dois idiomas
- `src/components/Intro.jsx`: abertura com o nome (aparece uma vez por visita)
- `src/components/Hero.jsx`: foto e sobre mim
- `src/components/Collections.jsx`: cartões das coleções e tela de cada coleção
- `src/components/Masonry.jsx`: mosaico animado dos projetos
- `src/components/Lightbox.jsx`: tela cheia com várias peças, descrição e orçamento
- `src/components/Contact.jsx`: contato
- `scripts/optimize-images.mjs`: o comando `npm run imagens`

As animações respeitam a configuração "reduzir movimento" do aparelho.
