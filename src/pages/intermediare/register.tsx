import React, { useState } from 'react';
import './css/register.css';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuthContext } from '../../context/AuthContext';
import { authService } from '../../service/authService';

interface FormData {
  nomEntreprise: string;
  emailEntreprise: string;
  motDePasse: string;
  confirmerMotDePasse: string;
}

const Inscription: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuthContext();

  const [formData, setFormData] = useState<FormData>({
    nomEntreprise: '',
    emailEntreprise: '',
    motDePasse: '',
    confirmerMotDePasse: ''
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [canRegister, setCanRegister] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  React.useEffect(() => {
    const loadStatus = async () => {
      try {
        const status = await authService.getRegisterStatus();
        setCanRegister(Boolean(status?.canRegister));
      } catch {
        setCanRegister(true);
      }
    };

    void loadStatus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.nomEntreprise.trim()) {
      newErrors.nomEntreprise = "Le nom de l'entreprise est requis";
    }

    if (!formData.emailEntreprise.trim()) {
      newErrors.emailEntreprise = "L'email de l'entreprise est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.emailEntreprise)) {
      newErrors.emailEntreprise = "Email invalide";
    }

    if (!formData.motDePasse) {
      newErrors.motDePasse = "Le mot de passe est requis";
    } else if (formData.motDePasse.length < 6) {
      newErrors.motDePasse = "Le mot de passe doit contenir au moins 6 caractères";
    }

    if (formData.motDePasse !== formData.confirmerMotDePasse) {
      newErrors.confirmerMotDePasse = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && canRegister !== false) {
      try {
        setLoading(true);
        setApiError('');
        await register(
          formData.emailEntreprise,
          formData.motDePasse,
          formData.nomEntreprise
        );
        navigate("/dashboard");
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Inscription impossible');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="inscription-container">
      <div className="formulaire-card">
        <h1>Inscription Entreprise</h1>
        {canRegister === false && (
          <p className="message-erreur">Inscription fermée: un compte principal existe déjà.</p>
        )}
        {apiError && <p className="message-erreur">{apiError}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-groupe">
            <label htmlFor="nomEntreprise">Nom de l'entreprise *</label>
            <input
              type="text"
              id="nomEntreprise"
              name="nomEntreprise"
              value={formData.nomEntreprise}
              onChange={handleChange}
              placeholder="Nom de votre entreprise"
              className={errors.nomEntreprise ? 'error' : ''}
            />
            {errors.nomEntreprise && (
              <span className="message-erreur">{errors.nomEntreprise}</span>
            )}
          </div>

          <div className="form-groupe">
            <label htmlFor="emailEntreprise">Email de l'entreprise *</label>
            <input
              type="email"
              id="emailEntreprise"
              name="emailEntreprise"
              value={formData.emailEntreprise}
              onChange={handleChange}
              placeholder="contact@entreprise.com"
              className={errors.emailEntreprise ? 'error' : ''}
            />
            {errors.emailEntreprise && (
              <span className="message-erreur">{errors.emailEntreprise}</span>
            )}
          </div>

          <div className="form-groupe">
            <label htmlFor="motDePasse">Créer un mot de passe *</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="motDePasse"
                name="motDePasse"
                value={formData.motDePasse}
                onChange={handleChange}
                placeholder="••••••••"
                className={errors.motDePasse ? 'error' : ''}
              />
              <button
                type="button"
                className="toggle-password"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                onClick={() => setShowPassword(prev => !prev)}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {errors.motDePasse && (
              <span className="message-erreur">{errors.motDePasse}</span>
            )}
          </div>

          <div className="form-groupe">
            <label htmlFor="confirmerMotDePasse">Confirmer le mot de passe *</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmerMotDePasse"
                name="confirmerMotDePasse"
                value={formData.confirmerMotDePasse}
                onChange={handleChange}
                placeholder="••••••••"
                className={errors.confirmerMotDePasse ? 'error' : ''}
              />
              <button
                type="button"
                className="toggle-password"
                aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                onClick={() => setShowConfirmPassword(prev => !prev)}
              >
                {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {errors.confirmerMotDePasse && (
              <span className="message-erreur">{errors.confirmerMotDePasse}</span>
            )}
          </div>

          <button type="submit" className="btn-inscription" disabled={loading || canRegister === false}>
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>
        
        <p className="texte-connexion">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
};

export default Inscription;
