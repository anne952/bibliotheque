// components/RapportDetail.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type{ RapportJournalier } from '../../types/rapport';
import EmpruntsTable from './EmpruntsTable';
import VisiteursTable from './VisiteursTable';
import VentesTable from './VentesTable';
import DonsFinanciersTable from './DonsFinanciersTable';
import DonsMaterielsTable from './DonsMaterielTable';
import AchatsTable from './AchatsTable';

interface RapportDetailProps {
  rapport: RapportJournalier;
  open: boolean;
  onClose: () => void;
  onDownloadPDF: (rapport: RapportJournalier) => void;
}

const RapportDetail: React.FC<RapportDetailProps> = ({
  rapport,
  open,
  onClose,
  onDownloadPDF,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        Rapport Journalier - {rapport.date}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations Générales
              </Typography>
              <Typography>Date: {rapport.date}</Typography>
              <Typography>Nombre de visiteurs: {rapport.nombreVisiteurs}</Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Tableau Matériel */}
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ p: 2 }}>
            Tableau du Matériel
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>N°</TableCell>
                <TableCell>Type du matériel</TableCell>
                <TableCell align="right">Prix</TableCell>
                <TableCell align="right">Dons</TableCell>
                <TableCell align="right">Retour</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rapport.tableauMateriel.map((ligne) => (
                <TableRow key={ligne.id}>
                  <TableCell>{ligne.id}</TableCell>
                  <TableCell>{ligne.type}</TableCell>
                  <TableCell align="right">{ligne.prix}</TableCell>
                  <TableCell align="right">{ligne.dons}</TableCell>
                  <TableCell align="right">{ligne.retour}</TableCell>
                  <TableCell align="right">{ligne.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Tableau Financier */}
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ p: 2 }}>
            Tableau Financier
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>N°</TableCell>
                <TableCell>INTITULE</TableCell>
                <TableCell align="right">DEBIT</TableCell>
                <TableCell align="right">CREDIT</TableCell>
                <TableCell align="right">SOLDE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rapport.tableauFinancier.map((ligne) => (
                <TableRow key={ligne.id}>
                  <TableCell>{ligne.id}</TableCell>
                  <TableCell>{ligne.intitule}</TableCell>
                  <TableCell align="right">{ligne.debit.toLocaleString()}</TableCell>
                  <TableCell align="right">{ligne.credit.toLocaleString()}</TableCell>
                  <TableCell align="right">{ligne.solde.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Tables des activités */}
        <EmpruntsTable emprunts={rapport.emprunts} />
        <VisiteursTable visiteurs={rapport.visiteurs} />
        <VentesTable ventes={rapport.ventes} />
        <DonsFinanciersTable donsFinanciers={rapport.donsFinanciers} />
        <DonsMaterielsTable donsMateriels={rapport.donsMateriels} />
        <AchatsTable achats={rapport.achats} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
        <Button
          variant="contained"
          onClick={() => onDownloadPDF(rapport)}
          color="primary"
        >
          Télécharger PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RapportDetail;