import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../principales/css/parametre.css';
import AdminInfo from '../../component/parametre/adminInfo';
import RecentDeletions from '../../component/parametre/recentDeletions';
import UpdatePanel from '../../component/parametre/updatePanel';
import defaultCompanyLogo from '../../assets/logo.png';
import { settingsService } from '../../service/settingsService';

const LOCAL_PROFILE_PHOTO_KEY = 'companyProfilePhoto';

const Parametre: React.FC = () => {
  const navigate = useNavigate();
  const [adminInfo, setAdminInfo] = useState({
    companyName: '',
    companyEmail: '',
    password: '',
    profilePhoto: defaultCompanyLogo,
  });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setApiError('');
        const settings = await settingsService.getCompanySettings();

        setAdminInfo((prev) => ({
          ...prev,
          companyName: settings?.companyName ?? '',
          companyEmail: settings?.companyEmail ?? '',
          password: settings?.password ?? '',
          profilePhoto: settings?.profilePhoto || localStorage.getItem(LOCAL_PROFILE_PHOTO_KEY) || prev.profilePhoto
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur de chargement du profil';
        if (message.toLowerCase().includes('session expir')) {
          navigate('/login', { replace: true });
          return;
        }
        setApiError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [navigate]);

  const handleUpdateAdminInfo = async (updatedInfo: {
    companyName: string;
    companyEmail: string;
    password: string;
    profilePhoto: string;
  }) => {
    try {
      setApiError('');

      const changedPayload: {
        companyName?: string;
        profilePhoto?: string;
      } = {};

      const nextCompanyName = updatedInfo.companyName.trim();
      if (nextCompanyName !== adminInfo.companyName) {
        changedPayload.companyName = nextCompanyName;
      }

      if (updatedInfo.profilePhoto !== adminInfo.profilePhoto) {
        changedPayload.profilePhoto = updatedInfo.profilePhoto;
        localStorage.setItem(LOCAL_PROFILE_PHOTO_KEY, updatedInfo.profilePhoto);
      }

      const saved = await settingsService.updateCompanySettings(changedPayload);
      setAdminInfo((prev) => ({
        ...prev,
        ...updatedInfo,
        ...saved
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Mise a jour profil impossible';
      setApiError(message);
      throw new Error(message);
    }
  };

  return (
    <div className="parametre-container">
      {loading && <p>Chargement du profil...</p>}
      {apiError && <p>{apiError}</p>}

      <AdminInfo
        adminInfo={adminInfo}
        onUpdate={handleUpdateAdminInfo}
      />

      <UpdatePanel />

      <RecentDeletions />
    </div>
  );
};

export default Parametre;
