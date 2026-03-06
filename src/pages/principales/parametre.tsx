import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../principales/css/parametre.css';
import AdminInfo from '../../component/parametre/adminInfo';
import RecentDeletions from '../../component/parametre/recentDeletions';
import UpdatePanel from '../../component/parametre/updatePanel';
import defaultCompanyLogo from '../../assets/logo.png';
import { useCompanyProfileQuery, useUpdateCompanyProfileMutation } from '../../hooks/queries/settingsQueries';

const LOCAL_PROFILE_PHOTO_KEY = 'companyProfilePhoto';

const Parametre: React.FC = () => {
  const navigate = useNavigate();
  const [adminInfo, setAdminInfo] = useState({
    companyName: '',
    companyEmail: '',
    password: '',
    profilePhoto: defaultCompanyLogo,
  });
  const [apiError, setApiError] = useState('');
  const profileQuery = useCompanyProfileQuery();
  const updateProfileMutation = useUpdateCompanyProfileMutation();
  const loading = profileQuery.isLoading;

  React.useEffect(() => {
    const message = (profileQuery.error as Error | null)?.message || '';
    if (message.toLowerCase().includes('session expir')) {
      navigate('/login', { replace: true });
    }
  }, [navigate, profileQuery.error]);

  React.useEffect(() => {
    const settings = profileQuery.data;
    if (!settings) return;

    setAdminInfo((prev) => ({
      ...prev,
      companyName: settings?.companyName ?? '',
      companyEmail: settings?.companyEmail ?? '',
      password: settings?.password ?? '',
      profilePhoto: settings?.profilePhoto || localStorage.getItem(LOCAL_PROFILE_PHOTO_KEY) || prev.profilePhoto
    }));
  }, [profileQuery.data]);

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

      const saved = await updateProfileMutation.mutateAsync(changedPayload);
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
      {(apiError || (profileQuery.error as Error | null)?.message) && <p>{apiError || (profileQuery.error as Error | null)?.message}</p>}

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
