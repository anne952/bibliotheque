// components/VentesTable.tsx
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
import type{ Vente } from '../../types/rapport';

interface VentesTableProps {
  ventes: Vente[];
}

const VentesTable: React.FC<VentesTableProps> = ({ ventes }) => {
  if (ventes.length === 0) {
    return <Typography>Aucune vente enregistrée</Typography>;
  }

  const totalVentes = ventes.reduce((sum, vente) => sum + vente.montant, 0);

  return (
    <TableContainer component={Paper} sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ p: 2 }}>
        Ventes (Total: {totalVentes.toLocaleString()} FCFA)
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nom</TableCell>
            <TableCell>Prénom</TableCell>
            <TableCell>Titres</TableCell>
            <TableCell>Références</TableCell>
            <TableCell>Montant</TableCell>
            <TableCell>Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ventes.map((vente) => (
            <TableRow key={vente.id}>
              <TableCell>{vente.nom}</TableCell>
              <TableCell>{vente.prenom}</TableCell>
              <TableCell>{vente.titres.join(', ')}</TableCell>
              <TableCell>{vente.references.join(', ')}</TableCell>
              <TableCell>{vente.montant.toLocaleString()} FCFA</TableCell>
              <TableCell>{vente.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default VentesTable;