// components/DonsMaterielsTable.tsx
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
import type{ DonMateriel } from '../../types/rapport';

interface DonsMaterielsTableProps {
  donsMateriels: DonMateriel[];
}

const DonsMaterielsTable: React.FC<DonsMaterielsTableProps> = ({ donsMateriels }) => {
  if (donsMateriels.length === 0) {
    return <Typography>Aucun don matériel enregistré</Typography>;
  }

  const totalQuantite = donsMateriels.reduce((sum, don) => sum + don.quantite, 0);

  return (
    <TableContainer component={Paper} sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ p: 2 }}>
        Dons Matériels (Total: {totalQuantite} articles)
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Matériel</TableCell>
            <TableCell>Quantité</TableCell>
            <TableCell>Institution</TableCell>
            <TableCell>Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {donsMateriels.map((don) => (
            <TableRow key={don.id}>
              <TableCell>{don.typeMateriel}</TableCell>
              <TableCell>{don.materiel}</TableCell>
              <TableCell>{don.quantite}</TableCell>
              <TableCell>{don.institution}</TableCell>
              <TableCell>{don.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DonsMaterielsTable;