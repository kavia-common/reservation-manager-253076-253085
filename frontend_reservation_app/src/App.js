import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import NavBar from './components/NavBar';
import AppRoutes from './router';
import { applyThemeCSSVariables, getFrontendBaseUrl } from './theme';

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');

  // Apply data-theme attribute for legacy styles and inject CSS variables for Champagne theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    applyThemeCSSVariables();
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const basename = getFrontendBaseUrl();

  return (
    <div className="App">
      <div className="bg-gradient">
        <BrowserRouter basename={basename}>
          <NavBar onToggleTheme={toggleTheme} currentTheme={theme} />
          <main className="main-container">
            <AppRoutes />
          </main>
          <footer className="footer">
            <p>© {new Date().getFullYear()} Reservation Manager</p>
          </footer>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
