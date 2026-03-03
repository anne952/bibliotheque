import React from 'react';
import '../pages/principales/css/startCard.css';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  iconBgColor,
  iconColor
}) => {
  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-icon-container" style={{ backgroundColor: iconBgColor }}>
          <div className="stat-icon" style={{ color: iconColor }}>
            {icon}
          </div>
        </div>
        <span className="stat-value">{value}</span>
      </div>
      <h3 className="stat-title">{title}</h3>
      <p className="stat-description">{description}</p>
    </div>
  );
};

export default StatCard;