// Définition des types TypeScript
export type EtatMateriel = 'fonctionnel' | 'défectueux' | 'en réparation' | 'inutilisable';
export type LangueLivre = 'Français' | 'Anglais' | 'Ewé';
export type CategorieLivre = 'brochure' | 'livre';
export type CategorieCarteSD = 'basique' | 'android';
export type TypeMateriel = 'livre' | 'carte-sd' | 'tablette' | 'photocopieuse' | 'autre';

export interface StockOperation {
  id: string;
  date: string;
  type: 'entrée' | 'sortie';
  quantite: number;
  raison?: string;
  description?: string;
}

export interface MaterielBase {
  id: string;
  nom?: string;
  reference?: string;
  type: TypeMateriel;
  etat: EtatMateriel;
  dateAjout: string;
  stockOperations: StockOperation[];
  categorie?: string;
}

export interface Livre extends MaterielBase {
  type: 'livre';
  titre: string;
  reference: string;
  volume?: number | null;
  langue: LangueLivre;
  categorie: CategorieLivre;
 // Les livres n'ont pas de nom, ils ont un titre
}

export interface CarteSD extends MaterielBase {
  type: 'carte-sd';
  categorie: CategorieCarteSD;
}

export interface Tablette extends MaterielBase {
  type: 'tablette';
  numeroSerie: string;
  nom: string;
}

export interface AutreMateriel extends MaterielBase {
  type: 'photocopieuse' | 'autre';
  nom: string;
}

export type Materiel = Livre | CarteSD | Tablette | AutreMateriel;
