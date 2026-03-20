import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Paper, CircularProgress,
  IconButton, Divider, Drawer, List, ListItem, ListItemButton,
  ListItemText, ListItemSecondaryAction, Tooltip, Chip, Skeleton,
  Avatar, LinearProgress
} from '@mui/material';
import {
  Send, ArrowBack, AutoAwesome, History, Delete,
  Chat as ChatIcon, AccessTime, SmartToy, Person, Add
} from '@mui/icons-material';
import { videoAPI, chatAPI } from '../services/api';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import MarkdownRenderer from '../components/MarkdownRenderer';

const POLL_INTERVAL = 3000;

export default function VideoChat() {
  const { videoId } = useParams();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  // ── fetch video, auto-poll while summarizing ──────────────────────────────
  const fetchVideo = useCallback(async () => {
    try {
      const res = await videoAPI.get(videoId);
      setVideo(res.data);
      return res.data;
    } catch {
      toast.error('Failed to load video');
      navigate('/');
    }
  }, [videoId, navigate]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  // Poll until summary appears after requesting it
  const startSummaryPoll = useCallback(() => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const v = await fetchVideo();
      if (v?.summary) {
        clearInterval(pollRef.current);
        setSummarizing(false);
        toast.success('Summary ready!');
      }
    }, POLL_INTERVAL);
  }, [fetchVideo]);

  useEffect(() => () => clearInterval(pollRef.current), []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── summarize ─────────────────────────────────────────────────────────────
  const handleSummarize = async () => {
    setSummarizing(true);
    try {
      const res = await videoAPI.summarize(videoId);
      if (res.data.summary) {
        // Already existed
        setVideo(prev => ({ ...prev, summary: res.data.summary }));
        setSummarizing(false);
      } else {
        // Background job started — poll
        startSummaryPoll();
      }
    } catch {
      toast.error('Failed to start summarization');
      setSummarizing(false);
    }
  };

  // ── chat ──────────────────────────────────────────────────────────────────
  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMsg = { role: 'user', content: question, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setChatLoading(true);

    try {
      const res = await chatAPI.ask(videoId, question, sessionId);
      setSessionId(res.data.session_id);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.answer,
        timestamp: new Date().toISOString()
      }]);
    } catch {
      toast.error('Failed to get answer');
      setMessages(prev => prev.slice(0, -1)); // remove optimistic user msg
    } finally {
      setChatLoading(false);
    }
  };

  // ── history ───────────────────────────────────────────────────────────────
  const openHistory = async () => {
    setHistoryOpen(true);
    setLoadingHistory(true);
    try {
      const res = await chatAPI.getSessions(videoId);
      setSessions(res.data);
    } catch {
      toast.error('Failed to load chat history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSession = async (sid) => {
    setHistoryOpen(false);
    try {
      const res = await chatAPI.getMessages(sid);
      setSessionId(sid);
      setMessages(res.data.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      })));
    } catch {
      toast.error('Failed to load session');
    }
  };

  const deleteSession = async (e, sid) => {
    e.stopPropagation();
    try {
      await chatAPI.deleteSession(sid);
      setSessions(prev => prev.filter(s => s.id !== sid));
      if (sessionId === sid) {
        setSessionId(null);
        setMessages([]);
      }
      toast.success('Chat deleted');
    } catch {
      toast.error('Failed to delete chat');
    }
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setHistoryOpen(false);
  };

  // ── render ────────────────────────────────────────────────────────────────
  if (!video) {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(160deg,#eef2ff 0%,#e0e7ff 40%,#ede9fe 100%)' }}>
        <Navbar />
        <Box sx={{ maxWidth: 900, mx: 'auto', px: 3, py: 4 }}>
          <Skeleton variant="rounded" height={120} sx={{ mb: 2, borderRadius: 2.5 }} />
          <Skeleton variant="rounded" height={500} sx={{ borderRadius: 2.5 }} />
        </Box>
      </Box>
    );
  }

  const isReady = video.status === 'completed';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar />

      <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
        {/* Back */}
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/')} sx={{ mb: 2, color: 'text.secondary' }}>
          Back to Videos
        </Button>

        {/* Video info card */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>{video.filename}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <AccessTime sx={{ fontSize: 13, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.disabled">
                  {new Date(video.upload_time).toLocaleString()}
                </Typography>
                <Chip
                  label={video.status}
                  size="small"
                  color={video.status === 'completed' ? 'success' : video.status === 'failed' ? 'error' : 'primary'}
                  variant="outlined"
                  sx={{ ml: 1, height: 20, fontSize: 11 }}
                />
              </Box>
            </Box>

            {/* Summarize button / loader / summary */}
            {!video.summary && (
              <Button
                variant="contained"
                startIcon={summarizing ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
                onClick={handleSummarize}
                disabled={summarizing || !isReady}
                disableElevation
                sx={{ borderRadius: 2, minWidth: 160 }}
              >
                {summarizing ? 'Summarizing…' : 'Generate Summary'}
              </Button>
            )}
          </Box>

          {/* Summary */}
          {summarizing && !video.summary && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress sx={{ borderRadius: 1, mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                AI is analyzing your video — this may take a moment…
              </Typography>
            </Box>
          )}

          {video.summary && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.100' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <AutoAwesome sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="subtitle2" fontWeight={700} color="primary.main">AI Summary</Typography>
              </Box>
              <MarkdownRenderer content={video.summary} />
            </Box>
          )}
        </Paper>

        {/* Chat panel */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, display: 'flex', flexDirection: 'column', height: 520 }}>
          {/* Chat header */}
          <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChatIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight={600}>Chat</Typography>
              {sessionId && (
                <Chip label={`Session #${sessionId}`} size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="New chat">
                <IconButton size="small" onClick={startNewChat}>
                  <Add fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Chat history">
                <IconButton size="small" onClick={openHistory}>
                  <History fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Messages */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
            {messages.length === 0 ? (
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <SmartToy sx={{ fontSize: 48, color: 'text.disabled' }} />
                <Typography variant="body2" color="text.secondary">
                  {isReady ? 'Ask anything about this video' : 'Video is still processing…'}
                </Typography>
              </Box>
            ) : (
              messages.map((msg, idx) => (
                <Box key={idx} sx={{ mb: 2, display: 'flex', gap: 1.5, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                  <Avatar sx={{
                    width: 30, height: 30, flexShrink: 0,
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.200',
                    color: msg.role === 'user' ? 'white' : 'text.primary'
                  }}>
                    {msg.role === 'user' ? <Person sx={{ fontSize: 16 }} /> : <SmartToy sx={{ fontSize: 16 }} />}
                  </Avatar>
                  <Box sx={{
                    maxWidth: '75%',
                    px: 2, py: 1.5,
                    borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                    color: msg.role === 'user' ? 'white' : 'text.primary',
                  }}>
                    {msg.role === 'user'
                      ? <Typography variant="body2">{msg.content}</Typography>
                      : <MarkdownRenderer content={msg.content} />
                    }
                    <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', mt: 0.5, textAlign: 'right', fontSize: 10 }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}

            {/* Typing indicator */}
            {chatLoading && (
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ width: 30, height: 30, bgcolor: 'grey.200' }}>
                  <SmartToy sx={{ fontSize: 16 }} />
                </Avatar>
                <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.100', borderRadius: '4px 16px 16px 16px' }}>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: 20 }}>
                    {[0, 1, 2].map(i => (
                      <Box key={i} sx={{
                        width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled',
                        animation: 'bounce 1.2s infinite',
                        animationDelay: `${i * 0.2}s`,
                        '@keyframes bounce': {
                          '0%,80%,100%': { transform: 'scale(0.8)', opacity: 0.5 },
                          '40%': { transform: 'scale(1.2)', opacity: 1 }
                        }
                      }} />
                    ))}
                  </Box>
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <form onSubmit={handleAsk}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder={isReady ? 'Ask a question about this video…' : 'Video is still processing…'}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  disabled={chatLoading || !isReady}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleAsk(e); }}
                />
                <IconButton
                  type="submit"
                  color="primary"
                  disabled={chatLoading || !question.trim() || !isReady}
                  sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 2, '&:hover': { bgcolor: 'primary.dark' }, '&:disabled': { bgcolor: 'grey.200' } }}
                >
                  <Send fontSize="small" />
                </IconButton>
              </Box>
            </form>
          </Box>
        </Paper>
      </Box>

      {/* History Drawer */}
      <Drawer anchor="right" open={historyOpen} onClose={() => setHistoryOpen(false)}
        PaperProps={{ sx: { width: 320, p: 0 } }}
      >
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700}>Chat History</Typography>
          <Button size="small" startIcon={<Add />} onClick={startNewChat} variant="outlined" sx={{ borderRadius: 2 }}>
            New Chat
          </Button>
        </Box>

        {loadingHistory ? (
          <Box sx={{ p: 2 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} height={60} sx={{ mb: 1 }} />)}
          </Box>
        ) : sessions.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <ChatIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">No previous chats</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {sessions.map((s, idx) => (
              <React.Fragment key={s.id}>
                <ListItem disablePadding secondaryAction={
                  <Tooltip title="Delete chat">
                    <IconButton edge="end" size="small" color="error" onClick={e => deleteSession(e, s.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }>
                  <ListItemButton
                    selected={sessionId === s.id}
                    onClick={() => loadSession(s.id)}
                    sx={{ py: 1.5, pr: 6 }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={sessionId === s.id ? 700 : 400} noWrap>
                          {s.title || `Chat ${idx + 1}`}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <AccessTime sx={{ fontSize: 11 }} />
                          <Typography variant="caption">
                            {new Date(s.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                {idx < sessions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Drawer>
    </Box>
  );
}
