import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const MAX_PROFILE_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;

const compressImageToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lecture du fichier image impossible'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Chargement image impossible'));
      img.onload = () => {
        const maxSide = 512;
        const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * ratio));
        const height = Math.max(1, Math.round(img.height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Traitement image impossible'));
          return;
        }

        context.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        resolve(dataUrl);
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });

interface AdminInfoFormProps {
  currentAdminInfo: {
    companyName: string;
    companyEmail: string;
    password: string;
    profilePhoto: string;
  };
  onSubmit: (updatedInfo: {
    companyName: string;
    companyEmail: string;
    password: string;
    profilePhoto: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const AdminInfoForm: React.FC<AdminInfoFormProps> = ({ currentAdminInfo, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    companyName: currentAdminInfo.companyName,
    companyEmail: currentAdminInfo.companyEmail,
    profilePhoto: currentAdminInfo.profilePhoto,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      companyName: currentAdminInfo.companyName,
      companyEmail: currentAdminInfo.companyEmail,
      profilePhoto: currentAdminInfo.profilePhoto,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
    setErrors({});
  }, [currentAdminInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, profilePhoto: 'Veuillez choisir une image valide' }));
      return;
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE_BYTES) {
      setErrors((prev) => ({ ...prev, profilePhoto: 'Image trop lourde (max 10 Mo)' }));
      return;
    }

    try {
      const compressed = await compressImageToDataUrl(file);
      setFormData((prev) => ({ ...prev, profilePhoto: compressed || prev.profilePhoto }));
      setErrors((prev) => ({ ...prev, profilePhoto: '' }));
    } catch {
      setErrors((prev) => ({ ...prev, profilePhoto: 'Traitement image impossible' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    const isChangingCompanyInfo =
      formData.companyName.trim() !== currentAdminInfo.companyName ||
      formData.companyEmail.trim() !== currentAdminInfo.companyEmail ||
      formData.profilePhoto !== currentAdminInfo.profilePhoto;

    const isChangingPassword = formData.newPassword.trim() !== '' || 
                              formData.currentPassword.trim() !== '' || 
                              formData.confirmPassword.trim() !== '';

    if (!isChangingCompanyInfo && !isChangingPassword) {
      newErrors.general = 'Veuillez modifier au moins une information de l entreprise ou le mot de passe';
      setErrors(newErrors);
      return false;
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Le nom de l entreprise est requis';
    }

    if (!formData.companyEmail.trim()) {
      newErrors.companyEmail = 'L email de l entreprise est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)) {
      newErrors.companyEmail = 'Format email invalide';
    }

    if (isChangingPassword) {
      if (!formData.currentPassword.trim()) {
        newErrors.currentPassword = 'L\'ancien mot de passe est requis pour changer le mot de passe';
      } else if (formData.currentPassword !== currentAdminInfo.password) {
        newErrors.currentPassword = 'L\'ancien mot de passe est incorrect';
      }

      if (!formData.newPassword.trim()) {
        newErrors.newPassword = 'Le nouveau mot de passe est requis';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
      }

      if (!formData.confirmPassword.trim()) {
        newErrors.confirmPassword = 'Veuillez confirmer le nouveau mot de passe';
      } else if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const updatedInfo = { ...currentAdminInfo };

    updatedInfo.companyName = formData.companyName.trim();
    updatedInfo.companyEmail = formData.companyEmail.trim();
    updatedInfo.profilePhoto = formData.profilePhoto;
    
    if (formData.newPassword.trim()) {
      updatedInfo.password = formData.newPassword;
    }
    
    try {
      await onSubmit(updatedInfo);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="offcanvas-header">
        <h2>Modifier les informations</h2>
        <button className="offcanvas-close" onClick={onCancel}>
          &times;
        </button>
      </div>
      
      <div className="offcanvas-body">
        <form onSubmit={(e) => void handleSubmit(e)}>
          {errors.general && <div className="alert-error">{errors.general}</div>}

          <div className="form-group">
            <label htmlFor="profilePhoto">Photo de profil</label>
            <div className="profile-photo-edit">
              <img src={formData.profilePhoto} alt="Apercu profil entreprise" className="profile-photo-preview" />
              <input
                type="file"
                id="profilePhoto"
                name="profilePhoto"
                accept="image/*"
                onChange={handlePhotoChange}
                className={`form-control ${errors.profilePhoto ? 'is-invalid' : ''}`}
              />
            </div>
            {errors.profilePhoto && <div className="invalid-feedback">{errors.profilePhoto}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="companyName">Nom de l'entreprise</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              className={`form-control ${errors.companyName ? 'is-invalid' : ''}`}
              placeholder="Entrez le nom de l entreprise"
            />
            {errors.companyName && <div className="invalid-feedback">{errors.companyName}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="companyEmail">Email de l'entreprise</label>
            <input
              type="email"
              id="companyEmail"
              name="companyEmail"
              value={formData.companyEmail}
              onChange={handleInputChange}
              autoComplete="username"
              className={`form-control ${errors.companyEmail ? 'is-invalid' : ''}`}
              placeholder="Entrez l email de l entreprise"
            />
            {errors.companyEmail && <div className="invalid-feedback">{errors.companyEmail}</div>}
          </div>
          
          <div className="form-separator">
            <span>Changer le mot de passe (optionnel)</span>
          </div>
          
          <div className="form-group">
            <label htmlFor="currentPassword">Ancien mot de passe</label>
            <div className="password-wrapper">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                autoComplete="current-password"
                className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`}
                placeholder="Entrez l'ancien mot de passe"
              />
              <button
                type="button"
                className="toggle-password"
                aria-label={showCurrentPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                onClick={() => setShowCurrentPassword((prev) => !prev)}
              >
                {showCurrentPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {errors.currentPassword && <div className="invalid-feedback">{errors.currentPassword}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword">Nouveau mot de passe</label>
            <div className="password-wrapper">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                autoComplete="new-password"
                className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                placeholder="Entrez le nouveau mot de passe"
              />
              <button
                type="button"
                className="toggle-password"
                aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                onClick={() => setShowNewPassword((prev) => !prev)}
              >
                {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {errors.newPassword && <div className="invalid-feedback">{errors.newPassword}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                autoComplete="new-password"
                className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Confirmez le nouveau mot de passe"
              />
              <button
                type="button"
                className="toggle-password"
                aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="btn-save"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AdminInfoForm;
