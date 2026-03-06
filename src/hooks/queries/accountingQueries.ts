import { useQuery } from '@tanstack/react-query';
import { journalComptableService } from '../../service/accounting/journalComptableService';
import { journalCaisseService } from '../../service/accounting/journalCaisseService';
import { donateursService } from '../../service/accounting/donateursService';
import { balanceService } from '../../service/accounting/balanceService';
import { bilanService } from '../../service/accounting/bilanService';
import { compteResultatService } from '../../service/accounting/compteResultatService';
import { grandLivreService } from '../../service/accounting/grandLivreService';
import { accountingKeys } from '../../query/keys';

const matchesMonthPeriod = (value: string, period: string | null) => {
  if (!period || !/^\d{1,2}\/\d{4}$/.test(period)) return true;
  if (!value) return false;

  const toIso = (raw: string) => {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const [d, m, y] = raw.split('/');
      return `${y}-${m}-${d}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  };

  const iso = toIso(value);
  if (!iso) return false;
  const [year, month] = iso.split('-');
  return `${Number(month)}/${year}` === period;
};

export const useJournalQuery = (period: string | null, enabled = true) =>
  useQuery({
    queryKey: accountingKeys.journal(period),
    queryFn: async () => {
      const all = await journalComptableService.getEcritures(undefined);
      if (!period || !/^\d{1,2}\/\d{4}$/.test(period)) {
        return all;
      }
      return all.filter((entry) => entry.periode === period);
    },
    enabled
  });

export const useCaisseQuery = (period: string | null, enabled = true) =>
  useQuery({
    queryKey: accountingKeys.caisse(period),
    queryFn: async () => {
      const all = await journalCaisseService.getOperations(period);
      return all.filter((entry) => matchesMonthPeriod(entry.date, period));
    },
    enabled
  });

export const useDonateursQuery = (period: string | null, enabled = true) =>
  useQuery({
    queryKey: accountingKeys.donateurs(period),
    queryFn: async () => {
      const all = await donateursService.getDonateurs();
      if (!period || !/^\d{1,2}\/\d{4}$/.test(period)) {
        return all;
      }
      return all.filter((entry) => matchesMonthPeriod(entry.date, period));
    },
    enabled
  });

export const useBalanceQuery = (period: string | null, enabled = true) =>
  useQuery({
    queryKey: accountingKeys.balance(period),
    queryFn: () => balanceService.getBalance(period),
    enabled
  });

export const useBilanQuery = (period: string | null, enabled = true) =>
  useQuery({
    queryKey: accountingKeys.bilan(period),
    queryFn: () => bilanService.getBilan(period),
    enabled
  });

export const useResultatQuery = (period: string | null, enabled = true) =>
  useQuery({
    queryKey: accountingKeys.resultat(period),
    queryFn: () => compteResultatService.getCompteResultat(period),
    enabled
  });

export const useGrandLivreQuery = (period: string | null, enabled = true) =>
  useQuery({
    queryKey: accountingKeys.grandLivre(period),
    queryFn: () => grandLivreService.getGrandLivre(period || undefined),
    enabled
  });
