import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VideoChat from './pages/VideoChat';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary:    { main: '#2563eb', light: '#3b82f6', dark: '#1d4ed8', contrastText: '#fff' },
    secondary:  { main: '#7c3aed', light: '#8b5cf6', dark: '#6d28d9' },
    success:    { main: '#059669', light: '#10b981', dark: '#047857', contrastText: '#fff' },
    warning:    { main: '#d97706', light: '#f59e0b', dark: '#b45309' },
    error:      { main: '#dc2626', light: '#ef4444', dark: '#b91c1c' },
    info:       { main: '#0891b2', light: '#06b6d4', dark: '#0e7490' },
    background: { default: '#eef2ff', paper: '#ffffff' },
    grey: {
      50:  '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    divider: '#e2e8f0',
    text: {
      primary:   '#1e293b',
      secondary: '#475569',
      disabled:  '#94a3b8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton:   { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 } } },
    MuiChip:     { styleOverrides: { root: { fontWeight: 500 } } },
    MuiAppBar:   { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiPaper:    { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiCard:     { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiDrawer:   { styleOverrides: { paper: { backgroundImage: 'none' } } },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/video/:videoId"
              element={
                <PrivateRoute>
                  <VideoChat />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
        <ToastContainer position="bottom-right" autoClose={3000} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
