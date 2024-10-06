import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, FormControl, InputLabel, Select, MenuItem, Chip, CircularProgress, Stack, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DbTransaction } from '@/lib/database';
import SignerList from './SignerList';
import SendIcon from '@mui/icons-material/Send';

interface User {
  name: string;
  pubKeyHash: string;
}

interface TransactionDetailProps {
  tx: DbTransaction;
  onSignatureSubmit: (signature: string, selectedSighashAddress: string) => void;
  onLedgerSign: () => void;
  onLoadStatus: () => void;
  onPushTx: () => void;
  txStatus: string | null;
  isLoadingStatus: boolean;
  isPushingTx: boolean;
}

export default function TransactionMain({
  tx,
  onSignatureSubmit,
  onLedgerSign,
  onLoadStatus,
  onPushTx,
  txStatus,
  isLoadingStatus,
  isPushingTx,
}: TransactionDetailProps) {
  const [signature, setSignature] = useState('');
  const [selectedSighashAddress, setSelectedSighashAddress] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/user');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }

    fetchUsers();
  }, []);

  const handleManualSignatureSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSignatureSubmit(signature, selectedSighashAddress);
    setSignature('');
    setSelectedSighashAddress('');
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'committed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'proposed':
        return 'info';
      case 'unknown':
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Transaction Details */}
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table sx={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '80%' }} />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell colSpan={2}>
                <Typography variant="h6">Transaction Details</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Database ID</TableCell>
              <TableCell>{tx.id}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>TX Hash</TableCell>
              <TableCell sx={{ fontFamily: 'monospace', overflowX: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  {process.env.NEXT_PUBLIC_ENV === 'mainnet' ? (
                    <a href={`https://explorer.nervos.org/transaction/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer">{tx.tx_hash}</a>
                  ) : (
                    <a href={`https://pudge.explorer.nervos.org/transaction/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer">{tx.tx_hash}</a>
                  )}
                </Box>
                <Box>
                  {txStatus && (
                    <Chip
                      label={txStatus}
                      color={getStatusChipColor(txStatus)}
                      sx={{ mr: 2 }}
                    />
                  )}
                  <Button
                    variant="outlined"
                    startIcon={isLoadingStatus ? <CircularProgress size={20} /> : <RefreshIcon />}
                    onClick={onLoadStatus}
                    disabled={isLoadingStatus}
                  >
                    {isLoadingStatus ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>File Path</TableCell>
              <TableCell>{tx.tx_json_path}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Description</TableCell>
              <TableCell><pre style={{ fontFamily: 'monospace', margin: 0, overflow: 'scroll' }}>{tx.description.trim()}</pre></TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Uploaded At</TableCell>
              <TableCell>{tx.uploaded_at}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Pushed At</TableCell>
              <TableCell>{tx.pushed_at || 'Not pushed yet'}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Multisig Config */}
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table sx={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '80%' }} />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell colSpan={2}>
                <Typography variant="h6">Multisig Config</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Multisig Type</TableCell>
              <TableCell>{tx.multisig_type}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Multisig Script</TableCell>
              <TableCell><pre style={{ fontFamily: 'monospace', margin: 0 }}>{JSON.stringify(tx.multisig_config.script, null, 2)}</pre></TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Signers</TableCell>
              <TableCell>
                <SignerList
                  sighash_addresses={tx.multisig_config.config.sighash_addresses}
                  users={users}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}><Typography color="#c62828" fontWeight="bold">Digest</Typography></TableCell>
              <TableCell><Typography color="#c62828" fontFamily="monospace">{tx.digest}</Typography></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Signatures */}
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table sx={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '80%' }} />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell colSpan={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">
                    Signatures
                    <Typography sx={{ ml: 1, display: 'inline-block', fontSize: '1rem', color: 'secondary.main' }}>({tx.signed.length} / {tx.multisig_config.config.threshold})</Typography>
                  </Typography>
                  <Tooltip title="Push the transaction to the network">
                    <span>
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={isPushingTx ? <CircularProgress size={20} /> : <SendIcon />}
                        onClick={onPushTx}
                        disabled={tx.signed.length < tx.multisig_config.config.threshold || isPushingTx}
                      >
                        {isPushingTx ? 'Pushing...' : 'Push'}
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tx.signed.map((sig, index) => (
              <TableRow key={index}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'right', fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
                  {users.find(user => user.pubKeyHash === sig.lock_args)?.name || sig.lock_args}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', color: '#2e7d32', overflowWrap: 'anywhere' }}>{sig.signature}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Manual Signature Submission Form */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Sign Manually</Typography>
        <form onSubmit={handleManualSignatureSubmit}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="sighash-address-select-label">Sighash Address</InputLabel>
            <Select
              labelId="sighash-address-select-label"
              value={selectedSighashAddress}
              label="Sighash Address"
              onChange={(e) => setSelectedSighashAddress(e.target.value as string)}
              sx={{ fontFamily: 'monospace' }}
            >
              {tx.multisig_config.config.sighash_addresses.map((address, index) => {
                const userName = users.find(user => user.pubKeyHash === address)?.name || 'Unknown';
                return (
                  <MenuItem key={index} value={address} sx={{ fontFamily: 'monospace' }}>
                    {address}({userName})
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            label="Signature"
            variant="outlined"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            sx={{ mb: 2, '& .MuiInputBase-input': { fontFamily: 'monospace' } }}
          />
          <Button type="submit" variant="contained" color="primary">
            Submit Signature
          </Button>
        </form>
      </Paper>

      {/* Ledger Signing Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Sign Automatically with Ledger</Typography>
        <Button variant="contained" color="primary" onClick={onLedgerSign}>
          Sign with Ledger
        </Button>
      </Paper>
    </Box>
  );
}
