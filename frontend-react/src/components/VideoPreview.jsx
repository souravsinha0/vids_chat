import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import { Close, PlayArrow, VideoLibrary } from '@mui/icons-material';
import { videoAPI } from '../services/api';

export default function VideoPreview({ videoId, title, height = 170, compact = false }) {
  const [open, setOpen] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const playbackUrl = useMemo(() => videoAPI.getPlaybackUrl(videoId), [videoId]);

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          height,
          borderRadius: compact ? 2 : 2.5,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'rgba(148,163,184,0.22)',
          background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 52%, #ede9fe 100%)',
          cursor: 'pointer',
          '&:hover .video-preview-overlay': { opacity: 1 },
          '&:hover .video-preview-button': { transform: 'translateY(0)' },
        }}
        onClick={() => setOpen(true)}
      >
        {!previewError ? (
          <Box
            component="video"
            src={playbackUrl}
            preload="metadata"
            muted
            playsInline
            onError={() => setPreviewError(true)}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              bgcolor: '#0f172a',
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1d4ed8',
            }}
          >
            <VideoLibrary sx={{ fontSize: compact ? 28 : 40 }} />
          </Box>
        )}

        <Box
          className="video-preview-overlay"
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(15,23,42,0.08) 0%, rgba(15,23,42,0.62) 100%)',
            opacity: 0.94,
            transition: 'opacity 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
        >
          <Box sx={{ textAlign: 'center', color: 'white' }}>
            <IconButton
              className="video-preview-button"
              size="large"
              sx={{
                width: compact ? 52 : 60,
                height: compact ? 52 : 60,
                mb: 1,
                bgcolor: 'rgba(255,255,255,0.16)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(8px)',
                transform: 'translateY(2px)',
                transition: 'transform 0.2s ease, background-color 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
              }}
            >
              <PlayArrow sx={{ fontSize: compact ? 28 : 34 }} />
            </IconButton>
            <Typography variant={compact ? 'body2' : 'subtitle2'} fontWeight={700}>
              Play video
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.82 }}>
              Preview the uploaded file
            </Typography>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            pr: 1,
            background: 'linear-gradient(135deg,#eff6ff,#e0e7ff)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Video preview
            </Typography>
          </Box>
          <IconButton onClick={() => setOpen(false)}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#020617' }}>
          <Box
            component="video"
            src={playbackUrl}
            controls
            autoPlay
            playsInline
            preload="metadata"
            sx={{
              width: '100%',
              maxHeight: '72vh',
              display: 'block',
              bgcolor: '#020617',
            }}
          />
          <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
            <Button size="small" variant="outlined" onClick={() => setOpen(false)} sx={{ borderRadius: 2 }}>
              Close Preview
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
