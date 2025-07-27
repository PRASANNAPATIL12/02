import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiHeart, FiUser } from 'react-icons/fi';
import { useAuth } from '../App';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.gradientPrimary};
  padding: 2rem;
`;

const LoginCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 25px;
  padding: 3rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: ${props => props.theme.fontPrimary};
  font-size: 2rem;
  font-weight: 600;
  color: ${props => props.theme.primary};
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-family: ${props => props.theme.fontPrimary};
  font-size: 2.5rem;
  font-weight: 300;
  margin-bottom: 1rem;
  color: ${props => props.theme.primary};
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: ${props => props.theme.textLight};
  margin-bottom: 3rem;
  line-height: 1.6;
`;

const LoginButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 100%;
  padding: 18px 24px;
  background: ${props => props.theme.gradientAccent};
  color: ${props => props.theme.primary};
  border: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 2rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(212, 175, 55, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid ${props => props.theme.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const FeaturesList = styled.ul`
  list-style: none;
  text-align: left;
  margin-top: 2rem;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.text};
  font-size: 1rem;

  &::before {
    content: '✨';
    font-size: 1.2rem;
  }
`;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, loading } = useAuth();

  useEffect(() => {
    // Check if we're returning from authentication
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      handleAuthCallback(sessionId);
    }

    // Check for session_id in hash (from redirect)
    const hash = window.location.hash;
    if (hash.includes('session_id=')) {
      const hashSessionId = hash.match(/session_id=([^&]*)/)?.[1];
      if (hashSessionId) {
        handleAuthCallback(hashSessionId);
      }
    }

    // If user is already logged in, redirect them
    if (user && !sessionId && !hash.includes('session_id=')) {
      const returnTo = location.state?.returnTo || '/dashboard';
      navigate(returnTo);
    }
  }, [user, navigate, location]);

  const handleAuthCallback = async (sessionId) => {
    try {
      await login(sessionId);
      const returnTo = location.state?.returnTo || '/dashboard';
      navigate(returnTo);
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleLogin = () => {
    // Redirect to Emergent Auth with current URL as redirect
    const redirectUrl = encodeURIComponent(window.location.origin + '/login');
    const authUrl = `https://auth.emergentagent.com/?redirect=${redirectUrl}`;
    window.location.href = authUrl;
  };

  if (loading) {
    return (
      <PageContainer>
        <LoginCard
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <LoadingSpinner />
          <p style={{ marginTop: '1rem', color: 'inherit' }}>Authenticating...</p>
        </LoginCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <LoginCard
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Logo>
          <FiHeart />
          Wedding Invites
        </Logo>

        <Title>Welcome Back!</Title>
        <Subtitle>
          Sign in to create beautiful wedding invitations and manage your designs.
        </Subtitle>

        <LoginButton
          onClick={handleLogin}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
        >
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <FiUser />
              Sign in with Google
            </>
          )}
        </LoginButton>

        <FeaturesList>
          <FeatureItem>Access to beautiful templates</FeatureItem>
          <FeatureItem>Create unlimited invitations</FeatureItem>
          <FeatureItem>Share via QR codes and links</FeatureItem>
          <FeatureItem>Premium AI-powered designs</FeatureItem>
        </FeaturesList>
      </LoginCard>
    </PageContainer>
  );
};

export default LoginPage;