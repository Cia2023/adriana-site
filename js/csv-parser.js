(function () {
  function parseCsv(text) {
    if (!text || !text.trim()) return [];

    const rows = [];
    let current = '';
    let row = [];
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current);
        current = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') i += 1;
        row.push(current);
        if (row.some((cell) => cell !== '')) {
          rows.push(row);
        }
        row = [];
        current = '';
      } else {
        current += char;
      }
    }

    if (current.length > 0 || row.length > 0) {
      row.push(current);
      if (row.some((cell) => cell !== '')) {
        rows.push(row);
      }
    }

    if (rows.length < 2) return [];

    const headers = rows[0].map((header) => normalizeHeader(header));
    return rows.slice(1).filter((line) => line.some((value) => value && value.trim() !== '')).map((line) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = (line[index] || '').trim();
      });
      return obj;
    });
  }

  function normalizeHeader(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function sortByOrder(items) {
    return [...items].sort((a, b) => {
      const aOrder = Number.parseInt(a.ordem || a.order || 9999, 10);
      const bOrder = Number.parseInt(b.ordem || b.order || 9999, 10);
      return aOrder - bOrder;
    });
  }

  window.CSVParser = {
    parseCsv,
    normalizeHeader,
    sortByOrder
  };
})();
