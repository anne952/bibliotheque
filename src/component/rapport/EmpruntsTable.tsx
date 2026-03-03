// components/EmpruntsTable.tsx
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
import type{ Emprunt } from '../../types/rapport';

interface EmpruntsTableProps {
  emprunts: Emprunt[];
}

const EmpruntsTable: React.FC<EmpruntsTableProps> = ({ emprunts }) => {
  if (emprunts.length === 0) {
    return <Typography>Aucun emprunt enregistré</Typography>;
  }

  return (
    <TableContainer component={Paper} sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ p: 2 }}>
        Emprunts
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nom</TableCell>
            <TableCell>Prénom</TableCell>
            <TableCell>Livres</TableCell>
            <TableCell>Date d'emprunt</TableCell>
            <TableCell>Date de retour</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {emprunts.map((emprunt) => (
            <TableRow key={emprunt.id}>
              <TableCell>{emprunt.nom}</TableCell>
              <TableCell>{emprunt.prenom}</TableCell>
              <TableCell>{emprunt.livres.join(', ')}</TableCell>
              <TableCell>{emprunt.dateEmprunt}</TableCell>
              <TableCell>{emprunt.dateRetour}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default EmpruntsTable;