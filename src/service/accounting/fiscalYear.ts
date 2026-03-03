import { apiClient } from '../apiClient';

type FiscalYearRecord = {
  id: string;
  year?: number;
  startDate?: string;
  endDate?: string;
  isClosed?: boolean;
};

let fiscalYearsCache: FiscalYearRecord[] | null = null;
let fiscalYearsPromise: Promise<FiscalYearRecord[]> | null = null;
let setupPromise: Promise<void> | null = null;

const FISCAL_YEAR_ENDPOINTS = [
  '/accounting/fiscal-years',
  '/comptabilite/fiscal-years',
  '/fiscal-years'
];

const normalizeFiscalYear = (raw: any): FiscalYearRecord | null => {
  const id = String(raw?.id || raw?.fiscalYearId || '').trim();
  if (!id) return null;

  const explicitYear = Number(raw?.year || raw?.fiscalYear || raw?.exerciseYear);
  const startDate = String(raw?.startDate || raw?.from || raw?.start || '').trim() || undefined;
  const endDate = String(raw?.endDate || raw?.to || raw?.end || '').trim() || undefined;
  const yearFromStart = startDate ? Number(startDate.slice(0, 4)) : NaN;
  const year = !Number.isNaN(explicitYear) ? explicitYear : !Number.isNaN(yearFromStart) ? yearFromStart : undefined;

  return {
    id,
    year,
    startDate,
    endDate,
    isClosed: Boolean(raw?.isClosed ?? raw?.closed ?? false)
  };
};

const parseFiscalYearList = (payload: any): FiscalYearRecord[] => {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

  return source
    .map(normalizeFiscalYear)
    .filter((item): item is FiscalYearRecord => item !== null);
};

const extractYearFromPeriod = (period?: string | null): number | undefined => {
  if (!period) return undefined;
  const value = String(period).trim();

  if (/^\d{4}$/.test(value)) {
    return Number(value);
  }

  if (/^\d{1,2}\/\d{4}$/.test(value)) {
    const [, year] = value.split('/');
    return Number(year);
  }

  return undefined;
};

const looksLikeFiscalYearId = (value: string) => {
  return /^fy[_-]/i.test(value) || /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value);
};

const fetchFiscalYears = async (): Promise<FiscalYearRecord[]> => {
  if (fiscalYearsCache) return fiscalYearsCache;
  if (fiscalYearsPromise) return fiscalYearsPromise;

  fiscalYearsPromise = (async () => {
    for (const endpoint of FISCAL_YEAR_ENDPOINTS) {
      try {
        const data = await apiClient.request<any>(endpoint);
        const parsed = parseFiscalYearList(data);
        if (parsed.length > 0) {
          fiscalYearsCache = parsed;
          return parsed;
        }
      } catch {
        // try next endpoint
      }

      try {
        const data = await apiClient.request<any>(endpoint, { target: 'render' });
        const parsed = parseFiscalYearList(data);
        if (parsed.length > 0) {
          fiscalYearsCache = parsed;
          return parsed;
        }
      } catch {
        // try next endpoint
      }
    }

    fiscalYearsCache = [];
    return [];
  })().finally(() => {
    fiscalYearsPromise = null;
  });

  return fiscalYearsPromise;
};

const inferFiscalYearFromEntries = async (targetYear?: number): Promise<string | undefined> => {
  const collectFromPayload = (data: any) => {
    const entries = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
          ? data.data
          : [];

    return entries
      .map((entry: any) => {
        const id = String(entry?.fiscalYearId || entry?.fiscalYear?.id || '').trim();
        const date = String(entry?.date || entry?.createdAt || '').trim();
        const year = /^\d{4}/.test(date) ? Number(date.slice(0, 4)) : undefined;
        return { id, year };
      })
      .filter((entry: { id: string; year?: number }) => entry.id.length > 0);
  };

  for (const target of ['default', 'render'] as const) {
    try {
      const data = await apiClient.request<any>('/accounting/entries', {
        ...(target === 'render' ? { target: 'render' } : {})
      });
      const withFiscal = collectFromPayload(data);

      if (withFiscal.length === 0) continue;

      if (targetYear !== undefined) {
        const sameYear = withFiscal.find((entry: { id: string; year?: number }) => entry.year === targetYear);
        if (sameYear) return sameYear.id;
      }

      return withFiscal[0].id;
    } catch {
      // try next target
    }
  }

  return undefined;
};

const runAccountingSetup = async () => {
  if (setupPromise) return setupPromise;

  setupPromise = (async () => {
    const tries: Array<Parameters<typeof apiClient.request>[1]> = [
      { method: 'POST', auth: false },
      { method: 'POST', auth: false, target: 'render' }
    ];

    for (const options of tries) {
      try {
        await apiClient.request('/init/setup', options);
      } catch {
        // best effort on both targets
      }
    }

    clearFiscalYearsCache();
    await fetchFiscalYears();
  })().finally(() => {
    setupPromise = null;
  });

  return setupPromise;
};

export const getFiscalYearIdFromPeriod = (period?: string | null): string | undefined => {
  if (!period) return undefined;
  const value = String(period).trim();

  if (looksLikeFiscalYearId(value)) {
    return value;
  }

  const year = extractYearFromPeriod(value);
  return year ? String(year) : undefined;
};

export const resolveFiscalYearIdFromPeriod = async (period?: string | null): Promise<string | undefined> => {
  const raw = period ? String(period).trim() : '';
  if (raw && looksLikeFiscalYearId(raw)) {
    return raw;
  }

  const years = await fetchFiscalYears();
  const targetYear = extractYearFromPeriod(period);

  if (targetYear !== undefined && years.length > 0) {
    const exact = years.find((item) => item.year === targetYear);
    if (exact) return exact.id;
  }

  if (years.length > 0) {
    const currentYear = new Date().getFullYear();
    const openCurrent = years.find((item) => !item.isClosed && item.year === currentYear);
    if (openCurrent) return openCurrent.id;

    const openLatest = [...years]
      .filter((item) => !item.isClosed)
      .sort((a, b) => Number(b.year || 0) - Number(a.year || 0))[0];
    if (openLatest) return openLatest.id;

    const latest = [...years].sort((a, b) => Number(b.year || 0) - Number(a.year || 0))[0];
    if (latest) return latest.id;
  }

  await runAccountingSetup();
  const yearsAfterSetup = await fetchFiscalYears();
  if (yearsAfterSetup.length > 0) {
    const targetYearAfterSetup = extractYearFromPeriod(period);

    if (targetYearAfterSetup !== undefined) {
      const exact = yearsAfterSetup.find((item) => item.year === targetYearAfterSetup && !item.isClosed)
        || yearsAfterSetup.find((item) => item.year === targetYearAfterSetup);
      if (exact) return exact.id;
    }

    const openCurrent = yearsAfterSetup.find((item) => !item.isClosed && item.year === new Date().getFullYear());
    if (openCurrent) return openCurrent.id;

    const openLatest = [...yearsAfterSetup]
      .filter((item) => !item.isClosed)
      .sort((a, b) => Number(b.year || 0) - Number(a.year || 0))[0];
    if (openLatest) return openLatest.id;

    return [...yearsAfterSetup].sort((a, b) => Number(b.year || 0) - Number(a.year || 0))[0]?.id;
  }

  const inferred = await inferFiscalYearFromEntries(targetYear);
  if (inferred) return inferred;

  // Fallback legacy: some backends accept year as fiscalYearId.
  return getFiscalYearIdFromPeriod(period);
};

export const clearFiscalYearsCache = () => {
  fiscalYearsCache = null;
};
