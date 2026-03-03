// components/RapportsList.tsx
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import type{ RapportJournalier } from '../../types/rapport';
import RapportDetail from './RapportDetail';
import { generatePDF } from '../../utils/pdfGenerator';




interface RapportsListProps {
  rapports: RapportJournalier[];
  onDelete: (id: string) => void;
}

const RapportsList: React.FC<RapportsListProps> = ({ rapports, onDelete }) => {
  const [selectedRapport, setSelectedRapport] = useState<RapportJournalier | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleView = (rapport: RapportJournalier) => {
    setSelectedRapport(rapport);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedRapport(null);
  };

  const handleDownloadPDF = (rapport: RapportJournalier) => {
    try {
      generatePDF(rapport);
    } catch (err) {
      console.error('Erreur lors de la génération du PDF:', err);
      setError(`Erreur lors de la génération du PDF: ${err}`);
    }
  };

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      onDelete(id);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  const getCount = (rapport: RapportJournalier, key: 'emprunts' | 'ventes' | 'donsFinanciers') => {
    const detailsCount = Array.isArray(rapport[key]) ? rapport[key].length : 0;
    if (detailsCount > 0) return detailsCount;

    const stats = (rapport as any)?.stats || {};
    if (key === 'emprunts') return Number(stats.loansCount || 0);
    if (key === 'ventes') return Number(stats.salesCount || 0);
    return Number(stats.financialDonationsCount || 0);
  };

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Gestion des Rapports Journaliers
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            {rapports.length} rapport(s) enregistré(s)
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Visiteurs</TableCell>
                  <TableCell>Emprunts</TableCell>
                  <TableCell>Ventes</TableCell>
                  <TableCell>Dons Financiers</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rapports.map((rapport) => (
                  <TableRow
                    key={rapport.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleView(rapport)}
                  >
                    <TableCell>{rapport.date}</TableCell>
                    <TableCell>{rapport.nombreVisiteurs}</TableCell>
                    <TableCell>{getCount(rapport, 'emprunts')}</TableCell>
                    <TableCell>{getCount(rapport, 'ventes')}</TableCell>
                    <TableCell>{getCount(rapport, 'donsFinanciers')}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(rapport);
                          }}
                          title="Voir"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPDF(rapport);
                          }}
                          title="Télécharger PDF"
                        >
                          <PdfIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => handleDelete(rapport.id, e)}
                          title="Supprimer"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {rapports.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">
                Aucun rapport disponible
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {selectedRapport && (
        <RapportDetail
          rapport={selectedRapport}
          open={detailOpen}
          onClose={handleCloseDetail}
          onDownloadPDF={handleDownloadPDF}
        />
      )}

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RapportsList;
