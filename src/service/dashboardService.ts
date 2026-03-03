import { apiClient } from './apiClient';

const monthLabels = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];
type DashboardOverview = Record<string, any>;

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthBounds = (year: number, monthIndex: number) => {
  const from = new Date(year, monthIndex, 1);
  const to = new Date(year, monthIndex + 1, 0);
  return { from: toIsoDate(from), to: toIsoDate(to) };
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race<T>([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('Timeout API dashboard')), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
};

const readNumber = (...values: unknown[]) => {
  for (const value of values) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
};

const readDonationAmount = (overview: DashboardOverview) => {
  const kpis = overview?.kpis || {};
  const amounts = kpis?.amounts || {};
  const donations = kpis?.donations || {};
  const financial = donations?.financial || donations?.finance || {};
  const totals = overview?.totals || {};

  return readNumber(
    amounts?.financialDonationsIn,
    amounts?.financialDonations,
    amounts?.financialDonationsTotal,
    amounts?.donationsAmount,
    amounts?.donationsIn,
    amounts?.donationsTotal,
    amounts?.donationsSum,
    donations?.amount,
    donations?.total,
    donations?.sum,
    financial?.amount,
    financial?.total,
    financial?.sum,
    totals?.financialDonations,
    totals?.donations
  );
};

const readDonationsCount = (overview: DashboardOverview) => {
  const kpis = overview?.kpis || {};
  const transactions = kpis?.transactions || {};
  const donations = kpis?.donations || {};

  return readNumber(
    transactions?.donationsCount,
    transactions?.donationCount,
    transactions?.donations,
    donations?.count,
    donations?.totalCount
  );
};

const sumFinancialDonations = (donations: any[]) => {
  return donations.reduce((sum, item) => {
    const kind = String(item?.donationKind || item?.kind || '').toUpperCase();
    if (kind && kind !== 'FINANCIAL' && !kind.includes('FIN')) return sum;
    const amount = Number(item?.amount || item?.montant || 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
};

const fetchDonationsTotal = async (from?: string, to?: string) => {
  const query: Record<string, string> = { kind: 'FINANCIAL' };
  if (from) query.from = from;
  if (to) query.to = to;

  const result = await apiClient.request<any>('/transactions/donations', { query });
  const donations = Array.isArray(result)
    ? result
    : Array.isArray(result?.donations)
      ? result.donations
      : Array.isArray(result?.items)
        ? result.items
        : Array.isArray(result?.data)
          ? result.data
          : [];

  return sumFinancialDonations(donations);
};

const requestDashboardOverview = async (query?: Record<string, string | number | boolean>) => {
  try {
    return await withTimeout(
      apiClient.request<DashboardOverview>('/reports/dashboard/overview', {
        query
      }),
      12000
    );
  } catch {
    return withTimeout(
      apiClient.request<DashboardOverview>('/rapport/dashboard/overview', {
        query
      }),
      12000
    );
  }
};

const mapStatsFromOverview = (overview: DashboardOverview) => {
  const kpis = overview?.kpis || {};
  const transactions = kpis?.transactions || {};
  const amounts = kpis?.amounts || {};
  const people = kpis?.people || kpis?.persons || {};

  return {
    visiteurs: readNumber(
      people?.visitorsCount,
      people?.total,
      people?.totalVisitors,
      transactions?.visitorsCount,
      transactions?.visitsCount
    ),
    emprunts: readNumber(
      transactions?.loansCount,
      transactions?.borrowingsCount,
      transactions?.borrowedCount
    ),
    dons: readDonationAmount(overview),
    ventes: readNumber(
      transactions?.salesCount,
      transactions?.soldCount
    )
  };
};

export const dashboardService = {
  async getStats() {
    const overview = await requestDashboardOverview();
    const stats = mapStatsFromOverview(overview);
    if (stats.dons <= 0 && readDonationsCount(overview) > 0) {
      try {
        const fallbackTotal = await fetchDonationsTotal();
        return { ...stats, dons: fallbackTotal };
      } catch {
        return stats;
      }
    }
    return stats;
  },

  async getMonthlyStats(monthCount = 12) {
    const now = new Date();
    const months: Array<{ mois: string; year: number; monthIndex: number }> = [];

    for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      months.push({
        mois: monthLabels[date.getMonth()],
        year: date.getFullYear(),
        monthIndex: date.getMonth()
      });
    }

    const requests = months.map(async (month) => {
      const bounds = getMonthBounds(month.year, month.monthIndex);
      const overview = await requestDashboardOverview({
        from: bounds.from,
        to: bounds.to
      });
      const kpis = overview?.kpis || {};
      const transactions = kpis?.transactions || {};
      const amounts = kpis?.amounts || {};

      let dons = readDonationAmount(overview);
      if (dons <= 0 && readDonationsCount(overview) > 0) {
        try {
          dons = await fetchDonationsTotal(bounds.from, bounds.to);
        } catch {
          // keep current value
        }
      }

      return {
        mois: month.mois,
        livres: readNumber(
          transactions?.loansCount,
          transactions?.borrowingsCount,
          transactions?.borrowedCount
        ),
        dons
      };
    });

    return Promise.all(requests);
  }
};
