import React from 'react';
import '../intermediare/css/Error.css'; // Créer ce fichier CSS

function ErrorPage() {
  return (
    <div className="error-page">
      <div className="error-content">
        <h1>Votre profil n'est pas autorisé sur cette page</h1>
      </div>
    </div>
  );
}

export default ErrorPage;