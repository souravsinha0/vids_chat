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
      borderRadius: 2,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 0.2s, transform 0.2s',
      '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
    }}>
      {/* Colored top bar by status */}
      <Box sx={{ height: 4, bgcolor: isCompleted ? 'success.main' : isProcessing ? 'primary.main' : video.status === 'failed' ? 'error.main' : 'grey.300', borderRadius: '8px 8px 0 0' }} />

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* File icon + name */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
          <Box sx={{ p: 1, bgcolor: 'primary.50', borderRadius: 1.5, display: 'flex', flexShrink: 0 }}>
            <VideoLibrary sx={{ color: 'primary.main', fontSize: 22 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Tooltip title={video.filename}>
              <Typography variant="subtitle2" fontWeight={600} noWrap>
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
              <Typography variant="caption" color="primary">{video.progress}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={video.progress} sx={{ borderRadius: 1 }} />
          </Box>
        )}

        {/* Summary preview */}
        {video.summary && (
          <Box sx={{ mt: 1.5, p: 1, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <AutoAwesome sx={{ fontSize: 12, color: 'success.main' }} />
              <Typography variant="caption" fontWeight={600} color="success.dark">Summary ready</Typography>
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

      <Divider />
      <CardActions sx={{ px: 2, py: 1, justifyContent: 'space-between' }}>
        <Button
          size="small"
          variant={isCompleted ? 'contained' : 'outlined'}
          startIcon={<Chat />}
          disabled={!isCompleted}
          onClick={() => onNavigate(video.id)}
          disableElevation
        >
          Chat
        </Button>
        <Tooltip title="Delete video">
          <IconButton size="small" color="error" onClick={() => onDelete(video.id)}>
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar />

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>My Videos</Typography>
            <Typography variant="body2" color="text.secondary">Upload videos to summarize and chat with AI</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setUploadOpen(true)}
            disableElevation
            sx={{ borderRadius: 2 }}
          >
            Upload Video
          </Button>
        </Box>

        {/* Stats row */}
        {!loading && videos.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {[
              { label: 'Total Videos', value: stats.total, color: 'primary.main' },
              { label: 'Completed', value: stats.completed, color: 'success.main' },
              { label: 'Processing', value: stats.processing, color: 'warning.main' },
            ].map(s => (
              <Grid item xs={4} key={s.label}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
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
                <Skeleton variant="rounded" height={200} />
              </Grid>
            ))}
          </Grid>
        ) : videos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <VideoLibrary sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>No videos yet</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
              Upload your first video to get started
            </Typography>
            <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setUploadOpen(true)} disableElevation>
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
        <DialogTitle sx={{ fontWeight: 700 }}>Upload Video</DialogTitle>
        <DialogContent>
          <VideoUpload onSuccess={() => { setUploadOpen(false); fetchVideos(); }} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
