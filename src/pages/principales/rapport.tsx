// src/pages/principales/rapport.tsx
import React, { useState } from 'react';
import { Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RapportsList from '../../component/rapport/RapportsList';
import SearchBar from '../../component/SearchBar';
import { reportService } from '../../service/reportService';
import { dataSyncService } from '../../service/dataSyncService';
import { deletionService, isDeletionBackendMissingError } from '../../service/deletionService';
import type { RapportJournalier } from '../../types/rapport';

type ReportItem = Awaited<ReturnType<typeof reportService.getRecentReports>>[number];

const RapportPage: React.FC = () => {
  const navigate = useNavigate();
  const [rapports, setRapports] = useState<ReportItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  React.useEffect(() => {
    const loadReports = async () => {
      try {
        localStorage.removeItem('reports_deleted_local');
        setLoading(true);
        setApiError('');
        const data = await dataSyncService.getReports7(true);
        setRapports(deletionService.applyRestorePosition('rapport', data));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur de chargement des rapports';
        if (message.toLowerCase().includes('session expir')) {
          navigate('/login', { replace: true });
          return;
        }
        setApiError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadReports();
  }, [navigate]);

  const handleDeleteRapport = async (id: string) => {
    setApiError('');
    const target = rapports.find((rapport) => rapport.id === id);
    const originalIndex = rapports.findIndex((rapport) => rapport.id === id);

    try {
      await reportService.deleteReport(id);
      setRapports((prev) => { const next = prev.filter((rapport) => rapport.id !== id); dataSyncService.setReports7(next); return next; });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Suppression du rapport impossible');
      return;
    }

    try {
      await deletionService.recordDeletion({
        sourceId: id,
        name: target?.date ? `Rapport journalier - ${target.date}` : `Rapport ${id}`,
        type: 'rapport',
        originalIndex: originalIndex >= 0 ? originalIndex : undefined
      });
    } catch (error) {
      if (isDeletionBackendMissingError(error)) {
        setApiError('Suppression effectuee. Logique backend manquante: suppression recente indisponible.');
      } else {
        setApiError(error instanceof Error ? error.message : 'Journalisation de suppression impossible');
      }
    }
  };

  // Filter rapports safely using existing fields on RapportJournalier
  const filterRapports = (items: ReportItem[]) => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase().trim();

    return items.filter((rapport) => {
      // Search in date
      if (rapport.date && rapport.date.toLowerCase().includes(query)) return true;

      // Search in number of visitors
      if (String(rapport.nombreVisiteurs).includes(query)) return true;

      // Search within emprunts (names)
      if (rapport.emprunts && JSON.stringify(rapport.emprunts).toLowerCase().includes(query)) return true;

      // Search within visiteurs
      if (rapport.visiteurs && JSON.stringify(rapport.visiteurs).toLowerCase().includes(query)) return true;

      // Search within ventes
      if (rapport.ventes && JSON.stringify(rapport.ventes).toLowerCase().includes(query)) return true;

      // Search within financial donations
      if (rapport.donsFinanciers && JSON.stringify(rapport.donsFinanciers).toLowerCase().includes(query)) return true;

      // Search within material donations
      if (rapport.donsMateriels && JSON.stringify(rapport.donsMateriels).toLowerCase().includes(query)) return true;

      // Search within achats
      if (rapport.achats && JSON.stringify(rapport.achats).toLowerCase().includes(query)) return true;

      // Search within tableaux
      if (rapport.tableauMateriel && JSON.stringify(rapport.tableauMateriel).toLowerCase().includes(query)) return true;
      if (rapport.tableauFinancier && JSON.stringify(rapport.tableauFinancier).toLowerCase().includes(query)) return true;

      return false;
    });
  };

  const getDisplayRapports = () => filterRapports(rapports);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {loading && <p>Chargement des rapports...</p>}
      {apiError && <p>{apiError}</p>}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Rechercher par date, type de rapport..."
        size="small"
        align="right"
      />
      <RapportsList
        rapports={getDisplayRapports()}
        onDelete={handleDeleteRapport}
      />
    </Container>
  );
};

export default RapportPage;

