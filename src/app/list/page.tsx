"use client"

import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert, TextField, FormControl, InputLabel, Select, MenuItem, Snackbar, Chip } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Grid from '@mui/material/Grid2';
import SyncIcon from '@mui/icons-material/Sync';
import { TreeViewBaseItem } from '@mui/x-tree-view/models';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { DbSignature, DbTransaction } from '@/lib/database';
import RefreshIcon from '@mui/icons-material/Refresh';
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import LedgerCkb from "@linkdesu/hw-app-ckb";

let lckb: LedgerCkb | null = null;

export default function Page() {
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<DbTransaction | null>(null);
  const [signature, setSignature] = useState('');
  const [selectedSighashAddress, setSelectedSighashAddress] = useState('');
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [openAlert, setOpenAlert] = useState(false);
  const [ledgerLockArgs, setLedgerLockArgs] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/tx');
      const data = await response.json();
      if (data.result) {
        setTransactions(data.result);
      } else {
        console.error('Error fetching transactions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTreeItems = (): TreeViewBaseItem[] => {
    const groupedByDate: Record<string, DbTransaction[]> = {};
    transactions.forEach(tx => {
      // Parse the uploaded_at string to a Date object
      const txDate = parseISO(tx.uploaded_at);
      const date = formatInTimeZone(txDate, 'UTC', 'yyyy-MM-dd');

      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(tx);
    });

    return Object.entries(groupedByDate).map(([date, txs]) => ({
      id: date,
      label: date,
      children: txs.map(tx => ({
        id: tx.id,
        label: tx.tx_json_path.split('/').pop() || 'Unknown',
      })),
    }));
  };

  const handleItemClick = async (_: React.MouseEvent, itemId: string) => {
    try {
      const response = await fetch(`/api/tx/${itemId}`);
      const data = await response.json();
      setSelectedTransaction(data.result);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      setErrorAlert(`Error fetching transaction: ${error}`);
    }
  };

  const updateTransaction = (selectedTransaction: DbTransaction, lock_args: string, signature: string) => {
    // Create a new signature object and ensure the signature starts with '0x'
    const newSignature: DbSignature = {
      lock_args,
      signature: signature.startsWith('0x') ? signature : `0x${signature}`
    };

    const updatedTransaction = { ...selectedTransaction };
    const existingSignatureIndex = updatedTransaction.signed.findIndex(signature => signature.lock_args === newSignature.lock_args);

    let newSign = true;
    if (existingSignatureIndex !== -1) {
      updatedTransaction.signed[existingSignatureIndex] = newSignature;
      newSign = false;
    } else {
      updatedTransaction.signed.push(newSignature);
    }

    return [newSign, updatedTransaction];
  }

  const handleManualSignatureSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedTransaction || !selectedSighashAddress || !signature) {
      setErrorAlert('Missing required information for signature submission');
      return;
    }

    try {
      const updatedTransaction = updateTransaction(selectedTransaction, selectedSighashAddress, signature);

      // Update the transaction in the database
      const response = await fetch(`/api/tx/${selectedTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTransaction),
      });

      if (!response.ok) {
        setErrorAlert('Error submitting signature: server error.');
      } else {
        // Update the local state
        setSelectedTransaction(updatedTransaction);
        setTransactions(prevTransactions =>
          prevTransactions.map(tx =>
            tx.id === updatedTransaction.id ? updatedTransaction : tx
          )
        );
        // Clear the form
        setSignature('');
        setSelectedSighashAddress('');
        // Show success message
        setSuccessAlert('Signature submitted successfully');
      }

    } catch (error) {
      console.error('Error submitting signature:', error);
      setErrorAlert(`Error submitting signature: ${error}`);
    }
  };

  const handleLedgerSign = async () => {
    if (!selectedTransaction) {
      setErrorAlert('No transaction selected');
      return;
    }

    console.info(`Start signing with ledger ...`);

    try {
      if (!lckb) {
        console.info('Init connection with ledger.');

        let transport;
        try {
          // Try WebHID first
          transport = await TransportWebHID.create();
        } catch (_) {
          console.warn('Failed to connect with WebHID, try WebUSB...');
          // Fallback to WebUSB
          transport = await TransportWebUSB.create();
        }

        lckb = new LedgerCkb(transport)
      }

      setOpenAlert(true);

      console.info(`The digest to sign: ${selectedTransaction.digest}`);

      const keydata = await lckb.getWalletPublicKey("44'/309'/0'", false)
      setLedgerLockArgs(keydata.lockArg); // Store the lock_args

      const signature = await lckb.signMessageHash("44'/309'/0'", selectedTransaction.digest.replace(/^0x/, ''))

      console.info(`The keydata returned from ledger:`, keydata);
      console.info(`The signature returned from ledger: ${signature}`);

      const [newSign, updatedTransaction] = updateTransaction(selectedTransaction, keydata.lockArg, signature);

      // Update the transaction in the database
      const response = await fetch(`/api/tx/${selectedTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTransaction),
      });

      if (!response.ok) {
        setErrorAlert('Error submitting signature: server error.');
      } else {
        // Update the local state
        setSelectedTransaction(updatedTransaction);
        setTransactions(prevTransactions =>
          prevTransactions.map(tx =>
            tx.id === updatedTransaction.id ? updatedTransaction : tx
          )
        );

        // Show success message
        setSuccessAlert(newSign ? 'Signature submitted successfully' : 'Signature updated successfully');
      }
    } catch (error) {
      console.error('Error signing with ledger:', error);
      setErrorAlert(`Error signing with ledger: ${error}`);
      setLedgerLockArgs(null); // Reset lock_args on error
    } finally {
      setOpenAlert(false);
    }
  };

  const handlePushTx = async () => {
    if (!selectedTransaction) {
      setErrorAlert('No transaction selected');
      return;
    }

    if (selectedTransaction.signed.length < selectedTransaction.threshold) {
      setErrorAlert('More signature is required');
      return;
    }

    try {
      const response = await fetch(`/api/push/${selectedTransaction.id}`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to push transaction');
      }

      setSuccessAlert('Transaction pushed successfully');

      // Update the local state to reflect the pushed transaction
      const updatedTransaction = { ...selectedTransaction, pushed_at: new Date().toISOString() };
      setSelectedTransaction(updatedTransaction);
      setTransactions(prevTransactions =>
        prevTransactions.map(tx =>
          tx.id === updatedTransaction.id ? updatedTransaction : tx
        )
      );
    } catch (error) {
      console.error('Error pushing transaction:', error);
      setErrorAlert(`Error pushing transaction: ${error}`);
    }
  };

  const handleLoadStatus = async () => {
    if (!selectedTransaction) {
      setErrorAlert('No transaction selected');
      return;
    }

    try {
      const response = await fetch(`/api/tx/${selectedTransaction.id}/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch transaction status');
      }
      const data = await response.json();
      setTxStatus(data.status);
    } catch (error) {
      console.error('Error loading transaction status:', error);
      setErrorAlert(`Error loading transaction status: ${error}`);
    }
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
    <Grid container>
      {/* Sidebar */}
      <Grid size={3} sx={{ bgcolor: 'background.paper', minHeight: '100vh', borderRight: 1, borderColor: 'divider' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <ArrowDownwardIcon sx={{ mr: 1 }} color="success" /> Click a transaction to start
            </Typography>
            <RichTreeView
              items={createTreeItems()}
              onItemClick={handleItemClick}
              sx={{
                '& .MuiTreeItem-content': {
                  cursor: 'pointer',
                },
              }}
            />
          </Box>
        )}
      </Grid>

      {/* Main content */}
      <Grid size={9}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
          <Button variant="contained" startIcon={<SyncIcon />} href="/upload">
            Upload TX
          </Button>
        </Box>

        <Box sx={{ p: 2 }}>
          {selectedTransaction ? (
            <>
              {/* Transaction Details */}
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="h6">Transaction Details</Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Database ID</TableCell>
                      <TableCell>{selectedTransaction.id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Threshold</TableCell>
                      <TableCell>{selectedTransaction.threshold}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>File Path</TableCell>
                      <TableCell>{selectedTransaction.tx_json_path}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Typography color="#c62828" fontWeight="bold">Digest</Typography></TableCell>
                      <TableCell><Typography color="#c62828" fontFamily="monospace">{selectedTransaction.digest}</Typography></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell><pre style={{ fontFamily: 'monospace' }}>{selectedTransaction.description}</pre></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Uploaded At</TableCell>
                      <TableCell>{selectedTransaction.uploaded_at}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Pushed At</TableCell>
                      <TableCell>{selectedTransaction.pushed_at || 'Not pushed yet'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>TX Hash</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        {process.env.NEXT_PUBLIC_ENV === 'mainnet' ? (
                          <a href={`https://explorer.nervos.org/transaction/${selectedTransaction.tx_hash}`} target="_blank">{selectedTransaction.tx_hash}</a>
                        ) : (
                          <a href={`https://pudge.explorer.nervos.org/transaction/${selectedTransaction.tx_hash}`} target="_blank">{selectedTransaction.tx_hash}</a>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {txStatus && (
                            <Chip
                              label={txStatus}
                              color={getStatusChipColor(txStatus)}
                              sx={{ mr: 2 }}
                            />
                          )}
                          <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={handleLoadStatus}
                          >
                            Load Status
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Signatures */}
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Lock Args</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#2e7d32' }}>Signature</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedTransaction.signed.map((sig, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{sig.lock_args}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', color: '#2e7d32' }}>{sig.signature}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* New form for manual signature submission */}
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
                      {selectedTransaction.multisig_config.config.sighash_addresses.map((address, index) => (
                        <MenuItem key={index} value={address} sx={{ fontFamily: 'monospace' }}>
                          {address}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
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

              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Sign Automatically with Ledger</Typography>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button variant="contained" color="primary" onClick={handleLedgerSign}>
                    Sign with Ledger
                  </Button>
                  {ledgerLockArgs && (
                    <>
                      <Typography sx={{ ml: 2 }}>
                        Lock Args(The public key hash of the signed key):
                      </Typography>
                      <Typography sx={{ ml: 2, fontFamily: 'monospace', color: '#1565c0' }}>
                        0x{ledgerLockArgs}
                      </Typography>
                    </>
                  )}
                </Box>
              </Paper>

              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Push Transaction to Network</Typography>

                <Button variant="contained" color="secondary" onClick={handlePushTx}>
                  Push
                </Button>
              </Paper>
            </>
          ) : (
            <Alert severity="info"> Please select a transaction to start signing. </Alert>
          )}
        </Box>
      </Grid>

      {/* Error Alert */}
      <Snackbar
        open={!!errorAlert}
        autoHideDuration={6000}
        onClose={() => setErrorAlert(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setErrorAlert(null)} severity="error" sx={{ width: '100%' }}>
          {errorAlert}
        </Alert>
      </Snackbar>

      {/* Success Alert */}
      <Snackbar
        open={!!successAlert}
        autoHideDuration={6000}
        onClose={() => setSuccessAlert(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessAlert(null)} severity="success" sx={{ width: '100%' }}>
          {successAlert}
        </Alert>
      </Snackbar>

      {/* Ledger Alert */}
      <Snackbar open={openAlert} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="info" sx={{ width: '100%' }}>
          Please confirm signing on your Ledger.
        </Alert>
      </Snackbar>
    </Grid>
  );
}
