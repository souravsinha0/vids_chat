import React, { useState } from 'react';
import { Box, Typography, LinearProgress, Alert } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { CloudUpload } from '@mui/icons-material';
import { videoAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function VideoUpload({ onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setError('');
    setProgress(0);

    try {
      await videoAPI.upload(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
      });
      toast.success('Video uploaded successfully!');
      onSuccess?.();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Upload failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.mpeg']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <Box>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.400',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          '&:hover': {
            bgcolor: uploading ? 'background.paper' : 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop video here' : 'Drag & drop video or click to select'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supported formats: MP4, MOV, AVI, MKV, MPEG
        </Typography>
      </Box>

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Uploading... {progress}%
          </Typography>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
