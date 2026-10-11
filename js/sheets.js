(function () {
  const config = window.APP_CONFIG;
  const parser = window.CSVParser;
  const store = {};
  const lastLoaded = {};
  const failures = new Set();

  function normalizeBoolean(value) {
    if (typeof value === 'boolean') return value;
    const normalized = String(value || '').trim().toLowerCase();
    return ['1', 'true', 'yes', 'sim', 'ativo', 'active'].includes(normalized);
  }

  function normalizeRows(data) {
    return (data || []).map((item) => {
      const normalized = { ...item };
      Object.keys(normalized).forEach((key) => {
        if (typeof normalized[key] === 'string') {
          normalized[key] = normalized[key].replace(/\r/g, '').trim();
        }
      });
      if ('ativo' in normalized) normalized.ativo = normalizeBoolean(normalized.ativo);
      if ('destaque' in normalized) normalized.destaque = normalizeBoolean(normalized.destaque);
      return normalized;
    });
  }

  async function fetchSheet(sheetKey, force = false) {
    const url = config.csvUrls[sheetKey];
    const refreshInterval = Math.max(
      0,
      Number.parseInt(getConfigValue('intervalo_atualizacao', config.refreshIntervalMs), 10) ||
        config.refreshIntervalMs
    );

    if (!force && store[sheetKey] && Date.now() - (lastLoaded[sheetKey] || 0) < refreshInterval) {
      return store[sheetKey];
    }

    if (!url) {
      failures.delete(sheetKey);
      store[sheetKey] = normalizeRows(config.fallbackData[sheetKey] || []);
      lastLoaded[sheetKey] = Date.now();
      return store[sheetKey];
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Falha ao carregar a aba ${sheetKey}: HTTP ${response.status}`);
      }

      const parsed = parser.parseCsv(await response.text());
      if (!parsed.length) {
        throw new Error(`A aba ${sheetKey} não contém linhas de dados válidas.`);
      }

      store[sheetKey] = normalizeRows(parsed);
      lastLoaded[sheetKey] = Date.now();
      failures.delete(sheetKey);
      return store[sheetKey];
    } catch (error) {
      console.error(error);
      failures.add(sheetKey);
      store[sheetKey] = normalizeRows(config.fallbackData[sheetKey] || []);
      lastLoaded[sheetKey] = Date.now();
      return store[sheetKey];
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function getConfigValue(key, fallback = '') {
    const rows = store.configuracoes || config.fallbackData.configuracoes || [];
    const item = rows.find((entry) => String(entry.chave || '').toLowerCase() === String(key).toLowerCase());
    return item ? item.valor : fallback;
  }

  async function loadAll(force = false) {
    const entries = Object.keys(config.csvUrls);
    const values = await Promise.all(entries.map((key) => fetchSheet(key, force)));
    return Object.fromEntries(entries.map((key, index) => [key, values[index]]));
  }

  function getData(sheetKey) {
    return store[sheetKey] || normalizeRows(config.fallbackData[sheetKey] || []);
  }

  function getFailures() {
    return [...failures];
  }

  window.Sheets = {
    fetchSheet,
    loadAll,
    getData,
    getFailures,
    getConfigValue,
    normalizeBoolean
  };
})();
