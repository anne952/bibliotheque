// components/AchatsTable.tsx
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
import type{ Achat } from '../../types/rapport';

interface AchatsTableProps {
  achats: Achat[];
}

const AchatsTable: React.FC<AchatsTableProps> = ({ achats }) => {
  if (achats.length === 0) {
    return <Typography>Aucun achat enregistré</Typography>;
  }

  const totalAchats = achats.reduce((sum, achat) => sum + achat.montant, 0);

  return (
    <TableContainer component={Paper} sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ p: 2 }}>
        Achats (Total: {totalAchats.toLocaleString()} FCFA)
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Intitulé</TableCell>
            <TableCell>Montant</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Fournisseur</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {achats.map((achat) => (
            <TableRow key={achat.id}>
              <TableCell>{achat.intitule}</TableCell>
              <TableCell>{achat.montant.toLocaleString()} FCFA</TableCell>
              <TableCell>{achat.date}</TableCell>
              <TableCell>{achat.fournisseur}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AchatsTable;