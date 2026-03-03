export interface Emprunt {
  id: number;
  nom: string;
  prenom: string;
  dateEmprunt: string;
  telephone: string;
  email?: string;
  titreOuvrage: string;
  reference: string;
  dureeEmprunt: string;
  nombreOuvrage: number;
  egliseProvenance: string;
  dateRetour: string;
  estRenouvele: boolean;
}

export interface Visiteur {
  id: number;
  nom: string;
  prenom: string;
  adresse: string;
  egliseProvenance: string;
  dateVisite: string;
}

export interface Vente {
  id: number;
  titre: string;
  reference: string;
  nom: string;
  prenom: string;
  adresse: string;
  egliseProvenance: string;
  prix: number;
  dateVente: string;
}

export interface Don {
  id: number;
  intitule: string;
  montant: number;
  dateDon: string;
  donateur: string;
}

export interface Achat {
  id: number;
  intitule: string;
  montant: number;
  dateAchat: string;
  fournisseur: string;
  quantite: number;
}