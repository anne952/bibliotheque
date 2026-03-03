import React from 'react';
import '../pages/principales/css/dashboardHearder.css';

interface DashboardHeaderProps {
  userName: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName }) => {
  return (
    <div className="dashboard-header">
      <h1 className="dashboard-title">
      </h1>
      <p className="dashboard-subtitle">Tableau de bord de la bibliothèque</p>
    </div>
  );
};

export default DashboardHeader;