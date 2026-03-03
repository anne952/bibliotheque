// components/DonsFinanciersTable.tsx
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
import type{ DonFinancier } from '../../types/rapport';

interface DonsFinanciersTableProps {
  donsFinanciers: DonFinancier[];
}

const DonsFinanciersTable: React.FC<DonsFinanciersTableProps> = ({ donsFinanciers }) => {
  if (donsFinanciers.length === 0) {
    return <Typography>Aucun don financier enregistré</Typography>;
  }

  const totalDons = donsFinanciers.reduce((sum, don) => sum + don.montant, 0);

  return (
    <TableContainer component={Paper} sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ p: 2 }}>
        Dons Financiers (Total: {totalDons.toLocaleString()} FCFA)
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Donateur</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Montant</TableCell>
            <TableCell>Mode</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {donsFinanciers.map((don) => (
            <TableRow key={don.id}>
              <TableCell>{don.donateur}</TableCell>
              <TableCell>{don.type === 'physique' ? 'Personne Physique' : 'Personne Morale'}</TableCell>
              <TableCell>{don.montant.toLocaleString()} FCFA</TableCell>
              <TableCell>
                {don.mode === 'espece' ? 'Espèce' :
                 don.mode === 'cheque' ? 'Chèque' :
                 don.mode === 'virement' ? 'Virement' :
                 don.mode === 'nature' ? 'Nature' : don.mode}
              </TableCell>
              <TableCell>{don.date}</TableCell>
              <TableCell>{don.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DonsFinanciersTable;