import React from 'react';
import { Users, BookOpen, Gift, TrendingUp } from 'lucide-react';
import type{ DashboardProps, StatData, ChartData } from '../../types/dashboard';
import DashboardHeader from '../../component/dashboardHeader';
import StatCard from '../../component/startCard';
import MonthlyChart from '../../component/monthlyChart';
import { dashboardService } from '../../service/dashboardService';
import '../principales/css/dashboard.css';

const Dashboard: React.FC<DashboardProps> = ({ userName = "Monsieur" }) => {
  const [statsData, setStatsData] = React.useState<StatData>({
    visiteurs: 0,
    emprunts: 0,
    dons: 0,
    ventes: 0
  });
  const [chartData, setChartData] = React.useState<ChartData[]>([]);
  const [loadingStats, setLoadingStats] = React.useState(true);
  const [loadingChart, setLoadingChart] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const loadDashboard = async () => {
      setError('');
      setLoadingStats(true);
      setLoadingChart(true);

      const statsPromise = dashboardService
        .getStats()
        .then((stats) => setStatsData(stats))
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Erreur de chargement des cartes');
        })
        .finally(() => {
          setLoadingStats(false);
        });

      const chartPromise = dashboardService
        .getMonthlyStats(12)
        .then((chart) => setChartData(chart))
        .catch((err) => {
          const message = err instanceof Error ? err.message : 'Erreur de chargement des statistiques mensuelles';
          setError((prev) => prev || message);
        })
        .finally(() => {
          setLoadingChart(false);
        });

      await Promise.allSettled([statsPromise, chartPromise]);
    };

    void loadDashboard();
  }, []);

  return (
    <div className="dashboard-container">
      <DashboardHeader userName={userName} />
      
      <div className="stats-grid">
        <StatCard
          title="Visiteurs"
          value={statsData.visiteurs}
          description="Nombre total de visiteurs"
          icon={<Users />}
          iconBgColor="#dbeafe"
          iconColor="#2563eb"
        />
        
        <StatCard
          title="Emprunts"
          value={statsData.emprunts}
          description="Livres actuellement empruntés"
          icon={<BookOpen />}
          iconBgColor="#dcfce7"
          iconColor="#16a34a"
        />
        
        <StatCard
          title="Dons"
          value={new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(statsData.dons)}
          description="Montant total des dons"
          icon={<Gift />}
          iconBgColor="#f3e8ff"
          iconColor="#9333ea"
        />
        
        <StatCard
          title="Ventes"
          value={statsData.ventes}
          description="Nombre de livres vendus"
          icon={<TrendingUp />}
          iconBgColor="#ffedd5"
          iconColor="#ea580c"
        />
      </div>
      {(loadingStats || loadingChart) && <p>Chargement des statistiques...</p>}
      {error && <p>{error}</p>}
      
      <MonthlyChart data={chartData} />
    </div>
  );
};

export default Dashboard;
