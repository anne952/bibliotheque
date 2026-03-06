export const accountingKeys = {
  all: ['accounting'] as const,
  journal: (period: string | null) => [...accountingKeys.all, 'journal', period ?? 'all'] as const,
  caisse: (period: string | null) => [...accountingKeys.all, 'caisse', period ?? 'all'] as const,
  donateurs: (period: string | null) => [...accountingKeys.all, 'donateurs', period ?? 'all'] as const,
  balance: (period: string | null) => [...accountingKeys.all, 'balance', period ?? 'all'] as const,
  bilan: (period: string | null) => [...accountingKeys.all, 'bilan', period ?? 'all'] as const,
  resultat: (period: string | null) => [...accountingKeys.all, 'resultat', period ?? 'all'] as const,
  grandLivre: (period: string | null) => [...accountingKeys.all, 'grandLivre', period ?? 'all'] as const
};

export const materialsKeys = {
  all: ['materials'] as const,
  list: (filters?: Record<string, unknown>) => [...materialsKeys.all, 'list', filters ?? {}] as const
};

export const libraryKeys = {
  all: ['library'] as const,
  data: ['library', 'data'] as const,
  booksCatalog: ['library', 'booksCatalog'] as const
};

export const reportsKeys = {
  all: ['reports'] as const,
  list: ['reports', 'list'] as const
};

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (period?: string | null) => [...dashboardKeys.all, 'stats', period ?? 'default'] as const,
  monthly: (monthCount: number) => [...dashboardKeys.all, 'monthly', monthCount] as const
};

export const settingsKeys = {
  all: ['settings'] as const,
  companyProfile: ['settings', 'companyProfile'] as const
};

export const authKeys = {
  all: ['auth'] as const,
  profile: ['auth', 'profile'] as const
};
