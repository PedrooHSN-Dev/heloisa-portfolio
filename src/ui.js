// Textos fixos da interface (botões, avisos, mensagens de orçamento) em cada idioma.
// Os textos do portfólio em si (nome, sobre mim, coleções, projetos) ficam em content.js.

export const ui = {
  pt: {
    langName: 'Português',
    langShort: 'PT',
    language: 'Idioma',
    docTitle: 'Portfólio',

    intro: 'Apresentação',
    aboutTitle: 'Sobre mim',
    viewCollections: 'Ver coleções',
    talkToMe: 'Falar comigo',
    photoReserved: 'Espaço reservado para a foto',
    portrait: (name) => `Retrato de ${name}`,

    collections: 'Coleções',
    collectionsIntro: 'Escolha uma coleção para ver os projetos.',
    projects: (n) => `${n} ${n === 1 ? 'projeto' : 'projetos'}`,
    openCollection: (label, n) => `Abrir coleção ${label}, ${n} ${n === 1 ? 'projeto' : 'projetos'}`,
    openProject: (title, cat, pieces) => `Abrir ${title}, ${cat}${pieces > 1 ? `, ${pieces} peças` : ''}`,
    exampleImage: '(imagem de exemplo)',

    quoteCollTitle: (label) => `Gostou da coleção de ${label.toLowerCase()}?`,
    quoteCollText: 'Conte o que você precisa e receba uma proposta sob medida.',
    quoteCollBtn: (label) => `Pedir orçamento de ${label.toLowerCase()}`,
    quoteProjectBtn: 'Quero algo assim',
    msgCollection: (name, label) =>
      `Olá, ${name}! Vi a coleção de ${label.toLowerCase()} no seu portfólio e gostaria de pedir um orçamento.`,
    msgProject: (name, title, label) =>
      `Olá, ${name}! Vi o projeto "${title}" (${label}) no seu portfólio e gostaria de algo parecido. Podemos conversar?`,
    emailSubject: 'Pedido de orçamento',

    close: 'Fechar',
    prev: 'Anterior',
    next: 'Próximo',
    prevProject: 'Projeto anterior',
    nextProject: 'Próximo projeto',
    projectOf: (i, n) => `Projeto ${i} de ${n}`,
    pieceOf: (i, n) => `Peça ${i} de ${n}`,
    goToPiece: (i) => `Ir para a peça ${i}`,

    contactTitle: 'Vamos conversar sobre o seu projeto?',
    contactText:
      'Conte um pouco do que você precisa. A resposta chega com carinho e o mais rápido possível.',
    sendEmail: 'Enviar e-mail',
    whatsapp: 'Chamar no WhatsApp',
  },

  en: {
    langName: 'English',
    langShort: 'EN',
    language: 'Language',
    docTitle: 'Portfolio',

    intro: 'Introduction',
    aboutTitle: 'About me',
    viewCollections: 'View collections',
    talkToMe: 'Get in touch',
    photoReserved: 'Reserved space for the photo',
    portrait: (name) => `Portrait of ${name}`,

    collections: 'Collections',
    collectionsIntro: 'Pick a collection to see the projects.',
    projects: (n) => `${n} ${n === 1 ? 'project' : 'projects'}`,
    openCollection: (label, n) => `Open ${label} collection, ${n} ${n === 1 ? 'project' : 'projects'}`,
    openProject: (title, cat, pieces) => `Open ${title}, ${cat}${pieces > 1 ? `, ${pieces} pieces` : ''}`,
    exampleImage: '(sample image)',

    quoteCollTitle: (label) => `Like the ${label.toLowerCase()} collection?`,
    quoteCollText: 'Tell me what you need and get a tailored proposal.',
    quoteCollBtn: (label) => `Request a ${label.toLowerCase()} quote`,
    quoteProjectBtn: 'I want something like this',
    msgCollection: (name, label) =>
      `Hi, ${name}! I saw the ${label.toLowerCase()} collection in your portfolio and would like to request a quote.`,
    msgProject: (name, title, label) =>
      `Hi, ${name}! I saw the project "${title}" (${label}) in your portfolio and would like something similar. Can we talk?`,
    emailSubject: 'Quote request',

    close: 'Close',
    prev: 'Previous',
    next: 'Next',
    prevProject: 'Previous project',
    nextProject: 'Next project',
    projectOf: (i, n) => `Project ${i} of ${n}`,
    pieceOf: (i, n) => `Piece ${i} of ${n}`,
    goToPiece: (i) => `Go to piece ${i}`,

    contactTitle: "Let's talk about your project?",
    contactText: 'Tell me a little about what you need. You will get a warm reply as soon as possible.',
    sendEmail: 'Send an email',
    whatsapp: 'Message on WhatsApp',
  },
}
