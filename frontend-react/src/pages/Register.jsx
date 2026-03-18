import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, Alert, InputAdornment, IconButton } from '@mui/material';
import { VideoLibrary, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register(form.email, form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper elevation={0} sx={{ p: 4, width: '100%', maxWidth: 400, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <VideoLibrary sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" fontWeight={700}>VideoAI</Typography>
          <Typography variant="body2" color="text.secondary">Create your account</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Email" type="email" value={form.email} onChange={set('email')} margin="normal" required />
          <TextField fullWidth label="Username" value={form.username} onChange={set('username')} margin="normal" required />
          <TextField fullWidth label="Password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')} margin="normal" required
            InputProps={{ endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPwd(p => !p)} edge="end" size="small">
                  {showPwd ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )}}
          />
          <TextField fullWidth label="Confirm Password" type="password" value={form.confirm} onChange={set('confirm')} margin="normal" required />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2.5, mb: 1.5, py: 1.2, borderRadius: 2 }}
            disabled={loading} disableElevation>
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>
          <Typography variant="body2" align="center" color="text.secondary">
            Already have an account? <Link to="/login" style={{ color: 'inherit', fontWeight: 600 }}>Sign in</Link>
          </Typography>
        </form>
      </Paper>
    </Box>
  );
}
