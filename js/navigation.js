(function () {
  function resolveLink(value) {
    const target = String(value || '').trim();
    if (!target) return null;

    const isPage = window.location.pathname.includes('/pages/');
    const root = new URL(isPage ? '../' : './', window.location.href);
    try {
      const url = new URL(target, root);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
      return url.href;
    } catch (error) {
      return null;
    }
  }

  function pageKey(href) {
    const path = new URL(href).pathname;
    return path.split('/').pop().replace(/\.html$/, '').replace(/^index$/, 'home');
  }

  function itemPageKey(item) {
    const href = resolveLink(item.caminho || item.path || item.url || item.pagina);
    return href ? pageKey(href) : '';
  }

  function makeLink(item, activePage) {
    const href = resolveLink(item.caminho || item.path || item.url || item.pagina);
    const title = String(item.titulo || item.title || '').trim();
    if (!href || !title) return null;

    const link = document.createElement('a');
    const key = pageKey(href);
    link.href = href;
    link.className = 'nav-link' + (key === activePage ? ' active' : '');
    link.textContent = title;
    if (key === activePage) link.setAttribute('aria-current', 'page');
    return link;
  }

  function createMobileNavigation() {
    let nav = document.querySelector('#mobile-nav');
    let moreDialog = document.querySelector('#mobile-more-dialog');
    if (nav && moreDialog) return { nav, moreDialog };

    nav = document.createElement('nav');
    nav.id = 'mobile-nav';
    nav.className = 'mobile-nav';
    nav.setAttribute('aria-label', 'Navegação principal');

    moreDialog = document.createElement('dialog');
    moreDialog.id = 'mobile-more-dialog';
    moreDialog.className = 'mobile-more-dialog';
    moreDialog.setAttribute('aria-labelledby', 'mobile-more-title');
    moreDialog.innerHTML = `
      <div class="mobile-more-heading">
        <h2 id="mobile-more-title">Explorar</h2>
        <button type="button" class="mobile-more-close" aria-label="Fechar menu">×</button>
      </div>
      <div class="mobile-more-links"></div>
    `;
    moreDialog.querySelector('.mobile-more-close').addEventListener('click', () => moreDialog.close());
    moreDialog.addEventListener('click', (event) => {
      if (event.target === moreDialog) moreDialog.close();
    });
    document.body.append(nav, moreDialog);
    return { nav, moreDialog };
  }

  function buildMobileNavigation(items, activePage) {
    const { nav, moreDialog } = createMobileNavigation();
    const primaryKeys = ['home', 'galeria', 'biblioteca', 'convite'];
    const labels = {
      home: ['⌂', 'Início'],
      galeria: ['▧', 'Galeria'],
      biblioteca: ['▶', 'Biblioteca'],
      convite: ['♡', 'Convite']
    };
    const routeItems = items.slice();
    const libraryPath = window.APP_CONFIG.pageConfig.biblioteca;
    if (!routeItems.some((item) => itemPageKey(item) === 'biblioteca' && item.ativo !== false && String(item.ativo) !== 'false')) {
      routeItems.push({ titulo: 'Biblioteca', caminho: libraryPath });
    }

    nav.replaceChildren();
    primaryKeys.forEach((key) => {
      const item = routeItems.find((entry) => {
        return entry.ativo !== false && String(entry.ativo) !== 'false' && itemPageKey(entry) === key;
      }) || (key === 'home' ? { titulo: 'Início', caminho: window.APP_CONFIG.pageConfig.home } : null);
      const link = item && makeLink(item, activePage);
      if (!link) return;
      link.classList.add('mobile-nav-link');
      link.innerHTML = `<span class="mobile-nav-icon" aria-hidden="true">${labels[key][0]}</span><span>${labels[key][1]}</span>`;
      nav.appendChild(link);
    });

    const moreButton = document.createElement('button');
    moreButton.type = 'button';
    moreButton.className = 'mobile-nav-link mobile-nav-more';
    moreButton.setAttribute('aria-haspopup', 'dialog');
    moreButton.setAttribute('aria-controls', moreDialog.id);
    moreButton.innerHTML = '<span class="mobile-nav-icon" aria-hidden="true">•••</span><span>Mais</span>';
    moreButton.addEventListener('click', () => moreDialog.showModal());
    nav.appendChild(moreButton);

    const moreLinks = moreDialog.querySelector('.mobile-more-links');
    moreLinks.replaceChildren();
    const included = new Set(primaryKeys);
    routeItems
      .filter((item) => item.ativo !== false && String(item.ativo) !== 'false')
      .sort((a, b) => Number(a.ordem || 999) - Number(b.ordem || 999))
      .forEach((item) => {
        const href = resolveLink(item.caminho || item.path || item.url || item.pagina);
        if (!href || included.has(pageKey(href))) return;
        const link = makeLink(item, activePage);
        if (link) {
          link.classList.add('mobile-more-link');
          moreLinks.appendChild(link);
        }
      });

    const chat = makeLink({
      titulo: 'Chat privado',
      caminho: 'pages/chat.html'
    }, activePage);
    if (chat) {
      chat.classList.add('mobile-more-link');
      moreLinks.appendChild(chat);
    }
  }

  function buildNav(items) {
    const nav = document.querySelector('#site-nav');
    if (!nav) return;

    const activePage = document.body.dataset.page || 'home';
    const routes = items.slice();
    if (!routes.some((item) => itemPageKey(item) === 'biblioteca' && item.ativo !== false && String(item.ativo) !== 'false')) {
      routes.push({ titulo: 'Biblioteca', caminho: window.APP_CONFIG.pageConfig.biblioteca });
    }

    nav.replaceChildren();
    routes
      .filter((item) => item.ativo !== false && String(item.ativo) !== 'false')
      .sort((a, b) => Number(a.ordem || 999) - Number(b.ordem || 999))
      .forEach((item) => {
        const link = makeLink(item, activePage);
        if (link) nav.appendChild(link);
      });

    const privateChat = makeLink({ titulo: 'Chat privado', caminho: 'pages/chat.html' }, activePage);
    if (privateChat) nav.appendChild(privateChat);
    buildMobileNavigation(routes, activePage);
  }

  window.Navigation = {
    buildNav,
    resolveLink
  };
})();
