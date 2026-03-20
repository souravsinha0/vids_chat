import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Grid, Card, CardContent, CardActions,
  LinearProgress, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  Tooltip, Skeleton, Divider, Paper
} from '@mui/material';
import {
  Delete, Chat, CloudUpload, VideoLibrary, AccessTime,
  CheckCircle, Error, HourglassEmpty, Sync, AutoAwesome
} from '@mui/icons-material';
import { videoAPI } from '../services/api';
import { toast } from 'react-toastify';
import VideoUpload from '../components/VideoUpload';
import Navbar from '../components/Navbar';

const STATUS_CONFIG = {
  pending:    { color: 'default',  icon: <HourglassEmpty sx={{ fontSize: 14 }} />, label: 'Pending' },
  processing: { color: 'primary',  icon: <Sync sx={{ fontSize: 14 }} />,           label: 'Processing' },
  completed:  { color: 'success',  icon: <CheckCircle sx={{ fontSize: 14 }} />,    label: 'Completed' },
  failed:     { color: 'error',    icon: <Error sx={{ fontSize: 14 }} />,           label: 'Failed' },
};

function VideoCard({ video, onDelete, onNavigate }) {
  const cfg = STATUS_CONFIG[video.status] || STATUS_CONFIG.pending;
  const isProcessing = video.status === 'processing';
  const isCompleted = video.status === 'completed';

  return (
    <Card elevation={0} sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2.5,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 0.2s, transform 0.2s',
      bgcolor: 'background.paper',
      '&:hover': { boxShadow: '0 8px 24px rgba(37,99,235,0.10)', transform: 'translateY(-3px)' }
    }}>
      {/* Colored top bar by status */}
      <Box sx={{
        height: 5,
        background: isCompleted
          ? 'linear-gradient(90deg, #059669, #10b981)'
          : isProcessing
          ? 'linear-gradient(90deg, #2563eb, #7c3aed)'
          : video.status === 'failed'
          ? 'linear-gradient(90deg, #dc2626, #ef4444)'
          : 'linear-gradient(90deg, #cbd5e1, #e2e8f0)',
        borderRadius: '10px 10px 0 0'
      }} />

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* File icon + name */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
          <Box sx={{
            p: 1,
            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
            borderRadius: 1.5,
            display: 'flex',
            flexShrink: 0,
            border: '1px solid #bfdbfe'
          }}>
            <VideoLibrary sx={{ color: '#2563eb', fontSize: 22 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Tooltip title={video.filename}>
              <Typography variant="subtitle2" fontWeight={600} noWrap color="text.primary">
                {video.filename}
              </Typography>
            </Tooltip>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
              <AccessTime sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled">
                {new Date(video.upload_time).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Status chip */}
        <Chip
          icon={cfg.icon}
          label={cfg.label}
          color={cfg.color}
          size="small"
          variant="outlined"
          sx={{ mb: 1 }}
        />

        {/* Progress bar */}
        {isProcessing && (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Processing…</Typography>
              <Typography variant="caption" color="primary.main" fontWeight={600}>{video.progress}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={video.progress}
              sx={{ borderRadius: 1, height: 5, bgcolor: '#dbeafe', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#2563eb,#7c3aed)' } }} />
          </Box>
        )}

        {/* Summary preview */}
        {video.summary && (
          <Box sx={{ mt: 1.5, p: 1.25, background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', borderRadius: 1.5, border: '1px solid #a7f3d0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <AutoAwesome sx={{ fontSize: 12, color: '#059669' }} />
              <Typography variant="caption" fontWeight={700} color="#047857">Summary ready</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {video.summary}
            </Typography>
          </Box>
        )}

        {/* Error */}
        {video.error && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
            {video.error}
          </Typography>
        )}
      </CardContent>

      <Divider sx={{ borderColor: 'grey.100' }} />
      <CardActions sx={{ px: 2, py: 1.25, justifyContent: 'space-between', bgcolor: 'grey.50', borderRadius: '0 0 10px 10px' }}>
        <Button
          size="small"
          variant={isCompleted ? 'contained' : 'outlined'}
          startIcon={<Chat />}
          disabled={!isCompleted}
          onClick={() => onNavigate(video.id)}
          disableElevation
          sx={isCompleted ? { background: 'linear-gradient(135deg,#2563eb,#7c3aed)', '&:hover': { background: 'linear-gradient(135deg,#1d4ed8,#6d28d9)' } } : {}}
        >
          Chat
        </Button>
        <Tooltip title="Delete video">
          <IconButton size="small" color="error" onClick={() => onDelete(video.id)}
            sx={{ '&:hover': { bgcolor: '#fee2e2' } }}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}

export default function Dashboard() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const navigate = useNavigate();

  const fetchVideos = async () => {
    try {
      const response = await videoAPI.list();
      setVideos(response.data);
    } catch {
      toast.error('Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
    // Only poll if there are videos still processing
    const interval = setInterval(() => {
      setVideos(prev => {
        const hasProcessing = prev.some(v => v.status === 'pending' || v.status === 'processing');
        if (hasProcessing) fetchVideos();
        return prev;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this video and all its chat history?')) return;
    try {
      await videoAPI.delete(id);
      toast.success('Video deleted');
      setVideos(prev => prev.filter(v => v.id !== id));
    } catch {
      toast.error('Failed to delete video');
    }
  };

  const stats = {
    total: videos.length,
    completed: videos.filter(v => v.status === 'completed').length,
    processing: videos.filter(v => v.status === 'processing' || v.status === 'pending').length,
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(160deg, #eef2ff 0%, #e0e7ff 40%, #ede9fe 100%)' }}>
      <Navbar />

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="text.primary">My Videos</Typography>
            <Typography variant="body2" color="text.secondary">Upload videos to summarize and chat with AI</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setUploadOpen(true)}
            disableElevation
            sx={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', '&:hover': { background: 'linear-gradient(135deg,#1d4ed8,#6d28d9)' }, borderRadius: 2, px: 2.5 }}
          >
            Upload Video
          </Button>
        </Box>

        {/* Stats row */}
        {!loading && videos.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {[
              { label: 'Total Videos',  value: stats.total,      bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '#bfdbfe', color: '#1d4ed8' },
              { label: 'Completed',     value: stats.completed,  bg: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '#6ee7b7', color: '#047857' },
              { label: 'Processing',    value: stats.processing, bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '#fcd34d', color: '#b45309' },
            ].map(s => (
              <Grid item xs={4} key={s.label}>
                <Paper elevation={0} sx={{ p: 2, background: s.bg, border: '1px solid', borderColor: s.border, borderRadius: 2.5, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Video grid */}
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3].map(i => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2.5 }} />
              </Grid>
            ))}
          </Grid>
        ) : videos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <Box sx={{ display: 'inline-flex', p: 3, background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius: '50%', mb: 2 }}>
              <VideoLibrary sx={{ fontSize: 48, color: '#2563eb' }} />
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>No videos yet</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
              Upload your first video to get started
            </Typography>
            <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setUploadOpen(true)} disableElevation
              sx={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', '&:hover': { background: 'linear-gradient(135deg,#1d4ed8,#6d28d9)' } }}>
              Upload Video
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {videos.map(video => (
              <Grid item xs={12} sm={6} md={4} key={video.id}>
                <VideoCard video={video} onDelete={handleDelete} onNavigate={(id) => navigate(`/video/${id}`)} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderBottom: '1px solid #bfdbfe' }}>Upload Video</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <VideoUpload onSuccess={() => { setUploadOpen(false); fetchVideos(); }} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
