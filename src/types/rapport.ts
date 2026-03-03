// types.ts
export interface Emprunt {
  id: string;
  nom: string;
  prenom: string;
  livres: string[];
  dateEmprunt: string;
  dateRetour: string;
}

export interface Visiteur {
  id: string;
  nom: string;
  prenom: string;
  adresse: string;
  eglise: string;
  dateVisite: string;
}

export interface Vente {
  id: string;
  titres: string[];
  references: string[];
  nom: string;
  prenom: string;
  montant: number;
  date: string;
}

export interface DonFinancier {
  id: string;
  donateur: string;
  type: 'physique' | 'moral';
  montant: number;
  mode: 'espece' | 'cheque' | 'virement' | 'nature';
  date: string;
  description: string;
}

export interface DonMateriel {
  id: string;
  typeMateriel: string;
  materiel: string;
  quantite: number;
  institution: string;
  date: string;
}

export interface Achat {
  id: string;
  intitule: string;
  montant: number;
  date: string;
  fournisseur: string;
}

export interface TableauMateriel {
  id: number;
  type: string;
  prix: number;
  dons: number;
  retour: number;
  total: number;
}

export interface TableauFinancier {
  id: number;
  intitule: string;
  debit: number;
  credit: number;
  solde: number;
}

export interface RapportJournalier {
  id: string;
  date: string;
  nombreVisiteurs: number;
  tableauMateriel: TableauMateriel[];
  tableauFinancier: TableauFinancier[];
  emprunts: Emprunt[];
  visiteurs: Visiteur[];
  ventes: Vente[];
  donsFinanciers: DonFinancier[];
  donsMateriels: DonMateriel[];
  achats: Achat[];
}

// src/types/rapport.ts
// ... vos interfaces existantes ...

export interface RapportJournalier {
  id: string;
  date: string;
  nombreVisiteurs: number;
  tableauMateriel: TableauMateriel[];
  tableauFinancier: TableauFinancier[];
  emprunts: Emprunt[];
  visiteurs: Visiteur[];
  ventes: Vente[];
  donsFinanciers: DonFinancier[];
  donsMateriels: DonMateriel[];
  achats: Achat[];
}