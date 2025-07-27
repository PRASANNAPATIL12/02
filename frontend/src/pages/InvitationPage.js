import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiHeart, FiShare2, FiDownload, FiMapPin } from 'react-icons/fi';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.gradientPrimary};
  padding: 2rem;
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const InvitationCard = styled(motion.div)`
  background: white;
  border-radius: 25px;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.15);
  margin-bottom: 3rem;
`;

const TemplateRender = styled.div`
  width: 100%;
  min-height: 600px;
  
  .invitation-container {
    width: 100%;
    height: 100%;
    padding: 3rem;
  }
  
  ${props => props.css}
`;

const ActionBar = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 2rem;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
`;

const ActionButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 12px 24px;
  background: ${props => props.primary ? props.theme.gradientAccent : 'transparent'};
  color: ${props => props.primary ? props.theme.primary : props.theme.accent};
  border: ${props => props.primary ? 'none' : `2px solid ${props.theme.accent}`};
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;

  &:hover {
    transform: translateY(-2px);
    background: ${props => props.primary ? props.theme.gradientAccent : props.theme.accent};
    color: ${props => props.primary ? props.theme.primary : 'white'};
    box-shadow: 0 10px 25px rgba(212, 175, 55, 0.3);
  }
`;

const QRSection = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const QRCode = styled.div`
  display: inline-block;
  padding: 1rem;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;

  img {
    display: block;
    max-width: 150px;
    height: auto;
    border-radius: 10px;
  }
`;

const QRLabel = styled.p`
  color: ${props => props.theme.text};
  font-size: 1rem;
  font-weight: 500;
`;

const Footer = styled(motion.div)`
  text-align: center;
  padding: 2rem;
  color: ${props => props.theme.textLight};
  font-size: 0.9rem;
`;

const PoweredBy = styled(Link)`
  color: ${props => props.theme.accent};
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  transition: color 0.3s ease;

  &:hover {
    color: ${props => props.theme.primary};
  }
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
  
  h2 {
    font-family: ${props => props.theme.fontPrimary};
    font-size: 2rem;
    margin-bottom: 1rem;
    color: ${props => props.theme.primary};
  }
`;

const ShareModal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const ShareContent = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
`;

const ShareTitle = styled.h3`
  font-family: ${props => props.theme.fontPrimary};
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: ${props => props.theme.primary};
`;

const ShareUrl = styled.div`
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 10px;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.9rem;
  word-break: break-all;
  border: 1px solid #ddd;
`;

const CopyButton = styled.button`
  background: ${props => props.theme.gradientAccent};
  color: ${props => props.theme.primary};
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 1rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const CloseButton = styled.button`
  background: transparent;
  color: #666;
  border: 2px solid #ddd;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #999;
    color: #333;
  }
`;

const InvitationPage = () => {
  const { slug } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await axios.get(`${API}/public/invitations/${slug}`);
        setInvitation(response.data.invitation);
        setTemplate(response.data.template);
      } catch (error) {
        console.error('Failed to fetch invitation:', error);
        setError('Invitation not found');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [slug]);

  const renderInvitation = () => {
    if (!invitation || !template) return null;

    const data = invitation.invitation_data;
    const eventsHtml = data.events
      ?.map(event => `<p>${event.name} - ${event.time}</p>`)
      .join('') || '';

    const renderData = {
      bride_name: data.bride_name,
      groom_name: data.groom_name,
      wedding_date: data.wedding_date,
      wedding_time: data.wedding_time,
      venue_name: data.venue_name,
      venue_address: data.venue_address,
      events: eventsHtml,
      qr_code: invitation.qr_code || '<div style="width: 120px; height: 120px; background: #f0f0f0; border-radius: 10px; margin: 1rem auto;"></div>'
    };

    let htmlContent = template.html_content;
    Object.keys(renderData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, renderData[key]);
    });

    return (
      <TemplateRender
        css={template.css_content}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy URL:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handlePrint = () => {
    window.print();
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

  if (error || !invitation) {
    return (
      <PageContainer>
        <Container>
          <ErrorMessage>
            <h2>Invitation Not Found</h2>
            <p>The invitation you're looking for doesn't exist or has been removed.</p>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'underline' }}>
              Create Your Own Invitation
            </Link>
          </ErrorMessage>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Container>
        <InvitationCard
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {renderInvitation()}
        </InvitationCard>

        <ActionBar
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <ActionButtons>
            <ActionButton
              primary
              onClick={handleShare}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiShare2 />
              Share Invitation
            </ActionButton>

            <ActionButton
              onClick={handlePrint}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiDownload />
              Print / Save PDF
            </ActionButton>

            {invitation.invitation_data.venue_address && (
              <ActionButton
                onClick={() => {
                  const address = encodeURIComponent(invitation.invitation_data.venue_address);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiMapPin />
                Get Directions
              </ActionButton>
            )}
          </ActionButtons>

          {invitation.qr_code && (
            <QRSection>
              <QRCode>
                <img src={invitation.qr_code} alt="QR Code" />
              </QRCode>
              <QRLabel>Scan to share this invitation</QRLabel>
            </QRSection>
          )}
        </ActionBar>

        <Footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <PoweredBy to="/">
            <FiHeart />
            Powered by Wedding Invites
          </PoweredBy>
        </Footer>

        {showShareModal && (
          <ShareModal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ShareContent
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <ShareTitle>Share This Invitation</ShareTitle>
              <ShareUrl>{window.location.href}</ShareUrl>
              <div>
                <CopyButton onClick={handleCopyUrl}>
                  {copySuccess ? 'Copied!' : 'Copy URL'}
                </CopyButton>
                <CloseButton onClick={() => setShowShareModal(false)}>
                  Close
                </CloseButton>
              </div>
            </ShareContent>
          </ShareModal>
        )}
      </Container>
    </PageContainer>
  );
};

export default InvitationPage;