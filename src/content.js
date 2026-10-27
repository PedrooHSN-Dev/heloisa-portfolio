// ============================================================
// TODO O CONTEÚDO DO SITE FICA AQUI.
// Tudo abaixo é texto/imagem de exemplo (white label): troque
// pelos dados reais da Heloisa sem mexer nos componentes.
//
// Textos em dois idiomas usam { pt: '...', en: '...' }.
// Onde não houver tradução, pode usar texto simples ('Café Aurora').
// Os textos fixos de botões e avisos ficam em ui.js.
// ============================================================

// Idiomas do site. Para ficar só em português, use: ['pt']
export const languages = ['pt', 'en']

export const site = {
  name: 'Heloisa S. B.',
  role: { pt: 'Designer e marketing', en: 'Designer and marketer' },

  // Foto de perfil. Coloque o arquivo na pasta "originais", rode "npm run imagens"
  // e use o caminho que o comando mostrar, por exemplo: photo: 'foto.webp'
  photo: null,

  // Cada item da lista vira um parágrafo.
  about: {
    pt: [
      'Sou designer e trabalho com marketing, criando identidades, peças para redes sociais e materiais que ajudam marcas a serem lembradas.',
      'Gosto de começar pela conversa: entender quem é o cliente e o que ele quer dizer, e só depois desenhar. O resultado é um design bonito que também cumpre o seu papel.',
    ],
    en: [
      "I'm a designer working in marketing, creating identities, social media pieces and materials that help brands be remembered.",
      'I like to start with a conversation: understanding who the client is and what they want to say, and only then design. The result is beautiful design that also does its job.',
    ],
  },

  // Troque pelos contatos reais. Deixe '' para esconder um item.
  // O WhatsApp também é usado nos botões de orçamento (se estiver vazio, usa o e-mail).
  contact: {
    email: 'contato@exemplo.com',
    whatsapp: '5500000000000', // país + DDD + número, só dígitos
    instagram: 'https://instagram.com/',
    linkedin: 'https://linkedin.com/',
  },
}

// COLEÇÕES: cada uma vira um cartão na página. Ao clicar, o visitante
// vê só os projetos daquela coleção.
//
//   id          identificador (sem espaços); precisa bater com o "category" dos projetos
//   label       nome que aparece no site
//   description frase curta que aparece dentro da coleção (opcional)
//   cover       imagem do cartão, ex.: 'capas/posts.webp' (opcional; sem ela,
//               usa a primeira imagem da coleção)
//   maxCols     máximo de colunas dentro da coleção (opcional). Útil para peças
//               largas, como banners, que ficam melhores em 1 ou 2 colunas.
export const categories = [
  {
    id: 'posts',
    label: { pt: 'Posts', en: 'Posts' },
    description: { pt: 'Publicações para feed e stories.', en: 'Feed and stories publications.' },
    cover: null,
  },
  {
    id: 'desenhos',
    label: { pt: 'Desenhos', en: 'Drawings' },
    description: { pt: 'Ilustrações e artes autorais.', en: 'Illustrations and original artwork.' },
    cover: null,
  },
  {
    id: 'adesivos',
    label: { pt: 'Adesivos', en: 'Stickers' },
    description: { pt: 'Cartelas e adesivos avulsos.', en: 'Sticker sheets and single stickers.' },
    cover: null,
  },
  {
    id: 'banners',
    label: { pt: 'Banners', en: 'Banners' },
    description: {
      pt: 'Banners para sites, campanhas e eventos.',
      en: 'Banners for websites, campaigns and events.',
    },
    cover: null,
    maxCols: 2,
  },
]

// PROJETOS. Os de exemplo não têm imagem e aparecem como blocos coloridos.
//
// Projeto com UMA imagem:
//   { id: 'p01', title: 'Café Aurora', category: 'posts', src: 'projetos/cafe-aurora.webp' }
//
// Projeto com VÁRIAS imagens (a primeira é a capa na grade):
//   { id: 'p02', title: { pt: 'Campanha Primavera', en: 'Spring Campaign' }, category: 'posts',
//     images: ['projetos/primavera-1.webp', 'projetos/primavera-2.webp', 'projetos/primavera-3.webp'],
//     description: { pt: 'Série de posts para ...', en: 'Series of posts for ...' } }
//
// O caminho da imagem é o que o comando "npm run imagens" mostra ao terminar.
// Com imagem real, NÃO use "ratio" nem "pieces": o site descobre o formato sozinho.
// "ratio" (altura ÷ largura) e "pieces" (nº de peças) só servem para os blocos de exemplo.
const exemplo = { pt: 'Projeto de exemplo', en: 'Sample project' }
const descricao = {
  pt: 'Aqui entra a descrição do projeto: o objetivo, o cliente e o que foi entregue.',
  en: 'The project description goes here: the goal, the client and what was delivered.',
}

export const works = [
  // Posts
  { id: 'p01', title: exemplo, category: 'posts', ratio: 1.25, pieces: 3, description: descricao, src: null },
  { id: 'p02', title: exemplo, category: 'posts', ratio: 1.0, src: null },
  { id: 'p03', title: exemplo, category: 'posts', ratio: 1.78, src: null },
  { id: 'p04', title: exemplo, category: 'posts', ratio: 1.25, pieces: 4, description: descricao, src: null },
  { id: 'p05', title: exemplo, category: 'posts', ratio: 1.0, src: null },

  // Desenhos
  { id: 'd01', title: exemplo, category: 'desenhos', ratio: 1.3, src: null },
  { id: 'd02', title: exemplo, category: 'desenhos', ratio: 0.8, pieces: 2, description: descricao, src: null },
  { id: 'd03', title: exemplo, category: 'desenhos', ratio: 1.0, src: null },
  { id: 'd04', title: exemplo, category: 'desenhos', ratio: 1.5, src: null },
  { id: 'd05', title: exemplo, category: 'desenhos', ratio: 0.9, src: null },

  // Adesivos
  { id: 'a01', title: exemplo, category: 'adesivos', ratio: 1.0, pieces: 6, description: descricao, src: null },
  { id: 'a02', title: exemplo, category: 'adesivos', ratio: 1.0, src: null },
  { id: 'a03', title: exemplo, category: 'adesivos', ratio: 0.9, src: null },
  { id: 'a04', title: exemplo, category: 'adesivos', ratio: 1.1, src: null },
  { id: 'a05', title: exemplo, category: 'adesivos', ratio: 1.0, src: null },
  { id: 'a06', title: exemplo, category: 'adesivos', ratio: 1.0, src: null },

  // Banners
  { id: 'b01', title: exemplo, category: 'banners', ratio: 0.5, pieces: 2, description: descricao, src: null },
  { id: 'b02', title: exemplo, category: 'banners', ratio: 0.4, src: null },
  { id: 'b03', title: exemplo, category: 'banners', ratio: 0.55, src: null },
  { id: 'b04', title: exemplo, category: 'banners', ratio: 0.45, src: null },
]
