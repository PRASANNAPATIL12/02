import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiHeart, FiZap, FiUser, FiStar } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 100px;
  background: ${props => props.theme.gradientPrimary};
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme.text};
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 2rem;
  transition: color 0.3s ease;

  &:hover {
    color: ${props => props.theme.accent};
  }
`;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 3rem;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const PreviewSection = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const PreviewContainer = styled.div`
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  min-height: 600px;
  position: relative;
`;

const TemplatePreview = styled.div`
  width: 100%;
  height: 100%;
  background: ${props => props.background || 'linear-gradient(135deg, #f8f6f0 0%, #ffffff 100%)'};
  
  .invitation-container {
    width: 100%;
    height: 100%;
    padding: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  ${props => props.css}
`;

const DetailsSection = styled(motion.div)`
  position: sticky;
  top: 120px;
`;

const TemplateHeader = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const TemplateTitle = styled.h1`
  font-family: ${props => props.theme.fontPrimary};
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${props => props.theme.primary};
`;

const TemplateDescription = styled.p`
  font-size: 1.1rem;
  color: ${props => props.theme.textLight};
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const PricingInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const PriceBadge = styled.div`
  background: ${props => props.free ? '#10b981' : props.theme.gradientAccent};
  color: ${props => props.free ? 'white' : props.theme.primary};
  padding: 0.75rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PrimaryButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 15px 30px;
  background: ${props => props.theme.gradientAccent};
  color: ${props => props.theme.primary};
  border: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;

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

const SecondaryButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 15px 30px;
  background: transparent;
  color: ${props => props.theme.accent};
  border: 2px solid ${props => props.theme.accent};
  border-radius: 25px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.theme.accent};
    color: ${props => props.theme.primary};
    transform: translateY(-2px);
  }
`;

const LoginPrompt = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  color: ${props => props.theme.text};
`;

const PremiumPrompt = styled.div`
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a1a;
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 500;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid ${props => props.theme.accent};
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${props => props.theme.text};
  font-size: 1.2rem;
`;

const TemplatePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await axios.get(`${API}/templates/${id}`);
        setTemplate(response.data);
      } catch (error) {
        console.error('Failed to fetch template:', error);
        setError('Template not found');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id]);

  const handleUseTemplate = () => {
    if (!user) {
      navigate('/login', { state: { returnTo: `/templates/${id}` } });
      return;
    }

    if (template.is_premium && !user.premium) {
      // Handle premium upgrade
      handleUpgradeToPremium();
      return;
    }

    navigate(`/personalize/${id}`);
  };

  const handleUpgradeToPremium = async () => {
    try {
      const response = await axios.post(`${API}/payments/checkout/session`, {
        host_url: window.location.origin
      });
      
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment setup failed. Please try again.');
    }
  };

  const renderTemplate = () => {
    if (!template) return null;

    // Sample data for preview
    const sampleData = {
      bride_name: "Emily",
      groom_name: "Michael",
      wedding_date: "June 15, 2025",
      wedding_time: "4:00 PM",
      venue_name: "Sunset Garden Estate",
      venue_address: "123 Vineyard Lane, Napa Valley, CA",
      qr_code: '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" width="120" height="120" style="border-radius: 10px;" />'
    };

    let htmlContent = template.html_content;
    Object.keys(sampleData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, sampleData[key]);
    });

    return (
      <TemplatePreview
        css={template.css_content}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <Container>
          <LoadingSpinner>
            <div className="spinner"></div>
          </LoadingSpinner>
        </Container>
      </PageContainer>
    );
  }

  if (error || !template) {
    return (
      <PageContainer>
        <Container>
          <ErrorMessage>
            {error || 'Template not found'}
            <br />
            <Link to="/" style={{ color: 'inherit', textDecoration: 'underline' }}>
              Return to Home
            </Link>
          </ErrorMessage>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Container>
        <BackButton to="/">
          <FiArrowLeft />
          Back to Templates
        </BackButton>

        <TemplateGrid>
          <PreviewSection
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <PreviewContainer>
              {renderTemplate()}
            </PreviewContainer>
          </PreviewSection>

          <DetailsSection
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <TemplateHeader>
              <TemplateTitle>{template.name}</TemplateTitle>
              <TemplateDescription>{template.description}</TemplateDescription>
              
              <PricingInfo>
                <PriceBadge free={!template.is_premium}>
                  {template.is_premium ? <FiStar /> : <FiHeart />}
                  {template.is_premium ? 'Premium' : 'Free'}
                </PriceBadge>
              </PricingInfo>

              <ActionButtons>
                {!user && (
                  <LoginPrompt>
                    <p>Please login to use this template</p>
                  </LoginPrompt>
                )}

                {user && template.is_premium && !user.premium && (
                  <PremiumPrompt>
                    <p>✨ Upgrade to Premium to access this template and AI features!</p>
                  </PremiumPrompt>
                )}

                <PrimaryButton
                  onClick={handleUseTemplate}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {!user ? (
                    <>
                      <FiUser />
                      Login to Use Template
                    </>
                  ) : template.is_premium && !user.premium ? (
                    <>
                      <FiStar />
                      Upgrade to Premium
                    </>
                  ) : (
                    <>
                      <FiHeart />
                      Use This Template
                    </>
                  )}
                </PrimaryButton>

                {user && user.premium && (
                  <SecondaryButton
                    onClick={() => navigate('/dashboard')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiZap />
                    Generate with AI
                  </SecondaryButton>
                )}
              </ActionButtons>
            </TemplateHeader>
          </DetailsSection>
        </TemplateGrid>
      </Container>
    </PageContainer>
  );
};

export default TemplatePage;