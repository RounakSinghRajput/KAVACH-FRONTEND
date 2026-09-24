import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  return (
    <Box
      sx={{
        mb: 4,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
        pb: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{
            mb: 0.5,
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
            background: 'linear-gradient(135deg, #1565C0 0%, #0288D1 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            {description}
          </Typography>
        )}
      </Box>

      {action && (
        <Button
          variant="contained"
          startIcon={action.icon}
          onClick={action.onClick}
          sx={{
            px: 3,
            py: 1.25,
            fontWeight: 700,
            fontSize: '0.9375rem',
            borderRadius: 2,
            textTransform: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(21, 101, 192, 0.25)',
            background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0D47A1 0%, #01579B 100%)',
              boxShadow: '0 6px 16px rgba(21, 101, 192, 0.35)',
            },
          }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
};
