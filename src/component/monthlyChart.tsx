import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChartData } from '../types/dashboard';
import '../pages/principales/css/monthlyChart.css';

interface MonthlyChartProps {
  data: ChartData[];
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ data }) => {
  // Keep original values; use grouped bars for `livres` and `dons`
  const transformedData = data.map(item => ({ ...item }));

  return (
    <div className="monthly-chart">
      <h2 className="chart-title">Statistiques mensuelles</h2>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={transformedData}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorLivres" x1="0" y1="0" x2="0" y2="1">
              <stop offset="15%" stopColor="#ffb366" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#ffb366" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="colorDons" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.2} />
            </linearGradient>
          </defs>

          <XAxis dataKey="mois" stroke="#6b7280" style={{ fontSize: '12px' }} />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: any, name: any) => {
              if (value === null || value === undefined) return '';
              if (name === 'Livres') return [value, 'Livres'];
              // dons financiers
              const n = Number(value);
              return Number.isNaN(n) ? [String(value), name] : [`${n.toLocaleString('fr-FR')} f CFA`, name];
            }}
            labelStyle={{ color: '#000' }}
          />
          <Legend wrapperStyle={{ paddingTop: '0.75rem' }} />

          <Bar dataKey="livres" name="Livres" fill="url(#colorLivres)" barSize={18} radius={[4, 4, 0, 0]} />
          <Bar dataKey="dons" name="Dons (f CFA)" fill="url(#colorDons)" barSize={18} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyChart;