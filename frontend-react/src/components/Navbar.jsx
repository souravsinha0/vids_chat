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
    <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', color: 'text.primary' }}>
      <Toolbar sx={{ gap: 1 }}>
        <VideoLibrary sx={{ color: 'primary.main', mr: 1 }} />
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ flexGrow: 1, cursor: 'pointer', color: 'primary.main' }}
          onClick={() => navigate('/')}
        >
          VideoAI
        </Typography>

        {user && (
          <>
            <IconButton onClick={(e) => setAnchor(e.currentTarget)} size="small" sx={{ gap: 0.5 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                {user.username?.[0]?.toUpperCase()}
              </Avatar>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {user.username}
              </Typography>
              <KeyboardArrowDown fontSize="small" />
            </IconButton>

            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="body2" fontWeight={600}>{user.username}</Typography>
                <Typography variant="caption" color="text.secondary">{user.email}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
