import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Typography, Box } from '@mui/material';

const tableStyle = {
  borderCollapse: 'collapse',
  width: '100%',
  marginTop: 8,
  marginBottom: 8,
  fontSize: '0.875rem',
};
const thStyle = {
  border: '1px solid #ccc',
  padding: '6px 12px',
  background: '#f5f5f5',
  fontWeight: 600,
  textAlign: 'left',
};
const tdStyle = {
  border: '1px solid #ccc',
  padding: '6px 12px',
};

export default function MarkdownRenderer({ content, color = 'inherit' }) {
  return (
    <Box sx={{ color, '& p': { mt: 0.5, mb: 0.5 }, '& ul,& ol': { pl: 2.5, mt: 0.5, mb: 0.5 }, '& h1,& h2,& h3': { mt: 1, mb: 0.5 } }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <Typography variant="body2" component="p" sx={{ mb: 0.5 }}>{children}</Typography>,
          h1: ({ children }) => <Typography variant="h6" component="h1" sx={{ fontWeight: 700, mt: 1 }}>{children}</Typography>,
          h2: ({ children }) => <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700, mt: 1 }}>{children}</Typography>,
          h3: ({ children }) => <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 700, mt: 0.5 }}>{children}</Typography>,
          ul: ({ children }) => <ul style={{ paddingLeft: 20, marginTop: 4, marginBottom: 4 }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ paddingLeft: 20, marginTop: 4, marginBottom: 4 }}>{children}</ol>,
          li: ({ children }) => <li><Typography variant="body2" component="span">{children}</Typography></li>,
          table: ({ children }) => <table style={tableStyle}>{children}</table>,
          th: ({ children }) => <th style={thStyle}>{children}</th>,
          td: ({ children }) => <td style={tdStyle}>{children}</td>,
          strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
          code: ({ children }) => (
            <code style={{ background: 'rgba(0,0,0,0.08)', borderRadius: 3, padding: '1px 4px', fontSize: '0.8em' }}>
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}
