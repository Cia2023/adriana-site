document.addEventListener('DOMContentLoaded', async () => {
  const page = document.body.dataset.page || 'home';
  const loader = document.querySelector('.loader');
  const app = document.querySelector('#app');
  const contentKey = page === 'home' ? 'inicio' : page;
  const loaderStartedAt = performance.now();
  const minimumLoaderDuration = 550;

  function applySettings(data) {
    const settings = data.configuracoes || [];
    const value = (key, fallback = '') => settings.find((entry) =>
      String(entry.chave || '').toLowerCase() === key
    )?.valor || fallback;
    const projectName = value('nome_projeto', window.APP_CONFIG.projectName);
    const recipientName = value('nome_destinataria', window.APP_CONFIG.recipientName);
    const footerMessage = value('mensagem_rodape', 'Feito com carinho.');

    document.title = `${projectName} | ${recipientName}`;
    document.querySelectorAll('.brand').forEach((brand) => {
      brand.textContent = recipientName;
    });
    document.querySelectorAll('.site-footer p').forEach((footer) => {
      footer.replaceChildren(
        document.createTextNode(`${footerMessage} • `),
        Object.assign(document.createElement('span'), {
          textContent: String(new Date().getFullYear())
        })
      );
    });

    const primary = value('cor_primaria');
    const secondary = value('cor_secundaria');
    if (/^#[0-9a-f]{6}$/i.test(primary)) {
      document.documentElement.style.setProperty('--wine', primary.toLowerCase() === '#75213c' ? '#c2185b' : primary);
    }
    if (/^#[0-9a-f]{6}$/i.test(secondary)) {
      document.documentElement.style.setProperty('--rose', secondary.toLowerCase() === '#d42258' ? '#ff4081' : secondary);
    }
  }

  function render(data) {
    applySettings(data);
    window.Navigation.buildNav(data.menu || []);
    if (page === 'chat') {
      document.querySelector('#app').replaceChildren();
    } else {
      window.Renderer.renderPage(page, data[contentKey] || []);
    }
    window.Interactions.init();
    if (window.Collaboration) {
      window.Collaboration.init({ page });
    }

    const filterGroup = document.querySelector('[data-filter-group]');
    if (filterGroup) {
      filterGroup.addEventListener('click', (event) => {
        const button = event.target.closest('[data-filter]');
        if (!button) return;
        const filter = button.dataset.filter;

        document.querySelectorAll('.message-card').forEach((card) => {
          card.hidden = filter !== 'all' && card.dataset.category !== filter;
        });
        filterGroup.querySelectorAll('.chip').forEach((chip) => {
          chip.classList.toggle('active', chip === button);
        });
      });
    }

    const failures = window.Sheets.getFailures();
    const status = document.querySelector('#sheet-status');
    if (status) {
      status.hidden = failures.length === 0;
      status.querySelector('[data-status-message]').textContent = failures.length
        ? 'Algumas novidades não estão disponíveis neste momento.'
        : '';
    }
  }

  window.Navigation.buildNav(window.APP_CONFIG.fallbackData.menu || []);
  let data = await window.Sheets.loadAll();
  render(data);

  const refreshButton = document.querySelector('#refresh-content');
  if (refreshButton) {
    refreshButton.addEventListener('click', async () => {
      refreshButton.disabled = true;
      refreshButton.textContent = 'A atualizar…';
      data = await window.Sheets.loadAll(true);
      render(data);
      refreshButton.disabled = false;
      refreshButton.textContent = 'Tentar novamente';
    });
  }

  const root = window.getRelativeRoot ? window.getRelativeRoot() : './';
  document.querySelectorAll('a[href="index.html"], a[href="./index.html"], a[href="../index.html"]').forEach((link) => {
    link.href = `${root}index.html`;
  });

  const hideLoader = () => {
    if (loader) loader.classList.add('hidden');
  };
  const loaderTimeout = window.setTimeout(hideLoader, 8000);
  const remainingLoaderTime = Math.max(0, minimumLoaderDuration - (performance.now() - loaderStartedAt));
  window.setTimeout(() => {
    window.clearTimeout(loaderTimeout);
    hideLoader();
  }, remainingLoaderTime);
});
