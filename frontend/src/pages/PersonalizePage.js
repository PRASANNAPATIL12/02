import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSave, FiEye, FiPlus, FiX } from 'react-icons/fi';
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

const PersonalizeGrid = styled.div`
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 3rem;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const FormSection = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: sticky;
  top: 120px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
`;

const SectionTitle = styled.h2`
  font-family: ${props => props.theme.fontPrimary};
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: ${props => props.theme.primary};
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: ${props => props.theme.text};
  font-size: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: ${props => props.theme.text};
  font-size: 1rem;
  transition: border-color 0.3s ease;
  backdrop-filter: blur(10px);

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accent};
  }

  &::placeholder {
    color: ${props => props.theme.textLight};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: ${props => props.theme.text};
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.3s ease;
  backdrop-filter: blur(10px);

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accent};
  }

  &::placeholder {
    color: ${props => props.theme.textLight};
  }
`;

const EventsSection = styled.div`
  margin-bottom: 2rem;
`;

const EventItem = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
`;

const EventInput = styled(Input)`
  flex: 1;
`;

const RemoveButton = styled.button`
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #ff5252;
    transform: scale(1.1);
  }
`;

const AddEventButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 8px 16px;
  background: transparent;
  color: ${props => props.theme.accent};
  border: 2px dashed ${props => props.theme.accent};
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    background: rgba(212, 175, 55, 0.1);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
`;

const PrimaryButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 15px 24px;
  background: ${props => props.theme.gradientAccent};
  color: ${props => props.theme.primary};
  border: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 1rem;
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

const PersonalizePage = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bride_name: '',
    groom_name: '',
    wedding_date: '',
    wedding_time: '',
    venue_name: '',
    venue_address: '',
    events: [{ name: 'Ceremony', time: '4:00 PM' }],
    rsvp_link: '',
    additional_message: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { returnTo: `/personalize/${templateId}` } });
      return;
    }

    const fetchTemplate = async () => {
      try {
        const response = await axios.get(`${API}/templates/${templateId}`);
        setTemplate(response.data);
      } catch (error) {
        console.error('Failed to fetch template:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId, user, navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEventChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.map((event, i) => 
        i === index ? { ...event, [field]: value } : event
      )
    }));
  };

  const addEvent = () => {
    setFormData(prev => ({
      ...prev,
      events: [...prev.events, { name: '', time: '' }]
    }));
  };

  const removeEvent = (index) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.bride_name || !formData.groom_name) {
      alert('Please fill in the bride and groom names');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post(`${API}/invitations`, {
        template_id: templateId,
        invitation_data: formData
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        }
      });

      navigate(`/i/${response.data.url_slug}`);
    } catch (error) {
      console.error('Failed to save invitation:', error);
      alert('Failed to save invitation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = () => {
    if (!template) return null;

    const eventsHtml = formData.events
      .filter(event => event.name && event.time)
      .map(event => `<p>${event.name} - ${event.time}</p>`)
      .join('');

    const previewData = {
      bride_name: formData.bride_name || 'Bride Name',
      groom_name: formData.groom_name || 'Groom Name',
      wedding_date: formData.wedding_date || 'Wedding Date',
      wedding_time: formData.wedding_time || 'Time',
      venue_name: formData.venue_name || 'Venue Name',
      venue_address: formData.venue_address || 'Venue Address',
      events: eventsHtml || '<p>Event Details</p>',
      qr_code: '<div style="width: 120px; height: 120px; background: #f0f0f0; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 1rem auto; font-size: 0.8rem; color: #666;">QR Code</div>'
    };

    let htmlContent = template.html_content;
    Object.keys(previewData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, previewData[key]);
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

  return (
    <PageContainer>
      <Container>
        <BackButton to={`/templates/${templateId}`}>
          <FiArrowLeft />
          Back to Template
        </BackButton>

        <PersonalizeGrid>
          <FormSection
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <SectionTitle>Personalize Your Invitation</SectionTitle>

            <FormGroup>
              <Label>Bride's Name</Label>
              <Input
                type="text"
                value={formData.bride_name}
                onChange={(e) => handleInputChange('bride_name', e.target.value)}
                placeholder="Enter bride's name"
              />
            </FormGroup>

            <FormGroup>
              <Label>Groom's Name</Label>
              <Input
                type="text"
                value={formData.groom_name}
                onChange={(e) => handleInputChange('groom_name', e.target.value)}
                placeholder="Enter groom's name"
              />
            </FormGroup>

            <FormGroup>
              <Label>Wedding Date</Label>
              <Input
                type="date"
                value={formData.wedding_date}
                onChange={(e) => handleInputChange('wedding_date', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Wedding Time</Label>
              <Input
                type="time"
                value={formData.wedding_time}
                onChange={(e) => handleInputChange('wedding_time', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Venue Name</Label>
              <Input
                type="text"
                value={formData.venue_name}
                onChange={(e) => handleInputChange('venue_name', e.target.value)}
                placeholder="e.g., Sunset Garden Estate"
              />
            </FormGroup>

            <FormGroup>
              <Label>Venue Address</Label>
              <TextArea
                value={formData.venue_address}
                onChange={(e) => handleInputChange('venue_address', e.target.value)}
                placeholder="Full venue address"
              />
            </FormGroup>

            <EventsSection>
              <Label>Events Schedule</Label>
              {formData.events.map((event, index) => (
                <EventItem key={index}>
                  <EventInput
                    type="text"
                    value={event.name}
                    onChange={(e) => handleEventChange(index, 'name', e.target.value)}
                    placeholder="Event name"
                  />
                  <EventInput
                    type="time"
                    value={event.time}
                    onChange={(e) => handleEventChange(index, 'time', e.target.value)}
                  />
                  {formData.events.length > 1 && (
                    <RemoveButton onClick={() => removeEvent(index)}>
                      <FiX />
                    </RemoveButton>
                  )}
                </EventItem>
              ))}
              <AddEventButton onClick={addEvent}>
                <FiPlus />
                Add Event
              </AddEventButton>
            </EventsSection>

            <FormGroup>
              <Label>RSVP Link (Optional)</Label>
              <Input
                type="url"
                value={formData.rsvp_link}
                onChange={(e) => handleInputChange('rsvp_link', e.target.value)}
                placeholder="https://example.com/rsvp"
              />
            </FormGroup>

            <FormGroup>
              <Label>Additional Message (Optional)</Label>
              <TextArea
                value={formData.additional_message}
                onChange={(e) => handleInputChange('additional_message', e.target.value)}
                placeholder="Any special message for your guests..."
              />
            </FormGroup>

            <ActionButtons>
              <PrimaryButton
                onClick={handleSave}
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    <FiSave />
                    Create Invitation
                  </>
                )}
              </PrimaryButton>
            </ActionButtons>
          </FormSection>

          <PreviewSection
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <PreviewContainer>
              {renderPreview()}
            </PreviewContainer>
          </PreviewSection>
        </PersonalizeGrid>
      </Container>
    </PageContainer>
  );
};

export default PersonalizePage;