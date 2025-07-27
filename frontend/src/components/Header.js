import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiMenu, FiX, FiHeart, FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../App';

const HeaderContainer = styled(motion.header)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: ${props => props.$scrolled ? 
    'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.1)'};
  backdrop-filter: blur(20px);
  border-bottom: ${props => props.$scrolled ? 
    '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'};
  transition: all 0.3s ease;
  padding: 1rem 2rem;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-family: ${props => props.theme.fontPrimary};
  font-size: 1.8rem;
  font-weight: 600;
  color: ${props => props.theme.primary};
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    color: ${props => props.theme.accent};
  }
`;

const Navigation = styled.nav`
  display: flex;
  gap: 2rem;
  align-items: center;

  @media (max-width: 768px) {
    display: ${props => props.$isOpen ? 'flex' : 'none'};
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    padding: 2rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
`;

const NavLink = styled(Link)`
  color: ${props => props.theme.text};
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    color: ${props => props.theme.accent};
  }

  &.active {
    color: ${props => props.theme.accent};
  }

  &.active::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.theme.accent};
  }
`;

const UserMenu = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 25px;
  color: ${props => props.theme.text};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: ${props => props.theme.accent};
  }

  img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }
`;

const LoginButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 10px 20px;
  background: ${props => props.theme.gradientAccent};
  color: ${props => props.theme.primary};
  text-decoration: none;
  font-weight: 600;
  border-radius: 25px;
  transition: all 0.3s ease;
  font-size: 0.9rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(212, 175, 55, 0.3);
  }
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 0.5rem 0;
  min-width: 200px;
  z-index: 1001;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  text-align: left;
  color: ${props => props.theme.text};
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s ease;

  &:hover {
    background: ${props => props.theme.secondary};
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${props => props.theme.text};
  cursor: pointer;

  @media (max-width: 768px) {
    display: block;
  }
`;

const ThemeSelector = styled.select`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  color: ${props => props.theme.text};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accent};
  }
`;

const Header = ({ currentTheme, setCurrentTheme }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/templates', label: 'Templates' }
  ];

  return (
    <HeaderContainer
      scrolled={scrolled}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <HeaderContent>
        <Logo to="/">
          <FiHeart />
          Wedding Invites
        </Logo>

        <Navigation isOpen={mobileMenuOpen}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          
          <ThemeSelector
            value={currentTheme}
            onChange={(e) => setCurrentTheme(e.target.value)}
          >
            <option value="classic">Classic</option>
            <option value="modern">Modern</option>
            <option value="boho">Boho</option>
          </ThemeSelector>
        </Navigation>

        <UserMenu>
          {user ? (
            <>
              <UserButton onClick={() => setUserMenuOpen(!userMenuOpen)}>
                {user.picture ? (
                  <img src={user.picture} alt={user.name} />
                ) : (
                  <FiUser />
                )}
                {user.name}
              </UserButton>
              
              {userMenuOpen && (
                <DropdownMenu
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <DropdownItem onClick={() => { navigate('/dashboard'); setUserMenuOpen(false); }}>
                    <FiSettings />
                    Dashboard
                  </DropdownItem>
                  <DropdownItem onClick={handleLogout}>
                    <FiLogOut />
                    Logout
                  </DropdownItem>
                </DropdownMenu>
              )}
            </>
          ) : (
            <LoginButton to="/login">
              <FiUser />
              Login
            </LoginButton>
          )}
        </UserMenu>

        <MobileMenuButton
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <FiX /> : <FiMenu />}
        </MobileMenuButton>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;