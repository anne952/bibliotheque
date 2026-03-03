export const normalizeImportKey = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '');
};

const pickDelimiter = (line: string) => {
  const candidates: Array<'\t' | ';' | ','> = ['\t', ';', ','];
  let best: '\t' | ';' | ',' = '\t';
  let bestScore = -1;

  candidates.forEach((candidate) => {
    const score = line.split(candidate).length;
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  });

  return best;
};

export const parseClipboardTable = (raw: string) => {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return [] as string[][];
  }

  const delimiter = pickDelimiter(lines[0]);
  return lines.map((line) => line.split(delimiter).map((cell) => cell.trim()));
};

export const parseImportNumber = (value: string, fallback = 0) => {
  const normalized = String(value || '')
    .replace(/\s/g, '')
    .replace(',', '.')
    .trim();

  if (!normalized) return fallback;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const parseImportBoolean = (value: string) => {
  const normalized = normalizeImportKey(value);
  return ['1', 'true', 'oui', 'yes', 'vrai'].includes(normalized);
};

export type HeaderIndex = Record<string, number>;

export const buildHeaderIndex = (headers: string[]): HeaderIndex => {
  return headers.reduce<HeaderIndex>((acc, header, index) => {
    acc[normalizeImportKey(header)] = index;
    return acc;
  }, {});
};

export const getImportCell = (
  row: string[],
  headerIndex: HeaderIndex | null,
  aliases: string[],
  fallbackIndex: number
) => {
  if (headerIndex) {
    for (const alias of aliases) {
      const idx = headerIndex[normalizeImportKey(alias)];
      if (typeof idx === 'number') {
        return row[idx] || '';
      }
    }
  }
  return row[fallbackIndex] || '';
};

export const hasHeaderAliases = (headers: string[], aliasesGroups: string[][]) => {
  const headerSet = new Set(headers.map(normalizeImportKey));
  return aliasesGroups.some((aliases) => aliases.some((alias) => headerSet.has(normalizeImportKey(alias))));
};
