export const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(date));
};

export const formatAccountNumber = (number) => {
  return number.toString().padStart(3, '0');
};