export type TabType = 'emprunt' | 'visite' | 'dons-financier' | 'dons-materiel' | 'achat' | 'vente';

export interface LivreEmprunt {
  titre: string;
  reference: string;
  quantite: number;
}

export interface Emprunt {
  id: string;
  nom: string;
  prenom: string;
  dateEmprunt: string;
  telephone: string;
  email?: string;
  livres: LivreEmprunt[]; // Plusieurs livres peuvent être empruntés
  dureeEmprunt: number; // en jours
  egliseProvenance: string;
  dateRetour: string;
  renouvele: boolean;
}

export interface Visiteur {
  id: string;
  nom: string;
  prenom: string;
  adresse: string;
  egliseProvenance: string;
  telephone: string;
  email?: string;
  dateVisite: string;
}

export interface Vente {
  id: string;
  titres: string[]; // Un ou plusieurs titres vendus
  references: string[]; // Références correspondantes
  nom: string;
  prenom: string;
  adresse: string;
  montant: number;
  dateVente: string;
}

export interface DonFinancier {
  id: string;
  donateur: string; // Nom du donateur
  type: 'physique' | 'moral'; // Type de donateur: Personne Physique ou Morale
  montant: number; // Montant en euros
  mode: 'espece' | 'cheque' | 'virement' | 'nature'; // Mode de paiement
  dateDon: string;
  description?: string;
}

export interface DonMateriel {
  id: string;
  typeMateriel: string; // Type du matériel: livre, carte-sd, tablette, etc.
  materiel: string; // Titre/Nom du matériel
  quantite: number;
  institutionDestinaire: string; // Institution qui reçoit le don
  dateDon: string;
  description?: string;
}

export interface Achat {
  id: string;
  intitule: string;
  montant: number;
  dateAchat: string;
  fournisseur?: string;
}