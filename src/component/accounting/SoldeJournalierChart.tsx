import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface JournalEntry {
  date: string;
  debit: number;
  credit: number;
}

interface SoldeJournalierChartProps {
  entries: JournalEntry[];
}

const toIsoDate = (value: string) => {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split('/');
    return `${year}-${month}-${day}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
};

const SoldeJournalierChart = ({ entries }: SoldeJournalierChartProps) => {
  const data = useMemo(() => {
    const mapByDay = new Map<string, number>();

    entries.forEach((entry) => {
      const iso = toIsoDate(entry.date);
      if (!iso) {
        return;
      }

      const dayTotal = (mapByDay.get(iso) || 0) + (Number(entry.debit || 0) - Number(entry.credit || 0));
      mapByDay.set(iso, dayTotal);
    });

    const sortedDays = Array.from(mapByDay.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    let running = 0;
    return sortedDays.map(([iso, movement]) => {
      running += movement;
      const [year, month, day] = iso.split('-');
      return {
        day: `${day}/${month}`,
        solde: running,
        fullDate: `${day}/${month}/${year}`
      };
    });
  }, [entries]);

  return (
    <div className="accounting-chart-container">
      <h3 className="accounting-chart-title">Evolution du solde journalier</h3>
      <div className="accounting-chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#cbd5e1" />
            <XAxis dataKey="day" tick={{ fontSize: 13, fill: '#334155' }} tickMargin={10} />
            <YAxis tick={{ fontSize: 13, fill: '#334155' }} width={100} />
            <Tooltip formatter={(value: number) => [`${Number(value).toLocaleString()} F`, 'Solde']} labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''} />
            <Line
              type="basis"
              dataKey="solde"
              stroke="#1d4ed8"
              strokeWidth={4}
              dot={{ r: 4, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
              activeDot={{ r: 7, fill: '#1e40af', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {data.length === 0 && <div className="accounting-empty">Aucune donnee pour le graphique.</div>}
    </div>
  );
};

export default SoldeJournalierChart;
