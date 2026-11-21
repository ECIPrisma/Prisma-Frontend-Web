/**
 * Utilidades para exportación de datos a formatos compatibles con Excel / ERPs (CSV con BOM UTF-8).
 */

export function exportToCsv(filename, headers, rows) {
  if (!rows || !rows.length) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  // BOM para que Microsoft Excel en español reconozca caracteres especiales y tildes
  const BOM = '\uFEFF';
  
  const headerLine = headers.map(h => `"${(h.label || h.key || h).replace(/"/g, '""')}"`).join(';');
  
  const bodyLines = rows.map(row => {
    return headers.map(h => {
      const val = typeof h.accessor === 'function' ? h.accessor(row) : row[h.key];
      const strVal = val !== undefined && val !== null ? String(val) : '';
      return `"${strVal.replace(/"/g, '""')}"`;
    }).join(';');
  });

  const csvContent = BOM + [headerLine, ...bodyLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
