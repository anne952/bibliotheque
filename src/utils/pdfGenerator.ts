// utils/pdfGenerator.ts
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import type{ RapportJournalier } from '../types/rapport';



export const generatePDF = (rapport: RapportJournalier) => {
  const doc = new jsPDF();
  const formatNumber = (n: number | string) => {
    const num = typeof n === 'number' ? n : parseFloat(String(n)) || 0;
    // Format using French locale then replace various non-breaking/narrow spaces with normal spaces
    return new Intl.NumberFormat('fr-FR').format(num).replace(/(\u00A0|\u202F|\u2009)/g, ' ');
  };
  
  // Titre principal
  doc.setFontSize(18);
  doc.text('RAPPORT JOURNALIER', 105, 15, { align: 'center' });
  
  // Date et informations générales
  doc.setFontSize(12);
  doc.text(`Date: ${rapport.date}`, 14, 25);
  doc.text(`Nombre de visiteurs: ${rapport.nombreVisiteurs}`, 14, 32);
  
  let yPosition = 40;

  // Tableau Matériel
  doc.setFontSize(14);
  doc.text('TABLEAU DU MATÉRIEL', 14, yPosition);
  yPosition += 10;

  const materielData = rapport.tableauMateriel.map(item => [
    String(item.id),
    item.type,
    formatNumber(item.prix),
    formatNumber(item.dons),
    formatNumber(item.retour),
    formatNumber(item.total)
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['N°', 'Type du matériel', 'Prix', 'Dons', 'Retour', 'Total']],
    body: materielData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Tableau Financier
  doc.setFontSize(14);
  doc.text('TABLEAU FINANCIER', 14, yPosition);
  yPosition += 10;

  const financierData = rapport.tableauFinancier.map(item => [
    String(item.id),
    item.intitule,
    formatNumber(item.debit),
    formatNumber(item.credit),
    formatNumber(item.solde)
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['N°', 'INTITULÉ', 'DÉBIT', 'CRÉDIT', 'SOLDE']],
    body: financierData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [39, 174, 96] }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Emprunts
  if (rapport.emprunts.length > 0) {
    doc.setFontSize(14);
    doc.text('EMPRUNTS', 14, yPosition);
    yPosition += 10;

    const empruntsData = rapport.emprunts.map(item => [
      item.nom,
      item.prenom,
      item.livres.join(', '),
      item.dateEmprunt,
      item.dateRetour
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Nom', 'Prénom', 'Livres', 'Date emprunt', 'Date retour']],
      body: empruntsData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [142, 68, 173] }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Visiteurs
  if (rapport.visiteurs.length > 0) {
    doc.setFontSize(14);
    doc.text('VISITEURS', 14, yPosition);
    yPosition += 10;

    const visiteursData = rapport.visiteurs.map(item => [
      item.nom,
      item.prenom,
      item.adresse,
      item.eglise,
      item.dateVisite
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Nom', 'Prénom', 'Adresse', 'Église', 'Date visite']],
      body: visiteursData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [230, 126, 34] }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Ventes
  if (rapport.ventes.length > 0) {
    doc.setFontSize(14);
    doc.text('VENTES', 14, yPosition);
    yPosition += 10;

    const ventesData = rapport.ventes.map(item => [
      item.nom,
      item.prenom,
      item.titres.join(', '),
      item.references.join(', '),
      `${formatNumber(item.montant)} FCFA`,
      item.date
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Nom', 'Prénom', 'Titres', 'Références', 'Montant', 'Date']],
      body: ventesData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [192, 57, 43] }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Dons Financiers
  if (rapport.donsFinanciers.length > 0) {
    doc.setFontSize(14);
    doc.text('DONS FINANCIERS', 14, yPosition);
    yPosition += 10;

    const donsFinanciersData = rapport.donsFinanciers.map(item => [
      item.donateur,
      `${formatNumber(item.montant)} FCFA`,
      item.date,
      item.description
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Donateur', 'Montant', 'Date', 'Description']],
      body: donsFinanciersData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Dons Matériels
  if (rapport.donsMateriels.length > 0) {
    doc.setFontSize(14);
    doc.text('DONS MATÉRIELS', 14, yPosition);
    yPosition += 10;

    const donsMaterielsData = rapport.donsMateriels.map(item => [
      item.typeMateriel,
      item.materiel,
      formatNumber(item.quantite),
      item.institution,
      item.date
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Type', 'Matériel', 'Quantité', 'Institution', 'Date']],
      body: donsMaterielsData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [155, 89, 182] }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Achats
  if (rapport.achats.length > 0) {
    doc.setFontSize(14);
    doc.text('ACHATS', 14, yPosition);
    yPosition += 10;

    const achatsData = rapport.achats.map(item => [
      item.intitule,
      `${formatNumber(item.montant)} FCFA`,
      item.date,
      item.fournisseur
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Intitulé', 'Montant', 'Date', 'Fournisseur']],
      body: achatsData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [52, 152, 219] }
    });
  }

  // Pied de page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `Page ${i} sur ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Sauvegarder le PDF
  doc.save(`rapport-${rapport.date.replace(/\//g, '-')}.pdf`);
};