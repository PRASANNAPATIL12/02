import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

// Import components
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import TemplatePage from './pages/TemplatePage';
import PersonalizePage from './pages/PersonalizePage';
import InvitationPage from './pages/InvitationPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Global Styles
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600;700&family=Dancing+Script:wght@400;500;600;700&family=Lato:wght@300;400;700&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
    background: ${props => props.theme?.background || '#ffffff'};
    color: ${props => props.theme?.text || '#333333'};
  }

  html {
    scroll-behavior: smooth;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    border: none;
    background: none;
    cursor: pointer;
    font-family: inherit;
  }
`;

// Theme configurations
const themes = {
  classic: {
    primary: '#1a1a1a',
    secondary: '#f8f6f0',
    accent: '#d4af37',
    text: '#333333',
    textLight: '#666666',
    background: '#ffffff',
    gradientPrimary: 'linear-gradient(135deg, #f8f6f0 0%, #ffffff 100%)',
    gradientAccent: 'linear-gradient(135deg, #d4af37 0%, #f4e4a6 100%)',
    fontPrimary: "'Playfair Display', serif",
    fontSecondary: "'Inter', sans-serif",
  },
  modern: {
    primary: '#2c2c2c',
    secondary: '#f5f5f5',
    accent: '#ff6b6b',
    text: '#2c2c2c',
    textLight: '#757575',
    background: '#ffffff',
    gradientPrimary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradientAccent: 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)',
    fontPrimary: "'Montserrat', sans-serif",
    fontSecondary: "'Inter', sans-serif",
  },
  boho: {
    primary: '#8b4513',
    secondary: '#f4f1e8',
    accent: '#cd853f',
    text: '#5d4037',
    textLight: '#8d6e63',
    background: '#fefefe',
    gradientPrimary: 'linear-gradient(135deg, #d7ccc8 0%, #f4f1e8 100%)',
    gradientAccent: 'linear-gradient(135deg, #cd853f 0%, #ddbf8a 100%)',
    fontPrimary: "'Dancing Script', cursive",
    fontSecondary: "'Lato', sans-serif",
  }
};

const AppContainer = styled.div`
  min-height: 100vh;
  position: relative;
`;

// Auth Context
const AuthContext = React.createContext();

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('session_token'));

  useEffect(() => {
    if (sessionToken) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [sessionToken]);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (sessionId) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/auth/google`, {
        session_id: sessionId
      });
      
      const { user: userData, session_token } = response.data;
      setUser(userData);
      setSessionToken(session_token);
      localStorage.setItem('session_token', session_token);
      
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setSessionToken(null);
    localStorage.removeItem('session_token');
  };

  const value = {
    user,
    loading,
    sessionToken,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

function App() {
  const [currentTheme, setCurrentTheme] = useState('classic');

  // Initialize templates on app start
  useEffect(() => {
    const initTemplates = async () => {
      try {
        await axios.post(`${API}/init-templates`);
      } catch (error) {
        console.error('Failed to initialize templates:', error);
      }
    };
    initTemplates();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider theme={themes[currentTheme]}>
        <GlobalStyle theme={themes[currentTheme]} />
        <AppContainer>
          <Router>
            <Header currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/templates/:id" element={<TemplatePage />} />
                <Route path="/personalize/:templateId" element={<PersonalizePage />} />
                <Route path="/i/:slug" element={<InvitationPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
              </Routes>
            </AnimatePresence>
          </Router>
        </AppContainer>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;