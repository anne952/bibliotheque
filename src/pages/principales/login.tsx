import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuthContext } from '../../context/AuthContext';
import { authService } from '../../service/authService';


const LoginPage: React.FC = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthContext();

  useEffect(() => {
    void authService.getRegisterStatus().catch(() => undefined);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      await login(name, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de connexion');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Container>
      <LoginCard>
        <Title>Bibliothèque la voix de Dieu Togo</Title>
        

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            
            <Input
              type="text"
              placeholder="Entrez votre email"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </InputGroup>

          <InputGroup>
            <PasswordField>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <TogglePasswordButton
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </TogglePasswordButton>
            </PasswordField>
          </InputGroup>
          {error && <ErrorText>{error}</ErrorText>}
          <Button type="submit" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</Button>
          <RegisterHint>
            Première installation ? <StyledLink to="/register">Créer le compte principal</StyledLink>
          </RegisterHint>
          
        </Form>
      </LoginCard>
    </Container>
  );
};

// Styles globaux pour reset
const GlobalStyles = styled.div`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  }
`;

const Container = styled.div`
  min-height: 100vh;
  min-width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #DE4D2F, #B33319);
  padding: 20px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const LoginCard = styled.div`
  background: white;
  padding: 40px 32px;
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(18, 18, 18, 0.2);
  text-align: center;
`;

const Title = styled.h1`
  font-size: 1.4rem;
  padding: 20px;
  font-weight: 700;
  color: #DE4D2F;
  margin-bottom: 8px;
  text-transform: capitalize;
  line-height: 1.3;
`;

// const Subtitle = styled.h2`
//   font-size: 1.1rem;
//   font-weight: 500;
//   color: #555;
//   margin-bottom: 24px;
// `;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const InputGroup = styled.div`
  text-align: left;
  width: 100%;
`;

// const Label = styled.label`
//   font-size: 0.9rem;
//   font-weight: 600;
//   color: #333;
//   margin-bottom: 6px;
//   display: block;
// `;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 0.95rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #B33319;
    box-shadow: 0 0 0 2px rgba(210, 99, 25, 0.15);
  }
`;

const PasswordField = styled.div`
  position: relative;

  input {
    padding-right: 42px;
  }
`;

const TogglePasswordButton = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  cursor: pointer;
  color: #6b7280;
  line-height: 0;

  &:hover {
    color: #374151;
  }
`;

const Button = styled.button`
  margin-top: 30px;
  padding: 12px;
  background: #DE4D2F;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    background: #B33319;
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }


`;

const ErrorText = styled.p`
  color: #b42318;
  font-size: 0.9rem;
  margin: 0;
  width: 100%;
  text-align: left;
`;

const RegisterHint = styled.p`
  margin-top: 8px;
  font-size: 0.9rem;
  color: #555;
`;

const StyledLink = styled(Link)`
  color: #B33319;
  text-decoration: none;
  font-weight: 600;
`;

// Composant wrapper qui applique les styles globaux
const LoginPageWithStyles: React.FC = () => (
  <>
    <GlobalStyles />
    <LoginPage />
  </>
);

export default LoginPageWithStyles;
