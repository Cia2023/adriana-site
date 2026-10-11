(function () {
  const config = window.APP_CONFIG;

  function getConfigValue(key, fallback = '') {
    const rows = window.Sheets ? window.Sheets.getData('configuracoes') : config.fallbackData.configuracoes;
    const item = (rows || []).find((entry) => String(entry.chave || '').toLowerCase() === String(key).toLowerCase());
    return item ? item.valor : fallback;
  }

  function getPageLabel(page) {
    const menu = window.Sheets ? window.Sheets.getData('menu') : [];
    const entry = menu.find((item) => {
      const path = String(item.caminho || '').split('/').pop().replace(/\.html$/, '').replace(/^index$/, 'home');
      return path === page;
    });
    return entry ? entry.titulo : '';
  }

  function orderItems(items) {
    return (items || []).slice().sort((a, b) => Number(a.ordem || 999) - Number(b.ordem || 999));
  }

  function escapeHtml(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  const namedIcons = {
    heart: '♥',
    sparkles: '✧',
    'message-circle': '♡',
    feather: '❧',
    smile: '☺',
    star: '★',
    sun: '☼',
    eye: '◉',
    coffee: '☕',
    clock: '◷',
    flower: '❀',
    target: '◎',
    gift: '🎁',
    compass: '✥',
    music: '♫',
    check: '✓',
    cloud: '☁',
    hourglass: '⌛',
    gem: '◇',
    flame: '♨',
    shield: '⬡',
    infinity: '∞',
    crown: '♛',
    'message-square': '▢',
    award: '✹',
    bookmark: '▮',
    moon: '☾',
    key: '⚿'
  };

  function iconMarkup(value, className) {
    const icon = String(value || '').trim().toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(namedIcons, icon)) {
      return `<i class="${className}" aria-hidden="true">✦</i>`;
    }
    return `<i class="${className}" data-lucide="${icon}" aria-hidden="true"><span>${namedIcons[icon]}</span></i>`;
  }

  function safeUrl(value, base) {
    const target = String(value || '').trim();
    if (!target) return '';

    try {
      const root = window.getRelativeRoot ? new URL(window.getRelativeRoot(), window.location.href) : window.location.href;
      const url = new URL(target, base || root);
      if (url.protocol !== 'https:' && url.origin !== window.location.origin) return '';
      if (url.username || url.password) return '';
      return url.href;
    } catch (error) {
      return '';
    }
  }

  function cloudinaryUrl(value, width) {
    const safe = safeUrl(value);
    if (!safe) return '';

    try {
      const url = new URL(safe);
      if (url.protocol !== 'https:' || !/(^|\.)res\.cloudinary\.com$/i.test(url.hostname)) return safe;

      const marker = '/image/upload/';
      const uploadIndex = url.pathname.indexOf(marker);
      if (uploadIndex < 0) return safe;

      const prefix = url.pathname.slice(0, uploadIndex + marker.length);
      const assetPath = url.pathname.slice(uploadIndex + marker.length);
      const segments = assetPath.split('/');
      const transformations = ['f_auto', 'q_auto', `w_${width}`, 'c_limit'];
      const isTransformation = (segment) => /^(?:[a-z]_[^/]+)(?:,|$)/.test(segment);

      if (isTransformation(segments[0])) {
        const existing = segments[0].split(',');
        transformations.forEach((transformation) => {
          const key = transformation.split('_')[0];
          if (!existing.some((entry) => entry.split('_')[0] === key)) existing.push(transformation);
        });
        segments[0] = existing.join(',');
      } else {
        segments.unshift(transformations.join(','));
      }

      url.pathname = prefix + segments.join('/');
      return url.href;
    } catch (error) {
      return safe;
    }
  }

  function imageMarkup(value, alt, width, loading, className = '') {
    const src = cloudinaryUrl(value, width);
    if (!src) return '';
    return `<img class="cloudinary-image ${escapeHtml(className)}" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="${loading}" />`;
  }

  function activeItems(items) {
    return orderItems(items).filter((item) => item.ativo !== false && String(item.ativo) !== 'false');
  }

  function renderHome(data) {
    const items = activeItems(data || []);
    const hero = items.find((item) => item.tipo === 'hero') || items[0] || {};
    const intro = items.find((item) => item.tipo === 'introducao') || {};
    const highlight = items.find((item) => item.tipo === 'destaque');
    const cards = items.filter((item) => item.tipo === 'card');
    const cta = items.find((item) => item.tipo === 'chamada_acao');
    const heroImage = hero.url_imagem || getConfigValue('imagem_principal');
    const projectName = getConfigValue('nome_projeto', config.projectName);
    const heroButton = safeUrl(hero.url_botao);

    document.querySelector('#app').innerHTML = `
      <section class="hero reveal">
        <div class="container hero-grid">
          <div class="hero-copy">
            <span class="eyebrow">${escapeHtml(hero.etiqueta || projectName)}</span>
            <h1>${escapeHtml(hero.titulo || getConfigValue('titulo_global', config.defaultTitle))}</h1>
            <p>${escapeHtml(hero.texto || getConfigValue('subtitulo_global', config.defaultSubtitle))}</p>
            <div class="hero-actions">
              ${heroButton ? `<a href="${escapeHtml(heroButton)}" class="primary-btn">${escapeHtml(hero.texto_botao || '')}</a>` : ''}
            </div>
          </div>
          ${heroImage ? `<div class="hero-visual">${imageMarkup(heroImage, hero.titulo, 1200, 'eager')}</div>` : ''}
        </div>
      </section>

      ${intro ? `
        <section class="intro reveal">
          <div class="container narrow">
            <div class="section-heading">
              ${intro.etiqueta ? `<span class="section-kicker">${escapeHtml(intro.etiqueta)}</span>` : ''}
              <h2>${escapeHtml(intro.titulo || '')}</h2>
            </div>
            <p>${escapeHtml(intro.texto || '')}</p>
          </div>
        </section>
      ` : ''}

      ${highlight ? `
        <section class="feature-quote reveal">
          <div class="container narrow quote-box">
            ${highlight.etiqueta ? `<span class="section-kicker">${escapeHtml(highlight.etiqueta)}</span>` : ''}
            ${highlight.titulo ? `<h2>${escapeHtml(highlight.titulo)}</h2>` : ''}
            <p>“${escapeHtml(highlight.texto || '')}”</p>
          </div>
        </section>
      ` : ''}

      ${cards.length ? `
        <section class="cards-section reveal">
          <div class="container">
            <div class="card-grid">
            ${cards.map((card) => `
              <article class="photo-card reveal-card">
                ${imageMarkup(card.url_imagem, card.titulo, 900, 'lazy')}
                <div class="card-body">
                  ${card.etiqueta ? `<span class="tag">${escapeHtml(card.etiqueta)}</span>` : ''}
                  ${card.titulo ? `<h3>${escapeHtml(card.titulo)}</h3>` : ''}
                  ${card.texto ? `<p>${escapeHtml(card.texto)}</p>` : ''}
                  ${safeUrl(card.url_botao) && card.texto_botao ? `<a href="${escapeHtml(safeUrl(card.url_botao))}" class="text-link">${escapeHtml(card.texto_botao)}</a>` : ''}
                </div>
              </article>
            `).join('')}
            </div>
          </div>
        </section>
      ` : ''}

      ${cta ? `
        <section class="feature-quote reveal">
          <div class="container narrow quote-box">
            ${cta.titulo ? `<h2>${escapeHtml(cta.titulo)}</h2>` : ''}
            <p>${escapeHtml(cta.texto || '')}</p>
            ${safeUrl(cta.url_botao) && cta.texto_botao ? `<a href="${escapeHtml(safeUrl(cta.url_botao))}" class="primary-btn alt">${escapeHtml(cta.texto_botao)}</a>` : ''}
          </div>
        </section>
      ` : ''}
    `;
  }

  function renderWords(data) {
    const filtered = activeItems(data || []);
    const categories = [...new Set(filtered.map((item) => item.categoria).filter(Boolean))];

    const filters = categories.length ? `
      <div class="chip-group" data-filter-group>
        <button class="chip active" data-filter="all">Tudo</button>
        ${categories.map((category) => `<button class="chip" data-filter="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('')}
      </div>
    ` : '';

    document.querySelector('#app').innerHTML = `
      <section class="page-header reveal">
        <div class="container narrow">
          <span class="section-kicker">Palavras</span>
          <h1>${escapeHtml(getPageLabel('palavras'))}</h1>
        </div>
      </section>
      <section class="page-content reveal">
        <div class="container">
          ${filters}
          <div class="word-grid">
            ${filtered.map((item) => `
              <article class="message-card reveal-card" data-category="${escapeHtml(item.categoria || 'Geral')}">
                <div class="message-top">
                  <span class="tag">${escapeHtml(item.etiqueta || 'Mensagem')}</span>
                  <span class="icon-badge">${iconMarkup(item.icone, 'sheet-icon')}</span>
                </div>
                <h3>${escapeHtml(item.titulo || 'Mensagem')}</h3>
                <p>${escapeHtml(item.texto || 'Sem texto definido ainda.')}</p>
              </article>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  function renderGallery(data) {
    const items = activeItems(data || []);
    document.querySelector('#app').innerHTML = `
      <section class="page-header reveal">
        <div class="container narrow">
          <span class="section-kicker">Galeria</span>
          <h1>${escapeHtml(getPageLabel('galeria'))}</h1>
        </div>
      </section>
      <section class="page-content reveal">
        <div class="container">
          <div class="gallery-grid">
            ${items.map((item) => `
              <figure class="gallery-item reveal-card">
                ${item.url_imagem ? `
                  <button class="gallery-image-button" type="button" data-lightbox-src="${escapeHtml(cloudinaryUrl(item.url_imagem, 1800))}" data-lightbox-alt="${escapeHtml(item.texto_alternativo || item.titulo)}">
                    ${imageMarkup(item.url_imagem, item.texto_alternativo || item.titulo, 900, 'lazy')}
                  </button>
                ` : ''}
                <figcaption>
                  ${item.etiqueta ? `<span class="tag">${escapeHtml(item.etiqueta)}</span>` : ''}
                  <h3>${escapeHtml(item.titulo || 'Imagem')}</h3>
                  ${item.texto ? `<p>${escapeHtml(item.texto)}</p>` : ''}
                  ${item.mensagem_oculta ? `<details><summary>Mensagem escondida</summary><small>${escapeHtml(item.mensagem_oculta)}</small></details>` : ''}
                </figcaption>
              </figure>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  function videoEmbedUrl(value) {
    const safe = safeUrl(value);
    if (!safe) return '';
    try {
      const url = new URL(safe);
      if (url.hostname === 'youtu.be') {
        const id = url.pathname.split('/').filter(Boolean)[0];
        return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : '';
      }
      if (/(^|\.)youtube\.com$/i.test(url.hostname)) {
        const id = url.searchParams.get('v') ||
          url.pathname.match(/^\/(?:embed|shorts)\/([a-zA-Z0-9_-]+)/)?.[1];
        return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : '';
      }
      if (/(^|\.)vimeo\.com$/i.test(url.hostname)) {
        const id = url.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
        return id ? `https://player.vimeo.com/video/${encodeURIComponent(id)}` : '';
      }
    } catch (error) {
      return '';
    }
    return '';
  }

  function renderMediaItem(item) {
    const type = String(item.tipo || '').trim().toLowerCase();
    const title = escapeHtml(item.titulo || 'Conteúdo');
    const description = item.texto || item.descricao || '';
    const mediaUrl = safeUrl(item.url || item.url_conteudo || item.url_media);
    const cover = item.url_capa || item.capa || item.url_imagem || '';
    let player = '';

    if (['video', 'vídeo', 'videos', 'vídeos'].includes(type)) {
      const embed = videoEmbedUrl(mediaUrl);
      if (embed) {
        player = `<div class="media-player media-video"><iframe src="${escapeHtml(embed)}" title="${title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
      } else if (mediaUrl) {
        player = `<div class="media-player media-video"><video controls playsinline preload="metadata"${cover ? ` poster="${escapeHtml(cloudinaryUrl(cover, 900))}"` : ''}><source src="${escapeHtml(mediaUrl)}" /></video></div>`;
      }
    } else if (['audio', 'áudio', 'audios', 'áudios'].includes(type) && mediaUrl) {
      player = `${cover ? imageMarkup(cover, item.titulo, 700, 'lazy', 'media-cover') : ''}<audio controls preload="metadata"><source src="${escapeHtml(mediaUrl)}" /></audio>`;
    } else if (['ebook', 'e-book', 'livro', 'pdf'].includes(type) && mediaUrl) {
      player = `${cover ? imageMarkup(cover, item.titulo, 900, 'lazy', 'media-cover') : ''}<a class="primary-btn media-open" href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener noreferrer">Abrir e-book</a>`;
    }

    if (!player) return '';
    return `
      <article class="media-card reveal-card" data-media-type="${escapeHtml(type)}">
        ${player}
        <div class="media-card-copy">
          ${item.categoria ? `<span class="tag">${escapeHtml(item.categoria)}</span>` : ''}
          <h2>${title}</h2>
          ${description ? `<p>${escapeHtml(description)}</p>` : ''}
        </div>
      </article>
    `;
  }

  function renderLibrary(data) {
    const items = activeItems(data || []);
    const cards = items.map(renderMediaItem).filter(Boolean);
    document.querySelector('#app').innerHTML = `
      <section class="page-header reveal">
        <div class="container narrow">
          <span class="section-kicker">Vídeos, áudios e leituras</span>
          <h1>Biblioteca</h1>
          <p>Um espaço para ver, ouvir e descobrir.</p>
        </div>
      </section>
      <section class="page-content reveal">
        <div class="container">
          <div class="media-grid" id="library-items"${cards.length ? '' : ' hidden'}>${cards.join('')}</div>
          <p class="media-empty" data-library-empty${cards.length ? ' hidden' : ''}>Novidades a caminho. Volta em breve.</p>
          <p class="collab-notice" data-library-notice role="status" hidden></p>
        </div>
      </section>
    `;
  }

  function renderDetails(data) {
    const items = activeItems(data || []);
    document.querySelector('#app').innerHTML = `
      <section class="page-header reveal">
        <div class="container narrow">
          <span class="section-kicker">Detalhes</span>
          <h1>${escapeHtml(getPageLabel('detalhes'))}</h1>
        </div>
      </section>
      <section class="page-content reveal">
        <div class="container details-grid">
          ${items.map((item) => `
            <article class="feature-card reveal-card">
              <div class="feature-icon">${iconMarkup(item.icone, 'sheet-icon')}</div>
              <span class="tag">${escapeHtml(item.categoria || 'Detalhe')}</span>
              <h3>${escapeHtml(item.titulo || 'Detalhe')}</h3>
              <p>${escapeHtml(item.texto || 'Texto em destaque.')}</p>
            </article>
          `).join('')}
        </div>
      </section>
    `;
  }

  function renderLetter(data) {
    const items = activeItems(data || []);
    const recipient = getConfigValue('nome_destinataria', config.recipientName);
    document.querySelector('#app').innerHTML = `
      <section class="page-header reveal">
        <div class="container narrow">
          <span class="section-kicker">Carta</span>
          <h1>${escapeHtml(getPageLabel('carta'))}</h1>
        </div>
      </section>
      <section class="page-content reveal">
        <div class="container letter-shell">
          <button class="letter-envelope" type="button" aria-label="Abrir carta">
            <span class="envelope-top"></span>
            <span class="envelope-name">${escapeHtml(recipient)}</span>
          </button>
          <article class="letter-content">
            ${items.map((item) => `
              <div class="letter-block ${escapeHtml(item.tipo || 'paragrafo')}">
                ${item.tipo === 'assinatura' ? '' : `<h3>${escapeHtml(item.titulo || '')}</h3>`}
                <p>${escapeHtml(item.texto || '')}</p>
              </div>
            `).join('')}
          </article>
        </div>
      </section>
    `;
  }

  function renderSurprise(data) {
    const items = activeItems(data || []);
    document.querySelector('#app').innerHTML = `
      <section class="page-header reveal">
        <div class="container narrow">
          <span class="section-kicker">Surpresa</span>
          <h1>${escapeHtml(getPageLabel('surpresa'))}</h1>
        </div>
      </section>
      <section class="page-content reveal">
        <div class="container surprise-grid">
          ${items.map((item) => `
            <article class="flip-card reveal-card ${item.tipo === 'mensagem' ? 'message-flip' : ''}">
              <div class="flip-card-inner">
                <div class="flip-card-front">
                  <span class="tag">${escapeHtml(item.tipo || 'Mensagem')}</span>
                  <h3>${escapeHtml(item.titulo || 'Descoberta')}</h3>
                  <p>${escapeHtml(item.texto || 'Uma frase escondida.')}</p>
                  ${imageMarkup(item.url_imagem, item.titulo, 900, 'lazy')}
                </div>
                <div class="flip-card-back">
                  <p data-hidden-message>${escapeHtml(item.mensagem_revelada || 'Mensagem revelada com carinho.')}</p>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
        <div class="container narrow surprise-actions">
          <button class="primary-btn" type="button" data-random-message>Revelar frase aleatória</button>
          <p data-random-output>Uma frase aleatória aparecerá aqui.</p>
        </div>
      </section>
    `;
  }

  function renderInvite(data) {
    const items = activeItems(data || []);
    const configuredNumber = String(getConfigValue('whatsapp', '')).trim();
    const whatsapp = /^\d{8,15}$/.test(configuredNumber) ? configuredNumber : '';
    const message = encodeURIComponent(getConfigValue('mensagem_padrao_convite', 'Gostaria de te conhecer melhor e conversar contigo.'));
    const whatsappHref = whatsapp ? `https://wa.me/${whatsapp}?text=${message}` : '';
    const inviteImage = getConfigValue('imagem_principal');

    document.querySelector('#app').innerHTML = `
      <section class="page-header reveal">
        <div class="container narrow">
          <span class="section-kicker">Convite</span>
          <h1>${escapeHtml(getPageLabel('convite'))}</h1>
        </div>
      </section>
      <section class="page-content reveal">
        <div class="container invite-card${inviteImage ? '' : ' without-image'}">
          ${inviteImage ? `<div class="invite-image">${imageMarkup(inviteImage, items[0]?.titulo || '', 1200, 'lazy')}</div>` : ''}
          <div class="invite-copy" id="whatsapp-invite">
            ${items.map((item) => `
              <div class="invite-block">
                ${item.tipo === 'botao_whatsapp' ? '' : `<h3>${escapeHtml(item.titulo || '')}</h3>`}
                ${item.texto ? `<p>${escapeHtml(item.texto)}</p>` : ''}
                ${item.tipo === 'botao_whatsapp' && whatsappHref
                  ? `<a href="${escapeHtml(whatsappHref)}" class="primary-btn" target="_blank" rel="noopener noreferrer">${escapeHtml(item.texto_botao || item.titulo || '')}</a>`
                  : ''}
                ${item.tipo === 'despedida' && item.destino
                  ? `<a href="${escapeHtml(safeUrl(item.destino))}" class="text-link">${escapeHtml(item.texto_botao || '')}</a>`
                  : ''}
              </div>
            `).join('')}
            ${items.some((item) => item.tipo === 'botao_whatsapp') && !whatsappHref ? '<p class="muted">O convite por WhatsApp ainda não está disponível.</p>' : ''}
          </div>
        </div>
      </section>
    `;
  }

  function renderPage(page, data) {
    const map = {
      home: renderHome,
      palavras: renderWords,
      galeria: renderGallery,
      biblioteca: renderLibrary,
      detalhes: renderDetails,
      carta: renderLetter,
      surpresa: renderSurprise,
      convite: renderInvite
    };

    const pageSheet = page === 'home' ? (window.Sheets ? window.Sheets.getData('inicio') : config.fallbackData.inicio) : (window.Sheets ? window.Sheets.getData(page) : config.fallbackData[page] || []);
    const pageRenderer = map[page] || renderHome;
    pageRenderer(pageSheet || []);
  }

  window.Renderer = {
    renderPage,
    renderMediaItems: (items) => (items || []).map(renderMediaItem).filter(Boolean).join(''),
    getConfigValue,
    orderItems,
    escapeHtml,
    iconMarkup,
    cloudinaryUrl
  };
})();
