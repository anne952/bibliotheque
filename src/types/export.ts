export const exportToCSV = (data: Record<string, unknown>[], filename: string): void => {
  if (!Array.isArray(data) || data.length === 0) {
    return;
  }

  const headers = Array.from(
    data.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );

  const escapeValue = (value: unknown) => {
    const raw = value === null || value === undefined ? '' : String(value);
    const escaped = raw.replace(/"/g, '""');
    return /[";\n]/.test(escaped) ? `"${escaped}"` : escaped;
  };

  const lines = [
    headers.join(';'),
    ...data.map((row) => headers.map((header) => escapeValue((row as Record<string, unknown>)[header])).join(';'))
  ];

  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPDF = (elementId: string, filename: string): void => {
  const target = document.getElementById(elementId);
  if (!target) {
    throw new Error(`Element introuvable: ${elementId}`);
  }

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${filename}</title></head><body>${target.outerHTML}</body></html>`;
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=800');
  if (!printWindow) {
    throw new Error('Ouverture de la fenetre d\'impression bloquee');
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
