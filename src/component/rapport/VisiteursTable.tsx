// components/VisiteursTable.tsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';
import type{ Visiteur } from '../../types/rapport';

interface VisiteursTableProps {
  visiteurs: Visiteur[];
}

const VisiteursTable: React.FC<VisiteursTableProps> = ({ visiteurs }) => {
  if (visiteurs.length === 0) {
    return <Typography>Aucun visiteur enregistré</Typography>;
  }

  return (
    <TableContainer component={Paper} sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ p: 2 }}>
        Visiteurs ({visiteurs.length})
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nom</TableCell>
            <TableCell>Prénom</TableCell>
            <TableCell>Adresse</TableCell>
            <TableCell>Église</TableCell>
            <TableCell>Date de visite</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visiteurs.map((visiteur) => (
            <TableRow key={visiteur.id}>
              <TableCell>{visiteur.nom}</TableCell>
              <TableCell>{visiteur.prenom}</TableCell>
              <TableCell>{visiteur.adresse}</TableCell>
              <TableCell>{visiteur.eglise}</TableCell>
              <TableCell>{visiteur.dateVisite}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default VisiteursTable;