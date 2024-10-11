'use client';

import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, Button, Popover, IconButton, Tooltip } from '@mui/material';
import Link from 'next/link';
import UploadIcon from '@mui/icons-material/Upload';
import ListIcon from '@mui/icons-material/List';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useRouter } from 'next/navigation';
import { deleteCookie } from 'cookies-next';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useAuth } from '@/contexts/AuthContext';

const NavBar: React.FC = () => {
  const router = useRouter();
  const { pubKeyHash, setPubKeyHash } = useAuth();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [copyTooltip, setCopyTooltip] = useState('Copy to clipboard');

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    handleClosePopover();
    deleteCookie('pubKeyHash');
    setPubKeyHash(null);

    router.push('/');
  };

  const handleCopy = () => {
    setCopyTooltip('Copied!');
    setTimeout(() => setCopyTooltip('Copy to clipboard'), 1500);
  };

  const open = Boolean(anchorEl);

  return (
    <AppBar position="static" sx={{ mb: 2 }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--primary-color)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Typography variant="h4" component="h1" sx={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
            🪄 CKB Multisig Wizard
          </Typography>
        </Link>
        {pubKeyHash && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button sx={{ color: 'white' }} variant="text" component={Link} href="/list">
              <ListIcon sx={{ mr: 1 }} />
            Transactions
            </Button>
            <Button sx={{ ml: 2, color: 'white' }} variant="text" component={Link} href="/upload">
              <UploadIcon sx={{ mr: 1 }} />
            Upload Tx
            </Button>
            <Button
              sx={{ ml: 2, color: 'white' }}
              onClick={handleOpenPopover}
            >
              {pubKeyHash.slice(0, 6)}...{pubKeyHash.slice(-6)}
            </Button>
          </Box>
        )}
      </Toolbar>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ mr: 1 }}>
              {pubKeyHash}
            </Typography>
            <CopyToClipboard text={pubKeyHash || ''} onCopy={handleCopy}>
              <Tooltip title={copyTooltip}>
                <IconButton size="small">
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </CopyToClipboard>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'end' }}>
            <Button onClick={handleSignOut} variant="contained" color="error">
              Sign Out
            </Button>
          </Box>
        </Box>
      </Popover>
    </AppBar>
  );
};

export default NavBar;
