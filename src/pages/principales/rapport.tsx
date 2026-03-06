// src/pages/principales/rapport.tsx
import React, { useState } from 'react';
import { Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RapportsList from '../../component/rapport/RapportsList';
import SearchBar from '../../component/SearchBar';
import { deletionService, isDeletionBackendMissingError } from '../../service/deletionService';
import { useDeleteReportMutation, useReportsQuery } from '../../hooks/queries/reportsQueries';
import type { RapportJournalier } from '../../types/rapport';

type ReportItem = RapportJournalier;

const RapportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [apiError, setApiError] = useState('');
  const reportsQuery = useReportsQuery();
  const deleteReportMutation = useDeleteReportMutation();
  const rapports = reportsQuery.data ?? [];
  const loading = reportsQuery.isLoading;
  const queryError = (reportsQuery.error as Error | null)?.message ?? '';

  React.useEffect(() => {
    if (queryError.toLowerCase().includes('session expir')) {
      navigate('/login', { replace: true });
    }
  }, [navigate, queryError]);

  const handleDeleteRapport = async (id: string) => {
    setApiError('');
    const target = rapports.find((rapport) => rapport.id === id);
    const originalIndex = rapports.findIndex((rapport) => rapport.id === id);

    try {
      await deleteReportMutation.mutateAsync(id);
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
      {(apiError || queryError) && <p>{apiError || queryError}</p>}
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

