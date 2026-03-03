import { useEffect, useMemo, useState } from 'react';
import { FiX, FiPlus, FiSearch, FiDownload, FiClipboard } from 'react-icons/fi';
import JournalComptable from './JournalComptable';
import JournalCaisse from './JournalCaisse';
import Donateurs from './Donateurs';
import Bilan from './Bilan';
import CompteResultat from './CompteResultat';
import Balance from './Balance';
import GrandLivre from './GrandLivre';
import SoldeJournalierChart from './SoldeJournalierChart';
import AccountingEntryForm from './AccountingEntryForm';
import type { AccountingModule, AccountingPeriod } from './types';
import { journalComptableService } from '../../service/accounting/journalComptableService';
import { journalCaisseService } from '../../service/accounting/journalCaisseService';
import { donateursService } from '../../service/accounting/donateursService';
import { resolveFiscalYearIdFromPeriod } from '../../service/accounting/fiscalYear';
import { exportService, type ExportSection } from '../../service/accounting/exportService';
import { deletionService, isDeletionBackendMissingError } from '../../service/deletionService';
import { dataSyncService } from '../../service/dataSyncService';
import PasteImportModal from '../common/PasteImportModal';
import { normalizeImportKey, parseClipboardTable, parseImportNumber } from '../../utils/pasteImport';
import { apiClient } from '../../service/apiClient';

interface AccountingPanelProps {
  module: AccountingModule;
  onClose: () => void;
}

interface JournalEntry {
  id?: string;
  date: string;
  compte: string;
  libelle: string;
  debit: number;
  credit: number;
  piece?: string;
  journal?: string;
  periode?: string;
  valide?: boolean;
}

interface CaisseEntry {
  id?: string;
  date: string;
  description: string;
  reference: string;
  entree: number;
  sortie: number;
  mode?: string;
  valide?: boolean;
}

interface DonateurRow {
  id?: string;
  nom: string;
  type: 'Physique' | 'Moral';
  montant: number;
  mode: string;
  description: string;
  date: string;
  valide?: boolean;
}

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

const AccountingPanel = ({ module, onClose }: AccountingPanelProps) => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [showJournalChart, setShowJournalChart] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [caisseEntries, setCaisseEntries] = useState<CaisseEntry[]>([]);
  const [donateurs, setDonateurs] = useState<DonateurRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [validatingAll, setValidatingAll] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    let nextPeriods: AccountingPeriod[] = [];

    if (['journal', 'caisse', 'donateurs', 'balance', 'grandlivre'].includes(module.id)) {
      const months = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
      nextPeriods = months.map((m, i) => ({
        id: i + 1,
        label: `${m} ${currentYear}`,
        value: `${i + 1}/${currentYear}`
      }));
    } else if (['bilan', 'resultat'].includes(module.id)) {
      nextPeriods = [
        { id: currentYear, label: `Exercice ${currentYear}`, value: String(currentYear) },
        { id: currentYear - 1, label: `Exercice ${currentYear - 1}`, value: String(currentYear - 1) }
      ];
    } else {
      nextPeriods = [
        { id: 1, label: "Aujourd'hui", value: 'today' },
        { id: 2, label: 'Cette semaine', value: 'week' },
        { id: 3, label: 'Ce mois', value: 'month' }
      ];
    }

    setPeriods(nextPeriods);
    setSelectedPeriod(nextPeriods[0]?.value ?? null);
    setShowJournalChart(false);
    setShowDownloadModal(false);
    setEditingIndex(null);
    setApiError(null);
  }, [module]);

  useEffect(() => {
    const loadData = async () => {
      setApiError(null);

      try {
        setLoadingData(true);

        if (module.id === 'journal') {
          const all = await dataSyncService.getJournalEntries();
          const data = (selectedPeriod && /^\d{1,2}\/\d{4}$/.test(selectedPeriod))
            ? all.filter((entry) => entry.periode === selectedPeriod)
            : all;
          setJournalEntries(deletionService.applyRestorePosition('comptabilite-journal', data));
        }

        if (module.id === 'caisse') {
          const all = await dataSyncService.getCaisseEntries();
          const data = all.filter((entry) => matchesMonthPeriod(entry.date, selectedPeriod));
          setCaisseEntries(deletionService.applyRestorePosition('comptabilite-caisse', data));
        }

        if (module.id === 'donateurs') {
          const data = await dataSyncService.getDonateurs();
          setDonateurs(deletionService.applyRestorePosition('comptabilite-donateur', data));
        }
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Erreur de chargement API');
      } finally {
        setLoadingData(false);
      }
    };

    if (['journal', 'caisse', 'donateurs'].includes(module.id)) {
      void loadData();
    }
  }, [module.id, selectedPeriod]);

  const handleOpenCreateForm = () => {
    setEditingIndex(null);
    setShowForm(true);
  };

  const handleOpenEditForm = (index: number) => {
    if (index < 0) {
      return;
    }
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDeleteEntry = async (index: number) => {
    if (index < 0) {
      return;
    }

    if (!window.confirm('Voulez-vous vraiment supprimer cette ligne ?')) {
      return;
    }

    if (module.id === 'journal') {
      const target = journalEntries[index];
      if (!target?.id) {
        return;
      }

      try {
        await journalComptableService.supprimerEcriture(target.id);
        const all = await dataSyncService.getJournalEntries();
        const nextAll = all.filter((entry) => entry.id !== target.id);
        dataSyncService.setJournalEntries(nextAll);
        setJournalEntries((prev) => prev.filter((_, i) => i !== index));
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Suppression impossible');
        return;
      }

      try {
        await deletionService.recordDeletion({
          sourceId: target.id,
          name: target.libelle || `Ecriture ${target.date}`,
          type: 'comptabilite-journal',
          originalIndex: index
        });
      } catch (error) {
        if (isDeletionBackendMissingError(error)) {
          setApiError('Suppression effectuee. Logique backend manquante: suppression recente indisponible.');
        } else {
          setApiError(error instanceof Error ? error.message : 'Journalisation de suppression impossible');
        }
      }
      return;
    }

    if (module.id === 'caisse') {
      const target = caisseEntries[index];
      if (!target?.id) {
        return;
      }

      try {
        await journalCaisseService.supprimerOperation(target.id);
        const all = await dataSyncService.getCaisseEntries();
        const nextAll = all.filter((entry) => entry.id !== target.id);
        dataSyncService.setCaisseEntries(nextAll);
        setCaisseEntries((prev) => prev.filter((_, i) => i !== index));
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Suppression impossible');
        return;
      }

      try {
        await deletionService.recordDeletion({
          sourceId: target.id,
          name: target.description || `Operation caisse ${target.date}`,
          type: 'comptabilite-caisse',
          originalIndex: index
        });
      } catch (error) {
        if (isDeletionBackendMissingError(error)) {
          setApiError('Suppression effectuee. Logique backend manquante: suppression recente indisponible.');
        } else {
          setApiError(error instanceof Error ? error.message : 'Journalisation de suppression impossible');
        }
      }
      return;
    }

    if (module.id === 'donateurs') {
      const target = donateurs[index];
      if (!target?.id) {
        return;
      }

      try {
        await donateursService.supprimerDonateur(target.id);
        const all = await dataSyncService.getDonateurs();
        const nextAll = all.filter((entry) => entry.id !== target.id);
        dataSyncService.setDonateurs(nextAll);
        setDonateurs((prev) => prev.filter((_, i) => i !== index));
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Suppression impossible');
        return;
      }

      try {
        await deletionService.recordDeletion({
          sourceId: target.id,
          name: target.nom || `Donateur ${target.date}`,
          type: 'comptabilite-donateur',
          originalIndex: index
        });
      } catch (error) {
        if (isDeletionBackendMissingError(error)) {
          setApiError('Suppression effectuee. Logique backend manquante: suppression recente indisponible.');
        } else {
          setApiError(error instanceof Error ? error.message : 'Journalisation de suppression impossible');
        }
      }
    }
  };

  const handleFormSubmit = async (payload: unknown) => {
    setApiError(null);

    if (module.id === 'journal') {
      const data = payload as {
        date: string;
        compte: string;
        libelle: string;
        debit: string;
        credit: string;
        piece?: string;
        journal?: string;
        compteContrepartieExplicite?: string;
      };
      const nextEntry = {
        date: data.date,
        compte: data.compte,
        libelle: data.libelle,
        debit: Number(data.debit || 0),
        credit: Number(data.credit || 0),
        piece: data.piece,
        journal: data.journal,
        compteContrepartieExplicite: data.compteContrepartieExplicite,
        periode: selectedPeriod || undefined
      };

      try {
        if (editingIndex !== null && journalEntries[editingIndex]?.id) {
          const updated = await journalComptableService.modifierEcriture(journalEntries[editingIndex].id as string, nextEntry);
          const all = await dataSyncService.getJournalEntries();
          dataSyncService.setJournalEntries(all.map((item) => (item.id === updated.id ? updated : item)));
          setJournalEntries((prev) => prev.map((item, idx) => (idx === editingIndex ? updated : item)));
        } else {
          const created = await journalComptableService.ajouterEcriture(nextEntry);
          const all = await dataSyncService.getJournalEntries();
          dataSyncService.setJournalEntries([...all, created]);
          setJournalEntries((prev) => [...prev, created]);
        }
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Enregistrement impossible');
        return;
      }
    }

    if (module.id === 'caisse') {
      const data = payload as { date: string; description: string; reference: string; entree: string; sortie: string; mode?: string };
      const nextEntry = {
        date: data.date,
        description: data.description,
        reference: data.reference,
        entree: Number(data.entree || 0),
        sortie: Number(data.sortie || 0),
        mode: data.mode,
        periode: selectedPeriod || undefined
      };

      try {
        if (editingIndex !== null && caisseEntries[editingIndex]?.id) {
          const updated = await journalCaisseService.modifierOperation(caisseEntries[editingIndex].id as string, nextEntry);
          const all = await dataSyncService.getCaisseEntries();
          dataSyncService.setCaisseEntries(all.map((item) => (item.id === updated.id ? updated : item)));
          setCaisseEntries((prev) => prev.map((item, idx) => (idx === editingIndex ? updated : item)));
        } else {
          const created = await journalCaisseService.ajouterOperation(nextEntry);
          const all = await dataSyncService.getCaisseEntries();
          dataSyncService.setCaisseEntries([...all, created]);
          setCaisseEntries((prev) => [...prev, created]);
        }
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Enregistrement impossible');
        return;
      }
    }

    if (module.id === 'donateurs') {
      const data = payload as { nom: string; type: 'Physique' | 'Moral'; montant: string; mode: string; description: string; date: string };
      const nextEntry = {
        nom: data.nom,
        type: data.type,
        montant: Number(data.montant || 0),
        mode: data.mode,
        description: data.description,
        date: data.date
      };

      try {
        if (editingIndex !== null && donateurs[editingIndex]?.id) {
          const updated = await donateursService.modifierDonateur(donateurs[editingIndex].id as string, nextEntry);
          const all = await dataSyncService.getDonateurs();
          dataSyncService.setDonateurs(all.map((item) => (item.id === updated.id ? updated : item)));
          setDonateurs((prev) => prev.map((item, idx) => (idx === editingIndex ? updated : item)));
        } else {
          const created = await donateursService.ajouterDonateur(nextEntry);
          const all = await dataSyncService.getDonateurs();
          dataSyncService.setDonateurs([...all, created]);
          setDonateurs((prev) => [...prev, created]);
        }
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Enregistrement impossible');
        return;
      }
    }

    setEditingIndex(null);
    setShowForm(false);
  };

  const handleValidateEntry = async (index: number) => {
    if (index < 0) {
      return;
    }

    setApiError(null);

    if (module.id === 'journal') {
      const target = journalEntries[index];
      if (!target?.id || target.valide) {
        return;
      }

      try {
        const validated = await journalComptableService.validerEcriture(target.id);
        const all = await dataSyncService.getJournalEntries();
        dataSyncService.setJournalEntries(all.map((item) => (item.id === validated.id ? validated : item)));
        setJournalEntries((prev) => prev.map((item, i) => (i === index ? validated : item)));
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Validation impossible');
      }
      return;
    }

    if (module.id === 'caisse') {
      const target = caisseEntries[index];
      if (!target?.id || target.valide) {
        return;
      }

      try {
        const validated = await journalCaisseService.validerOperation(target.id);
        const all = await dataSyncService.getCaisseEntries();
        dataSyncService.setCaisseEntries(all.map((item) => (item.id === validated.id ? validated : item)));
        setCaisseEntries((prev) => prev.map((item, i) => (i === index ? validated : item)));
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Validation impossible');
      }
      return;
    }

    if (module.id === 'donateurs') {
      const target = donateurs[index];
      if (!target?.id || target.valide) {
        return;
      }

      try {
        const validated = await donateursService.validerDonateur(target.id);
        const all = await dataSyncService.getDonateurs();
        dataSyncService.setDonateurs(all.map((item) => (item.id === validated.id ? { ...item, ...validated } : item)));
        setDonateurs((prev) => prev.map((item, i) => (i === index ? { ...item, ...validated } : item)));
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Validation impossible');
      }
    }
  };

  const handleValidateAllEntries = async () => {
    setApiError(null);
    setValidatingAll(true);

    try {
      if (module.id === 'journal') {
        const targets = journalEntries.filter((entry) => entry.id && !entry.valide);
        if (targets.length === 0) {
          return;
        }

        const validatedEntries = await Promise.all(targets.map((entry) => journalComptableService.validerEcriture(entry.id as string)));
        const validatedById = new Map(validatedEntries.map((entry) => [entry.id, entry]));
        const all = await dataSyncService.getJournalEntries();
        const nextAll = all.map((entry) => validatedById.get(entry.id) ?? entry);
        dataSyncService.setJournalEntries(nextAll);
        setJournalEntries((prev) => prev.map((entry) => validatedById.get(entry.id) ?? entry));
        return;
      }

      if (module.id === 'caisse') {
        const targets = caisseEntries.filter((entry) => entry.id && !entry.valide);
        if (targets.length === 0) {
          return;
        }

        const validatedEntries = await Promise.all(targets.map((entry) => journalCaisseService.validerOperation(entry.id as string)));
        const validatedById = new Map(validatedEntries.map((entry) => [entry.id, entry]));
        const all = await dataSyncService.getCaisseEntries();
        const nextAll = all.map((entry) => validatedById.get(entry.id) ?? entry);
        dataSyncService.setCaisseEntries(nextAll);
        setCaisseEntries((prev) => prev.map((entry) => validatedById.get(entry.id) ?? entry));
        return;
      }

      if (module.id === 'donateurs') {
        const targets = donateurs.filter((entry) => entry.id && !entry.valide);
        if (targets.length === 0) {
          return;
        }

        const validatedEntries = await Promise.all(targets.map((entry) => donateursService.validerDonateur(entry.id as string)));
        const validatedById = new Map(validatedEntries.map((entry) => [entry.id, entry]));
        const all = await dataSyncService.getDonateurs();
        const nextAll = all.map((entry) => {
          const validated = validatedById.get(entry.id);
          return validated ? { ...entry, ...validated } : entry;
        });
        dataSyncService.setDonateurs(nextAll);
        setDonateurs((prev) =>
          prev.map((entry) => {
            const validated = validatedById.get(entry.id);
            return validated ? { ...entry, ...validated } : entry;
          })
        );
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Validation globale impossible');
    } finally {
      setValidatingAll(false);
    }
  };

  const canAddEntry = ['journal', 'caisse', 'donateurs'].includes(module.id);
  const selectedPeriodLabel = periods.find((period) => period.value === selectedPeriod)?.label ?? 'Periode en cours';

  const pendingJournalEntries = useMemo(() => journalEntries.filter((entry) => !entry.valide).length, [journalEntries]);
  const pendingCaisseEntries = useMemo(() => caisseEntries.filter((entry) => !entry.valide).length, [caisseEntries]);
  const pendingDonateursEntries = useMemo(() => donateurs.filter((entry) => !entry.valide).length, [donateurs]);
  const canValidateAll = useMemo(() => {
    if (module.id === 'journal') {
      return pendingJournalEntries > 0;
    }
    if (module.id === 'caisse') {
      return pendingCaisseEntries > 0;
    }
    if (module.id === 'donateurs') {
      return pendingDonateursEntries > 0;
    }
    return false;
  }, [module.id, pendingJournalEntries, pendingCaisseEntries, pendingDonateursEntries]);

  const getDownloadTargetLabel = () => {
    switch (module.id) {
      case 'journal':
        return `Journal comptable - ${selectedPeriodLabel}`;
      case 'caisse':
        return `Journal de caisse - ${selectedPeriodLabel}`;
      case 'donateurs':
        return `Liste des donateurs - ${selectedPeriodLabel}`;
      case 'bilan':
        return `Bilan - ${selectedPeriodLabel}`;
      case 'resultat':
        return `Compte de resultat - ${selectedPeriodLabel}`;
      case 'balance':
        return `Balance generale - ${selectedPeriodLabel}`;
      case 'grandlivre':
        return `Grand livre - ${selectedPeriodLabel}`;
      default:
        return `${module.title} - ${selectedPeriodLabel}`;
    }
  };

  const getExportSection = (): ExportSection => {
    switch (module.id) {
      case 'journal':
        return 'journal';
      case 'caisse':
        return 'cash-journal';
      case 'donateurs':
        return 'donors';
      case 'balance':
        return 'trial-balance';
      case 'grandlivre':
        return 'general-ledger';
      case 'bilan':
        return 'balance-sheet';
      case 'resultat':
        return 'income-statement';
      default:
        return 'all';
    }
  };

  const handleDownloadExport = async () => {
    try {
      setApiError(null);
      setLoadingData(true);
      const section = getExportSection();
      const blob = await exportService.exportToExcel(section, selectedPeriod);
      const filename = `${getDownloadTargetLabel().replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`;
      await exportService.downloadFile(blob, filename);
      setShowDownloadModal(false);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Export echoue');
    } finally {
      setLoadingData(false);
    }
  };

  const getPasteColumns = () => {
    if (module.id === 'journal') {
      return ['date', 'compte', 'libelle', 'debit', 'credit', 'piece', 'journal', 'compteContrepartieExplicite'];
    }

    if (module.id === 'caisse') {
      return ['date', 'description', 'reference', 'entree', 'sortie', 'mode'];
    }

    if (module.id === 'donateurs') {
      return ['nom', 'type', 'montant', 'mode', 'description', 'date'];
    }

    return [];
  };

  const readCell = (row: string[], headers: string[] | null, key: string, index: number) => {
    if (headers) {
      const i = headers.findIndex((header) => normalizeImportKey(header) === normalizeImportKey(key));
      if (i >= 0) return row[i] || '';
    }
    return row[index] || '';
  };

  const handlePasteImport = async (raw: string) => {
    const rows = parseClipboardTable(raw);
    if (rows.length === 0) {
      return { success: 0, failed: 1, errors: ['Aucune ligne detectee.'] };
    }

    if (module.id === 'journal') {
      try {
        const fiscalYearId = await resolveFiscalYearIdFromPeriod(selectedPeriod);
        const backendResult = await apiClient.request<any>('/accounting/entries/import-paste', {
          method: 'POST',
          data: {
            fiscalYearId,
            pastedData: raw,
            defaultJournalType: 'GENERAL',
            defaultSourceType: 'OTHER'
          }
        });

        const createdCount = Number(backendResult?.createdCount ?? backendResult?.created ?? 0);
        if (createdCount > 0) {
          const all = await dataSyncService.getJournalEntries(true);
          const data = (selectedPeriod && /^\d{1,2}\/\d{4}$/.test(selectedPeriod))
            ? all.filter((entry) => entry.periode === selectedPeriod)
            : all;
          setJournalEntries(deletionService.applyRestorePosition('comptabilite-journal', data));
          return { success: createdCount, failed: 0, errors: [] as string[] };
        }
      } catch {
        // fallback local
      }
    }

    const expectedHeaders = getPasteColumns();
    const normalizedExpected = expectedHeaders.map(normalizeImportKey);
    const firstRowLooksLikeHeader = rows[0].some((cell) => normalizedExpected.includes(normalizeImportKey(cell)));
    const headers = firstRowLooksLikeHeader ? rows[0] : null;
    const dataRows = firstRowLooksLikeHeader ? rows.slice(1) : rows;

    const createdJournal: JournalEntry[] = [];
    const createdCaisse: CaisseEntry[] = [];
    const createdDonateurs: DonateurRow[] = [];
    const errors: string[] = [];

    for (let index = 0; index < dataRows.length; index += 1) {
      const row = dataRows[index];
      try {
        if (module.id === 'journal') {
          const created = await journalComptableService.ajouterEcriture({
            date: readCell(row, headers, 'date', 0),
            compte: readCell(row, headers, 'compte', 1),
            libelle: readCell(row, headers, 'libelle', 2),
            debit: parseImportNumber(readCell(row, headers, 'debit', 3), 0),
            credit: parseImportNumber(readCell(row, headers, 'credit', 4), 0),
            piece: readCell(row, headers, 'piece', 5),
            journal: readCell(row, headers, 'journal', 6) || 'OD',
            compteContrepartieExplicite: readCell(row, headers, 'compteContrepartieExplicite', 7),
            periode: selectedPeriod || undefined
          });
          createdJournal.push(created);
        } else if (module.id === 'caisse') {
          const created = await journalCaisseService.ajouterOperation({
            date: readCell(row, headers, 'date', 0),
            description: readCell(row, headers, 'description', 1),
            reference: readCell(row, headers, 'reference', 2),
            entree: parseImportNumber(readCell(row, headers, 'entree', 3), 0),
            sortie: parseImportNumber(readCell(row, headers, 'sortie', 4), 0),
            mode: readCell(row, headers, 'mode', 5) || 'Espece',
            periode: selectedPeriod || undefined
          });
          createdCaisse.push(created);
        } else if (module.id === 'donateurs') {
          const created = await donateursService.ajouterDonateur({
            nom: readCell(row, headers, 'nom', 0),
            type: (readCell(row, headers, 'type', 1) || 'Physique') as 'Physique' | 'Moral',
            montant: parseImportNumber(readCell(row, headers, 'montant', 2), 0),
            mode: readCell(row, headers, 'mode', 3) || 'Espece',
            description: readCell(row, headers, 'description', 4),
            date: readCell(row, headers, 'date', 5)
          });
          createdDonateurs.push(created);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur import';
        errors.push(`Ligne ${index + (headers ? 2 : 1)}: ${message}`);
      }
    }

    if (createdJournal.length > 0) {
      const all = await dataSyncService.getJournalEntries();
      const next = [...all, ...createdJournal];
      dataSyncService.setJournalEntries(next);
      setJournalEntries((prev) => [...prev, ...createdJournal]);
    }

    if (createdCaisse.length > 0) {
      const all = await dataSyncService.getCaisseEntries();
      const next = [...all, ...createdCaisse];
      dataSyncService.setCaisseEntries(next);
      setCaisseEntries((prev) => [...prev, ...createdCaisse]);
    }

    if (createdDonateurs.length > 0) {
      const all = await dataSyncService.getDonateurs();
      const next = [...all, ...createdDonateurs];
      dataSyncService.setDonateurs(next);
      setDonateurs((prev) => [...prev, ...createdDonateurs]);
    }

    return {
      success: createdJournal.length + createdCaisse.length + createdDonateurs.length,
      failed: errors.length,
      errors
    };
  };

  const renderModuleContent = () => {
    switch (module.id) {
      case 'journal':
        return <JournalComptable searchTerm={searchTerm} period={selectedPeriod} entries={journalEntries} onEdit={handleOpenEditForm} onDelete={handleDeleteEntry} onValidate={handleValidateEntry} />;
      case 'caisse':
        return <JournalCaisse searchTerm={searchTerm} entries={caisseEntries} onEdit={handleOpenEditForm} onDelete={handleDeleteEntry} onValidate={handleValidateEntry} />;
      case 'donateurs':
        return <Donateurs searchTerm={searchTerm} entries={donateurs} onEdit={handleOpenEditForm} onDelete={handleDeleteEntry} onValidate={handleValidateEntry} />;
      case 'bilan':
        return <Bilan period={selectedPeriod} />;
      case 'resultat':
        return <CompteResultat period={selectedPeriod} />;
      case 'balance':
        return <Balance searchTerm={searchTerm} period={selectedPeriod} />;
      case 'grandlivre':
        return <GrandLivre searchTerm={searchTerm} period={selectedPeriod} />;
      default:
        return null;
    }
  };

  return (
    <div className="accounting-panel">
      <div className="accounting-panel__header">
        <div className="accounting-panel__title-wrapper">
          <div className={`accounting-panel__icon accounting-panel__icon--${module.id}`}>
            <module.icon size={20} />
          </div>
          <h2 className="accounting-panel__title">{module.title}</h2>
        </div>
        <button onClick={onClose} className="accounting-panel__close" type="button">
          <FiX size={20} />
        </button>
      </div>

      <div className="accounting-panel__navbar">
        <div className="accounting-panel__navbar-left">
          <h3 className="accounting-panel__navbar-title">{module.title}</h3>
          {periods.length > 0 && (
            <select
              value={selectedPeriod ?? ''}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="accounting-panel__period-select"
            >
              {periods.map((period) => (
                <option key={period.id} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="accounting-panel__navbar-right">
          {module.id === 'journal' && (
            <button className="accounting-panel__graph-btn" type="button" onClick={() => setShowJournalChart((prev) => !prev)}>
              {showJournalChart ? 'Retour au journal' : 'Graphique'}
            </button>
          )}

          <button onClick={() => setShowDownloadModal(true)} className="accounting-panel__download-btn" type="button">
            <FiDownload size={16} />
            <span>Exporter</span>
          </button>

          {canAddEntry && !showJournalChart && (
            <button onClick={handleOpenCreateForm} className="accounting-panel__add-btn" type="button">
              <FiPlus size={16} />
              <span>Ajouter</span>
            </button>
          )}

          {canAddEntry && !showJournalChart && (
            <button
              onClick={handleValidateAllEntries}
              className="accounting-panel__download-btn"
              type="button"
              disabled={!canValidateAll || validatingAll}
              title={canValidateAll ? 'Valider toutes les ecritures non validees' : 'Aucune ecriture en attente'}
            >
              <span>{validatingAll ? 'Validation...' : 'Valider tout'}</span>
            </button>
          )}

          {canAddEntry && !showJournalChart && (
            <button onClick={() => setShowPasteModal(true)} className="accounting-panel__download-btn" type="button">
              <FiClipboard size={16} />
              <span>Copie/Coller</span>
            </button>
          )}

          {!showJournalChart && (
            <div className="accounting-panel__search">
              <FiSearch className="accounting-panel__search-icon" size={16} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="accounting-panel__search-input"
              />
            </div>
          )}
        </div>
      </div>

      <div className="accounting-panel__content">
        {apiError && <div className="accounting-empty">{apiError}</div>}
        {loadingData && <div className="accounting-empty">Chargement des donnees...</div>}
        {module.id === 'journal' && showJournalChart ? (
          <div className="accounting-panel__chart-block">
            <SoldeJournalierChart entries={journalEntries} />
          </div>
        ) : (
          <>
            {module.id === 'journal' && (
              <div className="accounting-panel__ecritures-cours">
                <div>
                  <h4 className="accounting-panel__ecritures-cours-title">Ecritures en cours</h4>
                  <p className="accounting-panel__ecritures-cours-count">{pendingJournalEntries} ecritures non validees</p>
                </div>
              </div>
            )}

            {renderModuleContent()}
          </>
        )}
      </div>

      {showForm && (
        <div className="accounting-modal">
          <div className="accounting-modal__content">
            <AccountingEntryForm
              module={module}
              onSubmit={handleFormSubmit}
              onClose={() => {
                setShowForm(false);
                setEditingIndex(null);
              }}
              initialData={
                module.id === 'journal' && editingIndex !== null
                  ? {
                      date: journalEntries[editingIndex]?.date ?? '',
                      compte: journalEntries[editingIndex]?.compte ?? '',
                      libelle: journalEntries[editingIndex]?.libelle ?? '',
                      debit: String(journalEntries[editingIndex]?.debit ?? ''),
                      credit: String(journalEntries[editingIndex]?.credit ?? ''),
                      piece: journalEntries[editingIndex]?.piece ?? '',
                      journal: journalEntries[editingIndex]?.journal ?? 'ACH'
                    }
                  : module.id === 'caisse' && editingIndex !== null
                    ? {
                        date: caisseEntries[editingIndex]?.date ?? '',
                        description: caisseEntries[editingIndex]?.description ?? '',
                        reference: caisseEntries[editingIndex]?.reference ?? '',
                        entree: String(caisseEntries[editingIndex]?.entree ?? ''),
                        sortie: String(caisseEntries[editingIndex]?.sortie ?? ''),
                        mode: caisseEntries[editingIndex]?.mode ?? 'Espece'
                      }
                    : module.id === 'donateurs' && editingIndex !== null
                      ? {
                          date: donateurs[editingIndex]?.date ?? '',
                          nom: donateurs[editingIndex]?.nom ?? '',
                          type: donateurs[editingIndex]?.type ?? 'Physique',
                          montant: String(donateurs[editingIndex]?.montant ?? ''),
                          mode: donateurs[editingIndex]?.mode ?? 'Espece',
                          description: donateurs[editingIndex]?.description ?? ''
                        }
                      : null
              }
            />
          </div>
        </div>
      )}

      {showDownloadModal && (
        <div className="accounting-modal">
          <div className="accounting-modal__content">
            <div className="accounting-modal__header">
              <h3 className="accounting-modal__title">Export Excel</h3>
              <button onClick={() => setShowDownloadModal(false)} className="accounting-modal__close" type="button">
                <FiX size={18} />
              </button>
            </div>

            <p className="accounting-export__intro">Vous allez telecharger :</p>
            <div className="accounting-export__summary">{getDownloadTargetLabel()}</div>
            <p className="accounting-export__note">Format : .xlsx</p>

            <div className="accounting-form__actions">
              <button onClick={() => setShowDownloadModal(false)} className="accounting-form__btn accounting-form__btn--cancel" type="button">
                Annuler
              </button>
              <button onClick={handleDownloadExport} className="accounting-form__btn accounting-form__btn--submit" type="button" disabled={loadingData}>
                {loadingData ? 'Telechargement...' : 'Telecharger'}
              </button>
            </div>
          </div>
        </div>
      )}

      <PasteImportModal
        isOpen={showPasteModal}
        title={`Import Excel - ${module.title}`}
        subtitle="Collez les lignes Excel pour ajouter des ecritures en lot."
        columns={getPasteColumns()}
        onClose={() => setShowPasteModal(false)}
        onImport={handlePasteImport}
      />
    </div>
  );
};

export default AccountingPanel;
