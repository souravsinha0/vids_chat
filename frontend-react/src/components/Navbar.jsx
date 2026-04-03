import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Avatar, Menu, MenuItem,
  IconButton, Box, Divider, ListItemIcon
} from '@mui/material';
import { VideoLibrary, Logout, Person, KeyboardArrowDown } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);

  const handleLogout = () => {
    setAnchor(null);
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky" elevation={0} sx={{
      background: 'linear-gradient(135deg, #1e293b 0%, #1e3a5f 60%, #1d4ed8 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      <Toolbar sx={{ gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
          <Box sx={{ p: 0.5, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 1.5, display: 'flex' }}>
            <VideoLibrary sx={{ color: '#93c5fd', fontSize: 22 }} />
          </Box>
          {/* <Typography
            variant="h6"
            fontWeight={800}
            sx={{ flexGrow: 0, cursor: 'pointer', color: '#fff', letterSpacing: '-0.3px' }}
            onClick={() => navigate('/')}
          >
            Video<span style={{ color: '#93c5fd' }}>AI</span>
          </Typography> */}
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ flexGrow: 0, cursor: 'pointer', color: '#fff', letterSpacing: '-0.3px' }}
            onClick={() => navigate('/')}
          >
            {/* VELOCIS Branding */}
            Velocis<span style={{ color: '#93c5fd', fontWeight: 400 }}>Sight</span>
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />

        {user && (
          <>
            <IconButton onClick={(e) => setAnchor(e.currentTarget)} size="small"
              sx={{ gap: 0.75, px: 1, py: 0.5, borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <Avatar sx={{ width: 30, height: 30, bgcolor: '#3b82f6', fontSize: 13, fontWeight: 700 }}>
                {user.username?.[0]?.toUpperCase()}
              </Avatar>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, color: '#e2e8f0', fontWeight: 500 }}>
                {user.username}
              </Typography>
              <KeyboardArrowDown fontSize="small" sx={{ color: '#94a3b8' }} />
            </IconButton>

            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{ elevation: 4, sx: { mt: 0.5, minWidth: 180, borderRadius: 2, border: '1px solid', borderColor: 'divider' } }}
            >
              <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50' }}>
                <Typography variant="body2" fontWeight={700} color="text.primary">{user.username}</Typography>
                <Typography variant="caption" color="text.secondary">{user.email}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ py: 1.25, color: 'error.main' }}>
                <ListItemIcon><Logout fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
                Sign out
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
