import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiPlus, FiEye, FiShare2, FiEdit3, FiTrash2, FiStar, FiZap } from 'react-icons/fi';
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled(motion.div)`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-family: ${props => props.theme.fontPrimary};
  font-size: 3rem;
  font-weight: 300;
  margin-bottom: 1rem;
  color: ${props => props.theme.primary};
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: ${props => props.theme.textLight};
  margin-bottom: 2rem;
`;

const UserInfo = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const UserDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Avatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${props => props.theme.gradientAccent};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.primary};
  font-weight: 600;
  font-size: 1.5rem;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserText = styled.div`
  h3 {
    font-family: ${props => props.theme.fontPrimary};
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: ${props => props.theme.primary};
  }

  p {
    color: ${props => props.theme.textLight};
    font-size: 1rem;
  }
`;

const PremiumBadge = styled.div`
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a1a;
  padding: 0.5rem 1rem;
  border-radius: 15px;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

const UpgradeButton = styled(motion.button)`
  background: ${props => props.theme.gradientAccent};
  color: ${props => props.theme.primary};
  border: none;
  padding: 10px 20px;
  border-radius: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(212, 175, 55, 0.3);
  }
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const ActionCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
`;

const ActionIcon = styled.div`
  font-size: 3rem;
  color: ${props => props.theme.accent};
  margin-bottom: 1rem;
`;

const ActionTitle = styled.h3`
  font-family: ${props => props.theme.fontPrimary};
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.primary};
`;

const ActionDescription = styled.p`
  color: ${props => props.theme.textLight};
  font-size: 1rem;
  line-height: 1.5;
`;

const InvitationsSection = styled.div`
  margin-top: 3rem;
`;

const SectionTitle = styled.h2`
  font-family: ${props => props.theme.fontPrimary};
  font-size: 2rem;
  margin-bottom: 2rem;
  color: ${props => props.theme.primary};
  text-align: center;
`;

const InvitationsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
`;

const InvitationCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
`;

const InvitationPreview = styled.div`
  height: 200px;
  background: linear-gradient(135deg, #f8f6f0 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${props => props.theme.fontPrimary};
  font-size: 1.2rem;
  color: #333;
  text-align: center;
  padding: 1rem;
`;

const InvitationInfo = styled.div`
  padding: 1.5rem;
`;

const InvitationTitle = styled.h3`
  font-family: ${props => props.theme.fontPrimary};
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.primary};
`;

const InvitationMeta = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.textLight};
  margin-bottom: 1rem;
`;

const InvitationActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ActionBtn = styled.button`
  background: transparent;
  color: ${props => props.theme.accent};
  border: 1px solid ${props => props.theme.accent};
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.theme.accent};
    color: white;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${props => props.theme.textLight};
  
  h3 {
    font-family: ${props => props.theme.fontPrimary};
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: ${props => props.theme.primary};
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  
  .spinner {
    width: 40px;
    height: 40px;
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

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { returnTo: '/dashboard' } });
      return;
    }

    fetchInvitations();
  }, [user, navigate]);

  const fetchInvitations = async () => {
    try {
      const response = await axios.get(`${API}/invitations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        }
      });
      setInvitations(response.data);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    } finally {
      setLoading(false);
    }
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

  const copyInvitationUrl = async (slug) => {
    const url = `${window.location.origin}/i/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Invitation URL copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  if (!user) {
    return null;
  }

  const actions = [
    {
      icon: FiPlus,
      title: 'Create New Invitation',
      description: 'Choose from our beautiful templates and create your perfect wedding invitation',
      onClick: () => navigate('/')
    },
    {
      icon: FiZap,
      title: 'AI Template Generator',
      description: 'Generate custom templates with AI (Premium feature)',
      onClick: user.premium ? () => navigate('/ai-generator') : handleUpgradeToPremium,
      premium: !user.premium
    }
  ];

  return (
    <PageContainer>
      <Container>
        <Header
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Title>Welcome back, {user.name?.split(' ')[0]}!</Title>
          <Subtitle>Manage your wedding invitations and create new ones</Subtitle>
        </Header>

        <UserInfo
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <UserDetails>
            <Avatar>
              {user.picture ? (
                <img src={user.picture} alt={user.name} />
              ) : (
                user.name?.charAt(0) || 'U'
              )}
            </Avatar>
            <UserText>
              <h3>{user.name}</h3>
              <p>{user.email}</p>
            </UserText>
          </UserDetails>

          {user.premium ? (
            <PremiumBadge>
              <FiStar />
              Premium Member
            </PremiumBadge>
          ) : (
            <UpgradeButton
              onClick={handleUpgradeToPremium}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiStar />
              Upgrade to Premium
            </UpgradeButton>
          )}
        </UserInfo>

        <ActionsGrid>
          {actions.map((action, index) => (
            <ActionCard
              key={index}
              onClick={action.onClick}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <ActionIcon>
                <action.icon />
              </ActionIcon>
              <ActionTitle>
                {action.title}
                {action.premium && <FiStar style={{ marginLeft: '0.5rem', color: '#ffd700' }} />}
              </ActionTitle>
              <ActionDescription>{action.description}</ActionDescription>
            </ActionCard>
          ))}
        </ActionsGrid>

        <InvitationsSection>
          <SectionTitle>Your Invitations</SectionTitle>
          
          {loading ? (
            <LoadingSpinner>
              <div className="spinner"></div>
            </LoadingSpinner>
          ) : invitations.length === 0 ? (
            <EmptyState>
              <h3>No invitations yet</h3>
              <p>Create your first wedding invitation to get started!</p>
              <Link to="/" style={{ color: 'inherit', textDecoration: 'underline' }}>
                Browse Templates
              </Link>
            </EmptyState>
          ) : (
            <InvitationsGrid>
              {invitations.map((invitation, index) => (
                <InvitationCard
                  key={invitation.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                >
                  <InvitationPreview>
                    {invitation.invitation_data.bride_name} & {invitation.invitation_data.groom_name}
                    <br />
                    <small>{invitation.invitation_data.wedding_date}</small>
                  </InvitationPreview>
                  
                  <InvitationInfo>
                    <InvitationTitle>
                      {invitation.invitation_data.bride_name} & {invitation.invitation_data.groom_name}
                    </InvitationTitle>
                    <InvitationMeta>
                      Created {new Date(invitation.created_at).toLocaleDateString()}
                      <br />
                      {invitation.invitation_data.venue_name}
                    </InvitationMeta>
                    
                    <InvitationActions>
                      <ActionBtn
                        as={Link}
                        to={`/i/${invitation.url_slug}`}
                        target="_blank"
                      >
                        <FiEye />
                        View
                      </ActionBtn>
                      
                      <ActionBtn
                        onClick={() => copyInvitationUrl(invitation.url_slug)}
                      >
                        <FiShare2 />
                        Share
                      </ActionBtn>
                    </InvitationActions>
                  </InvitationInfo>
                </InvitationCard>
              ))}
            </InvitationsGrid>
          )}
        </InvitationsSection>
      </Container>
    </PageContainer>
  );
};

export default DashboardPage;