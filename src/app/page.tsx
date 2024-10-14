'use client';

import React, { useState, Suspense } from 'react';
import { Box, Typography, Button, CircularProgress, TextField } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useRouter } from 'next/navigation';
import { getLedgerCkb } from '@/lib/ledger';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';

const LoginAlert = dynamic(() => import('../components/LoginAlert'), { ssr: false });

export default function LoginPage() {
  const router = useRouter();
  const { pubKeyHash, setPubKeyHash } = useAuth();

  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manualPubKeyHash, setManualPubKeyHash] = useState('');

  const trySignIn = async (pubKeyHash: string) => {
    const response = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ pubKeyHash })
    });

    const res = await response.json();
    if (res.result) {
      setPubKeyHash(pubKeyHash);
      router.push('/list');
    } else {
      setErrorAlert(res.error);
    }
  }

  const handleLedgerSignIn = async () => {
    setIsLoading(true);
    try {
      const lckb = await getLedgerCkb();
      const keydata = await lckb.getWalletPublicKey("44'/309'/0'", false);
      const pubKeyHash = keydata.lockArg.startsWith('0x') ? keydata.lockArg : `0x${keydata.lockArg}`;

      console.log('Signed in with ledger, pubkey hash:', pubKeyHash);

      await trySignIn(pubKeyHash);
    } catch (error) {
      console.error('Error signing in with Ledger:', error);
      setErrorAlert(`Failed to sign in with Ledger: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSignIn = async () => {
    if (manualPubKeyHash.length !== 42 || !manualPubKeyHash.startsWith('0x')) {
      setErrorAlert('Invalid public key hash. It should be 42 characters long and start with 0x.');
      return;
    }

    try {
      console.log('Signed in with manual pubkey hash:', manualPubKeyHash);

      await trySignIn(manualPubKeyHash);
    } catch (error) {
      console.error('Error validating user:', error);
      setErrorAlert('Error validating user. Please try again.');
    }
  };

  const handleGetStarted = () => {
    router.push('/list');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" gutterBottom>
          Welcome to 🪄 CKB Multisig Wizard
        </Typography>
        {pubKeyHash ? (
          <Button
            variant="contained"
            onClick={handleGetStarted}
            sx={{ mt: 2 }}
          >
            Get Started
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              onClick={handleLedgerSignIn}
              disabled={isLoading}
              sx={{ mt: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign in with Ledger'}
            </Button>
            <Typography variant="body1" sx={{ mt: 2, mb: 1 }}>
              Or sign in manually:
            </Typography>
            <Box sx={{ mt: 1, mb: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <TextField
                label="Public Key Hash"
                variant="outlined"
                value={manualPubKeyHash}
                onChange={(e) => setManualPubKeyHash(e.target.value)}
                sx={{ mt: 1, mb: 1, width: '400px' }}
                placeholder="0x..."
              />
              <Button
                variant="contained"
                onClick={handleManualSignIn}
                sx={{ ml: 2, '& .MuiInputBase-input': { fontFamily: 'monospace' } }}
              >
                Sign In
              </Button>
            </Box>
          </>
        )}
      </Box>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          width: '100%',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center" sx={{ fontSize: '16px' }}>
          Code with ❤️ by <a href="https://d.id" target="_blank" style={{ textDecoration: 'none', color: 'inherit' }}>d.id</a> |&nbsp;
          <a href="https://github.com/dotbitHQ/ckb-multisig-wizard" target="_blank" style={{ textDecoration: 'none', color: 'inherit' }}>Contribute on <GitHubIcon sx={{ fontSize: '16px' }} /></a>
        </Typography>
      </Box>

      <Suspense fallback={<div>Loading...</div>}>
        <LoginAlert message={errorAlert} onOpen={setErrorAlert} onClose={() => setErrorAlert(null)} />
      </Suspense>
    </Box>
  );
}
