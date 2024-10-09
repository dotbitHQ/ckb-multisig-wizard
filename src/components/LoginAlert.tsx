'use client';

import React, { useEffect } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { useSearchParams } from 'next/navigation';

interface LoginAlertProps {
  message: string | null;
  onOpen: (message: string) => void;
  onClose: () => void;
}

const LoginAlert: React.FC<LoginAlertProps> = ({ message, onOpen, onClose }) => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      onOpen(error);
    }
  }, [searchParams, onOpen]);

  return (
    <Snackbar
      open={!!message}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity="error" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default LoginAlert;
