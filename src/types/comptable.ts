
import type React from 'react';
import type { ReactNode } from 'react';

export interface JournalEntry {
  id: number;
  date: string;
  numeroCompte: string;
  libelle: string;
  debit: number | null;
  credit: number | null;
}

export interface NewJournalEntry {
  date: string;
  numeroCompte: string;
  libelle: string;
  debit: string;
  credit: string;
}

export interface TotauxJournal {
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

// ==================== JOURNAL DE CAISSE ====================
export interface CaisseEntry {
  id: number;
  date: string;
  description: string;
  entre: number | null;
  sortie: number | null;
  reference: string;
}

export interface NewCaisseEntry {
  date: string;
  description: string;
  entre: string;
  sortie: string;
  reference: string;
}

export interface TotauxCaisse {
  totalEntre: number;
  totalSortie: number;
  solde: number;
}

// ==================== DONATEURS ====================
export type DonateurType = 'physique' | 'moral';
export type ModePaiement = 'espece' | 'cheque' | 'virement' | 'nature';

export interface Donateur {
  id: number;
  nomComplet: string;
  type: DonateurType;
  montant: number;
  mode: ModePaiement;
  description: string;
  contact: string;
  date: string;
}

export interface NewDonateur {
  nomComplet: string;
  type: DonateurType;
  montant: string;
  mode: ModePaiement;
  description: string;
  contact: string;
}

// ==================== BILAN ====================
export interface BilanItem {
  id: number;
  libelle: string;
  montant: number;
}

export interface Bilan {
  actif: BilanItem[];
  passif: BilanItem[];
}

export interface TotauxBilan {
  totalActif: number;
  totalPassif: number;
}

// ==================== COMPTE DE RÉSULTAT ====================
export interface ResultatItem {
  id: number;
  libelle: string;
  montant: number;
}

export interface CompteResultat {
  produits: ResultatItem[];
  charges: ResultatItem[];
}

export interface TotauxResultat {
  totalProduits: number;
  totalCharges: number;
  resultat: number;
}

// ==================== BALANCE ====================
export interface BalanceItem {
  id: number;
  numeroCompte: string;
  libelle: string;
  soldeDebit: number;
  soldeCredit: number;
}

export interface TotauxBalance {
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

// ==================== CARTES DE SYNTHÈSE ====================
export interface CarteSynthese {
  titre: string;
  valeur: number;
  variation: number;
  positif: boolean;
  icone: ReactNode;
}

export interface SoldeJournaliere {
  actuel: number;
  precedent: number;
}

export interface RevenuMensuel {
  montant: number;
  variation: number;
}

export interface DonateursActifs {
  actuel: number;
  precedent: number;
}

// ==================== FILTRES ====================
export interface Filtres {
  mois: string;
  annee: string;
}

export type TypeFiltre = 'mois' | 'annee';

// ==================== ÉDITION ====================
export interface EditionState {
  editingId: number | null;
  editingType: string | null;
  editForm: Record<string, any>;
}

export type TypeEdition = 
  | 'journal-comptable' 
  | 'bilan-actif' 
  | 'bilan-passif' 
  | 'resultat-produit' 
  | 'resultat-charge';

// ==================== ÉTAT GLOBAL ====================
export interface ComptabiliteState {
  journalComptable: JournalEntry[];
  journalCaisse: CaisseEntry[];
  donateurs: Donateur[];
  bilan: Bilan;
  compteResultat: CompteResultat;
  balance: BalanceItem[];
  
  // Filtres
  filtreMois: string;
  filtreAnnee: string;
  
  // Cartes de synthèse
  soldeJournaliere: SoldeJournaliere;
  revenuMensuel: RevenuMensuel;
  donateursActifs: DonateursActifs;
  
  // Formulaires
  newJournalEntry: NewJournalEntry;
  newCaisseEntry: NewCaisseEntry;
  newDonateur: NewDonateur;
  
  // Édition
  editionState: EditionState;
}

// ==================== PROPS DES COMPOSANTS ====================

// Props communes
export interface CommonProps {
  filtreMois: string;
  filtreAnnee: string;
  setFiltreMois: (mois: string) => void;
  setFiltreAnnee: (annee: string) => void;
  supprimerElement: (id: number, type: TypeEdition) => void;
}

// Props pour JournalComptable
export interface JournalComptableProps extends CommonProps {
  journalComptable: JournalEntry[];
  newJournalEntry: NewJournalEntry;
  calculerTotauxJournal: () => TotauxJournal;
  setNewJournalEntry: (entry: NewJournalEntry) => void;
  ajouterJournalEntry: () => void;
}

// Props pour JournalCaisse
export interface JournalCaisseProps extends CommonProps {
  journalCaisse: CaisseEntry[];
  newCaisseEntry: NewCaisseEntry;
  calculerTotauxCaisse: () => TotauxCaisse;
  setNewCaisseEntry: (entry: NewCaisseEntry) => void;
  ajouterCaisseEntry: () => void;
}

// Props pour Donateurs
export interface DonateursProps extends CommonProps {
  donateurs: Donateur[];
  newDonateur: NewDonateur;
  setNewDonateur: (donateur: NewDonateur) => void;
  ajouterDonateur: () => void;
}

// Props pour Bilan
export interface BilanProps extends CommonProps {
  bilan: Bilan;
  calculerTotauxBilan: () => TotauxBilan;
  mettreAJourBilanItem: (id: number, type: 'actif' | 'passif', updates: Partial<BilanItem>) => void;
}

// Props pour CompteResultat
export interface CompteResultatProps extends CommonProps {
  compteResultat: CompteResultat;
  calculerTotauxResultat: () => TotauxResultat;
  mettreAJourResultatItem: (id: number, type: 'produits' | 'charges', updates: Partial<ResultatItem>) => void;
}

// Props pour Balance
export interface BalanceProps extends CommonProps {
  balance: BalanceItem[];
}

// Props pour CartesSynthese
export interface CartesSyntheseProps {
  soldeJournaliere: SoldeJournaliere;
  revenuMensuel: RevenuMensuel;
  donateursActifs: DonateursActifs;
}

// Props pour Navigation
export interface NavigationProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

// ==================== FONCTIONS DU HOOK ====================
export interface UseComptabiliteReturn {
  // États
  journalComptable: JournalEntry[];
  journalCaisse: CaisseEntry[];
  donateurs: Donateur[];
  bilan: Bilan;
  compteResultat: CompteResultat;
  balance: BalanceItem[];
  filtreMois: string;
  filtreAnnee: string;
  soldeJournaliere: SoldeJournaliere;
  revenuMensuel: RevenuMensuel;
  donateursActifs: DonateursActifs;
  newJournalEntry: NewJournalEntry;
  newCaisseEntry: NewCaisseEntry;
  newDonateur: NewDonateur;
  
  // Setters
  setFiltreMois: (mois: string) => void;
  setFiltreAnnee: (annee: string) => void;
  setNewJournalEntry: (entry: NewJournalEntry) => void;
  setNewCaisseEntry: (entry: NewCaisseEntry) => void;
  setNewDonateur: (donateur: NewDonateur) => void;
  
  // Calculs
  calculerTotauxJournal: () => TotauxJournal;
  calculerTotauxCaisse: () => TotauxCaisse;
  calculerTotauxBilan: () => TotauxBilan;
  calculerTotauxResultat: () => TotauxResultat;
  
  // Opérations CRUD
  ajouterJournalEntry: () => void;
  ajouterCaisseEntry: () => void;
  ajouterDonateur: () => void;
  supprimerElement: (id: number, type: TypeEdition) => void;
  mettreAJourBilanItem: (id: number, type: 'actif' | 'passif', updates: Partial<BilanItem>) => void;
  mettreAJourResultatItem: (id: number, type: 'produits' | 'charges', updates: Partial<ResultatItem>) => void;
  
  // Filtrage
  filtrerParMois: <T extends { date: string }>(data: T[]) => T[];
  filtrerParAnnee: <T extends { date: string }>(data: T[]) => T[];
}

// ==================== ÉVÉNEMENTS ====================
export interface InputChangeEvent extends React.ChangeEvent<HTMLInputElement> {}
export interface SelectChangeEvent extends React.ChangeEvent<HTMLSelectElement> {}
export interface ButtonClickEvent extends React.MouseEvent<HTMLButtonElement> {}
export interface FormSubmitEvent extends React.FormEvent<HTMLFormElement> {}

// ==================== UTILITAIRES ====================
export interface MonthOption {
  value: string;
  label: string;
}

export interface YearOption {
  value: string;
  label: string;
}

// ==================== CONSTANTES ====================
export const NAV_SECTIONS = {
  JOURNAL_COMPTABLE: 'journal-comptable',
  JOURNAL_CAISSE: 'journal-caisse',
  DONATEURS: 'donateur',
  BILAN: 'bilan',
  COMPTE_RESULTAT: 'compte-resultat',
  BALANCE: 'balance',
} as const;

export type NavSection = typeof NAV_SECTIONS[keyof typeof NAV_SECTIONS];

// ==================== PROPS DE TABLEAUX ====================
export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  format?: (value: any) => string;
}

export interface TableProps {
  columns: TableColumn[];
  data: any[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

// ==================== PROPS DE FORMULAIRES ====================
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export interface FormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  initialData?: Record<string, any>;
  submitLabel?: string;
}

// ==================== ÉTAT DE CHARGEMENT ET ERREURS ====================
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// ==================== RÉPONSE D'API ====================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ==================== PAGINATION ====================
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}
