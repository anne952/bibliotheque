import React, { useState } from 'react';
import AdminInfoForm from './adminInfoform';

interface AdminInfoProps {
  adminInfo: {
    companyName: string;
    companyEmail: string;
    password: string;
    profilePhoto: string;
  };
  onUpdate: (updatedInfo: {
    companyName: string;
    companyEmail: string;
    password: string;
    profilePhoto: string;
  }) => Promise<void>;
}

const AdminInfo: React.FC<AdminInfoProps> = ({ adminInfo, onUpdate }) => {
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [photoNonce, setPhotoNonce] = useState(() => Date.now());

  React.useEffect(() => {
    setPhotoNonce(Date.now());
  }, [adminInfo.profilePhoto]);

  const toggleOffcanvas = () => {
    setShowOffcanvas(!showOffcanvas);
  };

  const handleSubmit = async (updatedInfo: {
    companyName: string;
    companyEmail: string;
    password: string;
    profilePhoto: string;
  }) => {
    try {
      await onUpdate(updatedInfo);
      setShowOffcanvas(false);
    } catch {
      // L'erreur est déjà gérée et affichée dans le parent
    }
  };

  const resolvedProfilePhoto = (() => {
    const src = adminInfo.profilePhoto || '';
    if (!src) return src;
    if (/^(data:|blob:)/i.test(src)) return src;
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}v=${photoNonce}`;
  })();

  return (
    <div className="admin-info-card">
      <div className="admin-info-content">
        <div className="admin-profile-photo-wrapper">
          <img
            src={resolvedProfilePhoto}
            alt="Photo de profil entreprise"
            className="admin-profile-photo"
          />
        </div>

        <div className="admin-info-details">
          <div className="admin-info-field">
            <span className="admin-info-label">Nom de l'entreprise:</span>
            <span className="admin-info-value">{adminInfo.companyName}</span>
          </div>
          <div className="admin-info-field">
            <span className="admin-info-label">Email de l'entreprise:</span>
            <span className="admin-info-value">{adminInfo.companyEmail}</span>
          </div>
          <div className="admin-info-field">
            <span className="admin-info-label">Mot de passe:</span>
            <span className="admin-info-value password-display">{'*'.repeat(adminInfo.password.length || 8)}</span>
          </div>
        </div>
        
        <button 
          className="btn-modifier"
          onClick={toggleOffcanvas}
        >
          Modifier
        </button>
      </div>

      {/* Offcanvas pour la modification */}
      <div className={`offcanvas-overlay ${showOffcanvas ? 'active' : ''}`} onClick={toggleOffcanvas}></div>
      
      <div className={`offcanvas ${showOffcanvas ? 'active' : ''}`}>
        <AdminInfoForm 
          currentAdminInfo={adminInfo}
          onSubmit={handleSubmit}
          onCancel={toggleOffcanvas}
        />
      </div>
    </div>
  );
};

export default AdminInfo;
