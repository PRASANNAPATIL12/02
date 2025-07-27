import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiHeart, FiStar, FiZap, FiUsers, FiArrowRight } from 'react-icons/fi';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.gradientPrimary};
`;

const HeroSection = styled.section`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 120px 2rem 4rem;
  overflow: hidden;
`;

const HeroBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('https://images.unsplash.com/photo-1606490194859-07c18c9f0968?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80') center/cover;
  opacity: 0.1;
  z-index: -1;
`;

const HeroContent = styled(motion.div)`
  max-width: 900px;
  width: 100%;
`;

const HeroTitle = styled(motion.h1)`
  font-family: ${props => props.theme.fontPrimary};
  font-size: clamp(3rem, 8vw, 5rem);
  font-weight: 300;
  letter-spacing: 2px;
  margin-bottom: 2rem;
  color: ${props => props.theme.primary};
  line-height: 1.2;
`;

const HeroSubtitle = styled(motion.p)`
  font-size: clamp(1.2rem, 3vw, 1.6rem);
  color: ${props => props.theme.textLight};
  margin-bottom: 3rem;
  line-height: 1.6;
`;

const CTAButton = styled(motion(Link))`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 18px 36px;
  background: ${props => props.theme.gradientAccent};
  color: ${props => props.theme.primary};
  text-decoration: none;
  font-weight: 600;
  letter-spacing: 1px;
  border-radius: 50px;
  font-size: 1.1rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 35px rgba(212, 175, 55, 0.4);
  }
`;

const StatsSection = styled.section`
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;

const StatsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 3rem;
  text-align: center;
`;

const StatItem = styled(motion.div)`
  padding: 2rem;
`;

const StatNumber = styled.div`
  font-family: ${props => props.theme.fontPrimary};
  font-size: 3rem;
  font-weight: 600;
  color: ${props => props.theme.accent};
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 1.1rem;
  color: ${props => props.theme.text};
  font-weight: 500;
`;

const TemplatesSection = styled.section`
  padding: 6rem 2rem;
`;

const SectionContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
`;

const SectionTitle = styled(motion.h2)`
  font-family: ${props => props.theme.fontPrimary};
  font-size: 3rem;
  font-weight: 300;
  margin-bottom: 1rem;
  color: ${props => props.theme.primary};
`;

const SectionSubtitle = styled(motion.p)`
  font-size: 1.2rem;
  color: ${props => props.theme.textLight};
  margin-bottom: 4rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const TemplateCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
`;

const TemplateImage = styled.div`
  height: 250px;
  background: url(${props => props.src}) center/cover;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(212, 175, 55, 0.1), rgba(255, 107, 107, 0.1));
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  ${TemplateCard}:hover &::before {
    opacity: 1;
  }
`;

const TemplateInfo = styled.div`
  padding: 2rem;
`;

const TemplateTitle = styled.h3`
  font-family: ${props => props.theme.fontPrimary};
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.primary};
`;

const TemplateDescription = styled.p`
  font-size: 1rem;
  color: ${props => props.theme.textLight};
  line-height: 1.5;
  margin-bottom: 1.5rem;
`;

const TemplatePrice = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PriceBadge = styled.span`
  background: ${props => props.free ? '#10b981' : props.theme.gradientAccent};
  color: ${props => props.free ? 'white' : props.theme.primary};
  padding: 0.5rem 1rem;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: 600;
`;

const FeatureSection = styled.section`
  padding: 6rem 2rem;
  background: rgba(255, 255, 255, 0.05);
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 3rem;
  margin-top: 4rem;
`;

const FeatureCard = styled(motion.div)`
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  color: ${props => props.theme.accent};
  margin-bottom: 1.5rem;
`;

const FeatureTitle = styled.h3`
  font-family: ${props => props.theme.fontPrimary};
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${props => props.theme.primary};
`;

const FeatureDescription = styled.p`
  font-size: 1.1rem;
  color: ${props => props.theme.textLight};
  line-height: 1.6;
`;

const LandingPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get(`${API}/templates`);
        setTemplates(response.data.slice(0, 4)); // Show first 4 templates
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const scrollToTemplates = () => {
    document.getElementById('templates').scrollIntoView({ behavior: 'smooth' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const features = [
    {
      icon: FiZap,
      title: "Lightning Fast",
      description: "Create stunning wedding invitations in minutes, not hours. Our intuitive interface makes it easy."
    },
    {
      icon: FiHeart,
      title: "Beautiful Templates",
      description: "Choose from dozens of professionally designed templates that capture your unique love story."
    },
    {
      icon: FiUsers,
      title: "Easy Sharing",
      description: "Share your invitations instantly via QR codes, links, or download high-quality PDFs."
    },
    {
      icon: FiStar,
      title: "AI-Powered",
      description: "Premium users can generate custom templates using our AI-powered design engine."
    }
  ];

  return (
    <PageContainer>
      <HeroSection>
        <HeroBackground />
        <HeroContent
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <HeroTitle variants={itemVariants}>
            Create Your Perfect
            <br />
            Wedding Invitation
          </HeroTitle>
          
          <HeroSubtitle variants={itemVariants}>
            Design beautiful, personalized wedding invitations in minutes. 
            Choose from elegant templates or let AI create something unique for your special day.
          </HeroSubtitle>
          
          <CTAButton
            variants={itemVariants}
            onClick={scrollToTemplates}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started Free
            <FiArrowRight />
          </CTAButton>
        </HeroContent>
      </HeroSection>

      <StatsSection>
        <StatsContainer>
          <StatItem
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatNumber>10,000+</StatNumber>
            <StatLabel>Invitations Created</StatLabel>
          </StatItem>
          <StatItem
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatNumber>50+</StatNumber>
            <StatLabel>Beautiful Templates</StatLabel>
          </StatItem>
          <StatItem
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatNumber>5,000+</StatNumber>
            <StatLabel>Happy Couples</StatLabel>
          </StatItem>
          <StatItem
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <StatNumber>99%</StatNumber>
            <StatLabel>Satisfaction Rate</StatLabel>
          </StatItem>
        </StatsContainer>
      </StatsSection>

      <TemplatesSection id="templates">
        <SectionContainer>
          <SectionTitle
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Choose Your Perfect Template
          </SectionTitle>
          
          <SectionSubtitle
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            From classic elegance to modern minimalism, find the perfect design 
            that reflects your unique love story.
          </SectionSubtitle>

          {loading ? (
            <div className="loading-spinner" style={{ margin: '3rem auto' }}></div>
          ) : (
            <TemplateGrid>
              {templates.map((template, index) => (
                <TemplateCard
                  key={template.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link to={`/templates/${template.id}`}>
                    <TemplateImage src={template.preview_url} />
                    <TemplateInfo>
                      <TemplateTitle>{template.name}</TemplateTitle>
                      <TemplateDescription>{template.description}</TemplateDescription>
                      <TemplatePrice>
                        <PriceBadge free={!template.is_premium}>
                          {template.is_premium ? 'Premium' : 'Free'}
                        </PriceBadge>
                      </TemplatePrice>
                    </TemplateInfo>
                  </Link>
                </TemplateCard>
              ))}
            </TemplateGrid>
          )}

          <CTAButton
            as={Link}
            to="/templates"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            View All Templates
            <FiArrowRight />
          </CTAButton>
        </SectionContainer>
      </TemplatesSection>

      <FeatureSection>
        <SectionContainer>
          <SectionTitle
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Why Choose Our Platform?
          </SectionTitle>
          
          <FeatureGrid>
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <FeatureIcon>
                  <feature.icon />
                </FeatureIcon>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
              </FeatureCard>
            ))}
          </FeatureGrid>
        </SectionContainer>
      </FeatureSection>
    </PageContainer>
  );
};

export default LandingPage;