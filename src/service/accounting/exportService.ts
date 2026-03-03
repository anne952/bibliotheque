import { apiClient } from '../apiClient';
import { journalComptableService } from './journalComptableService';
import { journalCaisseService } from './journalCaisseService';
import { donateursService } from './donateursService';
import { balanceService } from './balanceService';
import { grandLivreService } from './grandLivreService';
import { bilanService } from './bilanService';
import { compteResultatService } from './compteResultatService';
import { resolveFiscalYearIdFromPeriod } from './fiscalYear';
import { stripSyncIdentifierSuffix } from './labelSanitizer';

const API_URL = import.meta.env.VITE_API_URL || 'https://bibliotheque-backend-1.onrender.com';

const DEFAULT_API_BASE_URL = `${API_URL}/api`;

export type ExportSection = 
  | 'all'
  | 'journal'
  | 'cash-journal'
  | 'donors'
  | 'general-ledger'
  | 'balance-sheet'
  | 'trial-balance'
  | 'income-statement';

const buildExportUrl = (endpoint: string, params: Record<string, string | undefined>): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  
  const queryString = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(v || '')}`)
    .join('&');
  
  return `${cleanBaseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
};

const generateClientSideExport = async (section: ExportSection, periode?: string | null, accountId?: string): Promise<Blob> => {
  const sanitizeExportText = (value: unknown) => {
    const cleaned = stripSyncIdentifierSuffix(value)
      .replace(/\s*[-–—,;]*\s*(?:id\s*source|source\s*id)\s*[:#-]\s*[a-z0-9_-]{4,}/gi, '')
      .replace(/\s*[-–—,;]*\s*libell[eé]\s*ligne\s*[:#-]\s*[^\n\r,;]+/gi, '')
      .trim();

    return cleaned;
  };

  // Simple CSV generation as fallback
  let csvContent = 'sep=,\n';

  if (['all', 'journal'].includes(section)) {
    const journal = await journalComptableService.getEcritures(periode || undefined);
    csvContent += 'JOURNAL COMPTABLE\n';
    csvContent += 'Date,Compte,Libelle,Debit,Credit,Piece,Journal,Valide\n';
    journal.forEach(entry => {
      csvContent += `"${sanitizeExportText(entry.date)}","${sanitizeExportText(entry.compte)}","${sanitizeExportText(entry.libelle)}",${entry.debit},${entry.credit},"${sanitizeExportText(entry.piece || '')}","${sanitizeExportText(entry.journal || '')}",${entry.valide ? 'OUI' : 'NON'}\n`;
    });
    csvContent += '\n';
  }

  if (['all', 'cash-journal'].includes(section)) {
    const caisse = await journalCaisseService.getOperations(periode);
    csvContent += 'JOURNAL DE CAISSE\n';
    csvContent += 'Date,Description,Reference,Entree,Sortie,Mode,Valide\n';
    caisse.forEach(entry => {
      csvContent += `"${sanitizeExportText(entry.date)}","${sanitizeExportText(entry.description)}","${sanitizeExportText(entry.reference)}",${entry.entree},${entry.sortie},"${sanitizeExportText(entry.mode || '')}",${entry.valide ? 'OUI' : 'NON'}\n`;
    });
    csvContent += '\n';
  }

  if (['all', 'donors'].includes(section)) {
    const donateurs = await donateursService.getDonateurs();
    csvContent += 'DONATEURS\n';
    csvContent += 'Nom,Type,Montant,Mode,Description,Date,Valide\n';
    donateurs.forEach(d => {
      csvContent += `"${sanitizeExportText(d.nom)}","${sanitizeExportText(d.type)}",${d.montant},"${sanitizeExportText(d.mode)}","${sanitizeExportText(d.description)}","${sanitizeExportText(d.date)}",${d.valide ? 'OUI' : 'NON'}\n`;
    });
    csvContent += '\n';
  }

  if (['all', 'trial-balance'].includes(section)) {
    const balance = await balanceService.getBalance(periode);
    csvContent += 'BALANCE GENERALE\n';
    csvContent += 'Compte,Intitule,Total Debit,Total Credit,Solde Debiteur,Solde Crediteur\n';
    balance.forEach(row => {
      csvContent += `"${sanitizeExportText(row.compte)}","${sanitizeExportText(row.intitule)}",${row.totalDebit},${row.totalCredit},${row.soldeDebiteur},${row.soldeCrediteur}\n`;
    });
    csvContent += '\n';
  }

  if (['all', 'general-ledger'].includes(section)) {
    const comptes = accountId ? [accountId] : [];
    const grandLivre = await grandLivreService.getGrandLivre(periode, comptes);
    csvContent += 'GRAND LIVRE\n';
    grandLivre.forEach(compte => {
      csvContent += `\nCompte: ${sanitizeExportText(compte.compte)} - ${sanitizeExportText(compte.intitule)}\n`;
      csvContent += `Solde Initial,${compte.soldeInitial}\n`;
      csvContent += 'Date,Libelle,Piece,Debit,Credit,Solde\n';
      compte.operations.forEach(op => {
        csvContent += `"${sanitizeExportText(op.date)}","${sanitizeExportText(op.libelle)}","${sanitizeExportText(op.piece)}",${op.debit},${op.credit},${op.solde}\n`;
      });
      csvContent += `Total Debit,${compte.totalDebit}\n`;
      csvContent += `Total Credit,${compte.totalCredit}\n`;
      csvContent += `Solde Final,${compte.soldeFinal}\n`;
    });
    csvContent += '\n';
  }

  if (['all', 'balance-sheet'].includes(section)) {
    const bilan = await bilanService.getBilan(periode);
    csvContent += 'BILAN\n';
    csvContent += 'ACTIF\n';
    csvContent += 'Immobilisations\n';
    bilan.actif.immobilisations.forEach(item => {
      csvContent += `"${sanitizeExportText(item.compte)}","${sanitizeExportText(item.libelle)}",${item.montant}\n`;
    });
    csvContent += 'Stocks\n';
    bilan.actif.stocks.forEach(item => {
      csvContent += `"${sanitizeExportText(item.compte)}","${sanitizeExportText(item.libelle)}",${item.montant}\n`;
    });
    csvContent += 'Tresorerie\n';
    bilan.actif.tresorerie.forEach(item => {
      csvContent += `"${sanitizeExportText(item.compte)}","${sanitizeExportText(item.libelle)}",${item.montant}\n`;
    });
    csvContent += '\nPASSIF\n';
    csvContent += 'Fonds Propres\n';
    bilan.passif.fondsPropres.forEach(item => {
      csvContent += `"${sanitizeExportText(item.compte)}","${sanitizeExportText(item.libelle)}",${item.montant}\n`;
    });
    csvContent += 'Dettes\n';
    bilan.passif.dettes.forEach(item => {
      csvContent += `"${sanitizeExportText(item.compte)}","${sanitizeExportText(item.libelle)}",${item.montant}\n`;
    });
    csvContent += '\n';
  }

  if (['all', 'income-statement'].includes(section)) {
    const compteResultat = await compteResultatService.getCompteResultat(periode);
    csvContent += 'COMPTE DE RESULTAT\n';
    csvContent += 'PRODUITS\n';
    compteResultat.produits.forEach(item => {
      csvContent += `"${sanitizeExportText(item.compte)}","${sanitizeExportText(item.libelle)}",${item.montant}\n`;
    });
    csvContent += 'CHARGES\n';
    compteResultat.charges.forEach(item => {
      csvContent += `"${sanitizeExportText(item.compte)}","${sanitizeExportText(item.libelle)}",${item.montant}\n`;
    });
    const resultat = await compteResultatService.calculerResultatNet(periode);
    csvContent += `\nRESULTAT NET,${resultat}\n`;
    csvContent += '\n';
  }

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};

export const exportService = {
  async exportToExcel(
    section: ExportSection = 'all',
    periode?: string | null,
    accountId?: string
  ): Promise<Blob> {
    const fiscalYearId = await resolveFiscalYearIdFromPeriod(periode);
    const requiresFiscalYear = ['all', 'general-ledger', 'balance-sheet', 'trial-balance', 'income-statement'].includes(section);

    if (requiresFiscalYear && !fiscalYearId) {
      throw new Error('Exercice comptable introuvable. Verifiez la configuration des exercices fiscaux.');
    }

    return generateClientSideExport(section, periode, accountId);
  },

  async downloadFile(blob: Blob, filename: string): Promise<void> {
    const isCsv = (blob.type || '').toLowerCase().includes('text/csv');
    const safeFilename = isCsv
      ? filename.replace(/\.xlsx$/i, '.csv')
      : filename;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

