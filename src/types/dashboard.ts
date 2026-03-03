export interface StatData {
  visiteurs: number;
  emprunts: number;
  dons: number;
  ventes: number;
}

export interface ChartData {
  mois: string;
  livres: number;
  dons: number;
}

export interface DashboardProps {
  userName?: string;
}