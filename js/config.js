window.APP_CONFIG = {
  projectName: 'Uma História Que Ainda Está a Começar',
  recipientName: 'Adriana Pedro',
  defaultTitle: 'Uma pequena surpresa para Adriana Pedro.',
  defaultSubtitle: 'Uma pequena surpresa para Adriana Pedro.',
  refreshIntervalMs: 300000,
  whatsappNumber: '',
  whatsappMessage: 'Olá Adriana, adorei a proposta. Gostaria de conversar contigo.',
  collaborationApiUrl: 'https://script.google.com/macros/s/AKfycbxmaetWMk1nleKSBRvnYAevH5O0dgT7n69NNCX3OLaUx7SP5zueGHn9jKXmkYHTIubD/exec',
  cloudinary: {
    cloudName: 'dgj5l53mw',
    apiKey: '926288465169768',
    maxImageBytes: 8 * 1024 * 1024,
    maxAudioBytes: 25 * 1024 * 1024,
    maxVideoBytes: 100 * 1024 * 1024
  },
  csvUrls: {
    configuracoes: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQlzYwD00M7p9p_99c6j_LX-cGuKZmvI9o_QHRDZ78Jqmlu5ueIK_y2rW_hD3Idiy0PKlOoeGxozW7p/pub?gid=2078683880&single=true&output=csv',
    inicio: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQlzYwD00M7p9p_99c6j_LX-cGuKZmvI9o_QHRDZ78Jqmlu5ueIK_y2rW_hD3Idiy0PKlOoeGxozW7p/pub?gid=1485777206&single=true&output=csv',
    palavras: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQlzYwD00M7p9p_99c6j_LX-cGuKZmvI9o_QHRDZ78Jqmlu5ueIK_y2rW_hD3Idiy0PKlOoeGxozW7p/pub?gid=324010757&single=true&output=csv',
    galeria: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQlzYwD00M7p9p_99c6j_LX-cGuKZmvI9o_QHRDZ78Jqmlu5ueIK_y2rW_hD3Idiy0PKlOoeGxozW7p/pub?gid=1687838858&single=true&output=csv',
    detalhes: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQlzYwD00M7p9p_99c6j_LX-cGuKZmvI9o_QHRDZ78Jqmlu5ueIK_y2rW_hD3Idiy0PKlOoeGxozW7p/pub?gid=2007404590&single=true&output=csv',
    carta: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQlzYwD00M7p9p_99c6j_LX-cGuKZmvI9o_QHRDZ78Jqmlu5ueIK_y2rW_hD3Idiy0PKlOoeGxozW7p/pub?gid=721788076&single=true&output=csv',
    surpresa: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQlzYwD00M7p9p_99c6j_LX-cGuKZmvI9o_QHRDZ78Jqmlu5ueIK_y2rW_hD3Idiy0PKlOoeGxozW7p/pub?gid=230874891&single=true&output=csv',
    convite: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQlzYwD00M7p9p_99c6j_LX-cGuKZmvI9o_QHRDZ78Jqmlu5ueIK_y2rW_hD3Idiy0PKlOoeGxozW7p/pub?gid=1094655869&single=true&output=csv',
    menu: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQlzYwD00M7p9p_99c6j_LX-cGuKZmvI9o_QHRDZ78Jqmlu5ueIK_y2rW_hD3Idiy0PKlOoeGxozW7p/pub?gid=1423819455&single=true&output=csv',
    biblioteca: ''
  },
  firebase: {
    apiKey: 'AIzaSyAvEtOxeU8Sb_Vxclw7_ow1yamMVSyXve0',
    authDomain: 'adriana-site.firebaseapp.com',
    projectId: 'adriana-site',
    appId: '1:695328971380:web:e46aeb0ae019d1dea9cf21'
  },
  pageConfig: {
    home: 'index.html',
    palavras: 'pages/palavras.html',
    galeria: 'pages/galeria.html',
    detalhes: 'pages/detalhes.html',
    carta: 'pages/carta.html',
    surpresa: 'pages/surpresa.html',
    convite: 'pages/convite.html',
    biblioteca: 'pages/biblioteca.html'
  },
  fallbackData: {
    configuracoes: [
      { chave: 'nome_projeto', valor: 'Uma História Que Ainda Está a Começar' },
      { chave: 'nome_destinataria', valor: 'Adriana Pedro' },
      { chave: 'titulo_global', valor: 'Uma pequena surpresa para Adriana Pedro.' },
      { chave: 'subtitulo_global', valor: 'Uma pequena surpresa para Adriana Pedro.' },
      { chave: 'mensagem_rodape', valor: 'Feito com carinho e uma curiosidade grande.' },
      { chave: 'imagem_principal', valor: '' },
      { chave: 'cor_primaria', valor: '#75213C' },
      { chave: 'cor_secundaria', valor: '#D42258' },
      { chave: 'whatsapp', valor: '' },
      { chave: 'mensagem_padrao_convite', valor: 'Gostaria de te conhecer melhor e conversar contigo.' },
      { chave: 'exibir_musica', valor: 'false' },
      { chave: 'audio_url', valor: '' },
      { chave: 'intervalo_atualizacao', valor: '300000' },
      { chave: 'estado_site', valor: 'ativo' }
    ],
    inicio: [
      { id: 'hero', tipo: 'hero', titulo: 'Uma pequena surpresa para Adriana Pedro.', texto: 'Afinal, este é um convite para descobrir mais sobre a forma como penso em ti, com cuidado e curiosidade.', url_imagem: '', texto_botao: 'Descobre a tua surpresa', url_botao: 'pages/surpresa.html', etiqueta: 'Surpresa', ordem: '1', ativo: 'true' },
      { id: 'intro', tipo: 'introducao', titulo: 'A intenção é simples', texto: 'Quero conhecer-te melhor, mostrar-te que aprecio o teu brilho e deixar-te uma memória digital com um pouco da minha curiosidade.', url_imagem: '', texto_botao: '', url_botao: '', etiqueta: 'Introdução', ordem: '2', ativo: 'true' },
      { id: 'card-1', tipo: 'card', titulo: 'Um sorriso genuíno', texto: 'Há algo em ti que merece ser apreciado com calma e atenção.', url_imagem: '', texto_botao: 'Ver mais', url_botao: 'pages/palavras.html', etiqueta: 'Admiracao', ordem: '3', ativo: 'true' },
      { id: 'card-2', tipo: 'card', titulo: 'Pequenos detalhes', texto: 'É nos pequenos gestos que as pessoas se revelam.', url_imagem: '', texto_botao: 'Explorar', url_botao: 'pages/galeria.html', etiqueta: 'Detalhes', ordem: '4', ativo: 'true' },
      { id: 'cta', tipo: 'chamada_acao', titulo: 'Queres descobrir mais?', texto: 'Há uma mensagem, uma galeria e uma proposta final preparadas com carinho.', url_imagem: '', texto_botao: 'Ir para a carta', url_botao: 'pages/carta.html', etiqueta: 'Convite', ordem: '5', ativo: 'true' }
    ],
    palavras: [
      { id: 'p1', categoria: 'Admiração', titulo: 'O teu jeito de ser', texto: 'Há uma forma muito tua de iluminar os momentos mais simples. Isso merece ser notado.', etiqueta: 'Sorriso', icone: '❤', ordem: '1', ativo: 'true', modo_exibicao: 'normal' },
      { id: 'p2', categoria: 'Beleza', titulo: 'Sem esforço', texto: 'Nem sempre é preciso dizer muito para deixar uma impressão bonita.', etiqueta: 'Luz', icone: '✦', ordem: '2', ativo: 'true', modo_exibicao: 'normal' },
      { id: 'p3', categoria: 'Pensamentos', titulo: 'Uma curiosidade honesta', texto: 'Quero conhecer melhor o que está por detrás do teu sorriso.', etiqueta: 'Curiosidade', icone: '☾', ordem: '3', ativo: 'true', modo_exibicao: 'revelado' }
    ],
    galeria: [
      { id: 'g1', titulo: 'Momento suave', texto: 'Um pedacinho da energia que te acompanha.', url_imagem: '', texto_alternativo: 'Fotografia opcional', categoria: 'Pessoal', etiqueta: 'Luz', mensagem_oculta: 'Gostava de conhecer mais da tua forma de ver o mundo.', ordem: '1', ativo: 'true' },
      { id: 'g2', titulo: 'Detalhes que marcam', texto: 'As coisas simples passam a ter outra intensidade quando são vistas com atenção.', url_imagem: '', texto_alternativo: 'Fotografia opcional', categoria: 'Pessoal', etiqueta: 'Felicidade', mensagem_oculta: 'Há uma beleza natural que merece ser descoberta.', ordem: '2', ativo: 'true' }
    ],
    biblioteca: [],
    detalhes: [
      { id: 'd1', categoria: 'Personalidade', titulo: 'Presença', texto: 'A forma como te expresses deixa qualquer conversa mais interessante.', icone: '✧', estilo: 'card', ordem: '1', ativo: 'true' },
      { id: 'd2', categoria: 'Sorriso', titulo: 'Luz', texto: 'O teu sorriso tem um jeito de tornar o espaço mais agradável.', icone: '☀', estilo: 'card', ordem: '2', ativo: 'true' },
      { id: 'd3', categoria: 'Pequenos detalhes', titulo: 'Atenção', texto: 'O que mais me surpreende é a forma natural como você conquista atenção.', icone: '❀', estilo: 'card', ordem: '3', ativo: 'true' }
    ],
    carta: [
      { id: 'c1', tipo: 'paragrafo', titulo: 'Mensagem', texto: 'Acredito que há algo especial em como a tua presença me faz olhar com mais atenção para o que é simples e bonito.', ordem: '1', ativo: 'true' },
      { id: 'c2', tipo: 'frase_de_destaque', titulo: 'Dedicatória', texto: 'Quero conhecer-te melhor, com curiosidade e respeito.', ordem: '2', ativo: 'true' },
      { id: 'c3', tipo: 'paragrafo', titulo: 'Conclusão', texto: 'Este espaço é apenas um começo, um convite para descobrir mais, sem pressões nem promessas exageradas.', ordem: '3', ativo: 'true' },
      { id: 'c4', tipo: 'assinatura', titulo: 'Assinatura', texto: 'Com carinho,', ordem: '4', ativo: 'true' }
    ],
    surpresa: [
      { id: 's1', tipo: 'mensagem', titulo: 'Surpresa discreta', texto: 'Há uma parte de mim que gosta de te descobrir aos poucos.', url_imagem: '', mensagem_revelada: 'Quero saber como seria conversar contigo sem pressa.', ordem: '1', ativo: 'true' },
      { id: 's2', tipo: 'flip_card', titulo: 'Mensagem escondida', texto: 'Clica aqui e descobre uma frase.', url_imagem: '', mensagem_revelada: 'A tua presença deixou uma curiosidade genuína.', ordem: '2', ativo: 'true' }
    ],
    convite: [
      { id: 'v1', tipo: 'titulo', titulo: 'Vamos conversar?', texto: 'Se achares bem, podemos marcar um café, um passeio ou simplesmente ter um momento tranquilo para nos conhecermos melhor.', ordem: '1', ativo: 'true' },
      { id: 'v2', tipo: 'mensagem', titulo: 'Convite', texto: 'Sem pressões, sem promessas, só com respeito e curiosidade.', ordem: '2', ativo: 'true' }
    ],
    menu: [
      { id: 'home', titulo: 'Início', caminho: 'index.html', icone: '⌂', ordem: '1', ativo: 'true', destaque: 'true' },
      { id: 'palavras', titulo: 'Palavras', caminho: 'pages/palavras.html', icone: '✎', ordem: '2', ativo: 'true', destaque: 'false' },
      { id: 'galeria', titulo: 'Galeria', caminho: 'pages/galeria.html', icone: '◌', ordem: '3', ativo: 'true', destaque: 'false' },
      { id: 'detalhes', titulo: 'Detalhes', caminho: 'pages/detalhes.html', icone: '✦', ordem: '4', ativo: 'true', destaque: 'false' },
      { id: 'carta', titulo: 'Carta', caminho: 'pages/carta.html', icone: '✉', ordem: '5', ativo: 'true', destaque: 'false' },
      { id: 'surpresa', titulo: 'Surpresa', caminho: 'pages/surpresa.html', icone: '❀', ordem: '6', ativo: 'true', destaque: 'false' },
      { id: 'convite', titulo: 'Convite', caminho: 'pages/convite.html', icone: '☕', ordem: '7', ativo: 'true', destaque: 'true' },
      { id: 'biblioteca', titulo: 'Biblioteca', caminho: 'pages/biblioteca.html', icone: '▶', ordem: '8', ativo: 'true', destaque: 'false' }
    ]
  }
};

window.getRelativeRoot = function () {
  const isPage = window.location.pathname.includes('/pages/');
  return isPage ? '../' : './';
};
