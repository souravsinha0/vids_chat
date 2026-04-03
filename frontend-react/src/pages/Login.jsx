import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, Alert, InputAdornment, IconButton } from '@mui/material';
import { VideoLibrary, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper elevation={0} sx={{ p: 4, width: '100%', maxWidth: 400, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <VideoLibrary sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" fontWeight={700}>Velocis Sight</Typography>
          <Typography variant="body2" color="text.secondary">Sign in to your account</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Email" type="email" value={email}
            onChange={e => setEmail(e.target.value)} margin="normal" required />
          <TextField fullWidth label="Password" type={showPwd ? 'text' : 'password'} value={password}
            onChange={e => setPassword(e.target.value)} margin="normal" required
            InputProps={{ endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPwd(p => !p)} edge="end" size="small">
                  {showPwd ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )}}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2.5, mb: 1.5, py: 1.2, borderRadius: 2 }}
            disabled={loading} disableElevation>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
          <Typography variant="body2" align="center" color="text.secondary">
            Don't have an account? <Link to="/register" style={{ color: 'inherit', fontWeight: 600 }}>Register</Link>
          </Typography>
        </form>
      </Paper>
    </Box>
  );
}
