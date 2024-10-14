"use client"

import React, { useEffect, useState } from 'react';
import { Grid2 as Grid, Snackbar, Alert } from '@mui/material';
import { DbTransaction } from '@/lib/database';
import { getLedgerCkb } from '@/lib/ledger';
import TransactionSidebar from './TransactionSidebar';
import TransactionMain from './TransactionMain';

export default function Page() {
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<DbTransaction | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [openAlert, setOpenAlert] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isPushingTx, setIsPushingTx] = useState(false);

  useEffect(() => {
    if (selectedTransaction) {
      if (selectedTransaction.committed_at) {
        setTxStatus('committed');
      } else if (selectedTransaction.rejected_at) {
        setTxStatus('rejected');
      } else {
        handleLoadStatus();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTransaction]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/tx/${id}`);
      const data = await response.json();
      setTransactions(prevTransactions =>
        prevTransactions.map(tx =>
          tx.id === data.result.id ? data.result : tx
        )
      );
      return data.result;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }

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

  const handleLoadStatus = async () => {
    if (!selectedTransaction || isLoadingStatus) {
      return;
    }

    console.log(`Loading status for transaction: ${selectedTransaction.id}`);

    setIsLoadingStatus(true);

    try {
      const response = await fetch(`/api/tx/${selectedTransaction.id}/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch transaction status');
      }
      const data = await response.json();
      setTxStatus(data.status);
      fetchTransaction(selectedTransaction.id);
    } catch (error) {
      console.error('Error loading transaction status:', error);
      setErrorAlert(`Error loading transaction status: ${error}`);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleSelectTransaction = async (id: string) => {
    console.info(`Selected transaction: ${id}`);
    try {
      const tx = await fetchTransaction(id);
      setSelectedTransaction(tx);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      setErrorAlert(`Error fetching transaction: ${error}`);
    }
  };

  const handleSignatureSubmit = async (signature: string, selectedSighashAddress: string) => {
    if (!selectedTransaction) {
      setErrorAlert('No transaction selected');
      return;
    }

    try {
      const response = await fetch(`/api/tx/${selectedTransaction.id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lock_args: selectedSighashAddress,
          signature: signature
        }),
      });

      if (!response.ok) {
        throw new Error('Server error');
      }

      const data = await response.json();
      setSelectedTransaction(data.transaction);
      setTransactions(prevTransactions =>
        prevTransactions.map(tx =>
          tx.id === data.transaction.id ? data.transaction : tx
        )
      );

      if (data.transaction.signed.length >= data.transaction.multisig_config.config.threshold && !data.transaction.pushed_at) {
        await handlePushTx();
      } else {
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

    try {
      const lckb = await getLedgerCkb();
      setOpenAlert(true);

      const keydata = await lckb.getWalletPublicKey("44'/309'/0'", false);
      const signature = await lckb.signMessageHash("44'/309'/0'", selectedTransaction.digest.replace(/^0x/, ''));
      const lockArgs = keydata.lockArg.startsWith('0x') ? keydata.lockArg : `0x${keydata.lockArg}`;

      await handleSignatureSubmit(signature, lockArgs);

      if (selectedTransaction.signed.length >= selectedTransaction.multisig_config.config.threshold) {
        await handlePushTx();
      } else {
        setSuccessAlert('Ledger signature submitted successfully');
      }
    } catch (error) {
      console.error('Error signing with ledger:', error);
      setErrorAlert(`Error signing with ledger: ${error}`);
    } finally {
      setOpenAlert(false);
    }
  };

  const handlePushTx = async () => {
    if (!selectedTransaction) {
      setErrorAlert('No transaction selected');
      return;
    }

    if (selectedTransaction.signed.length < selectedTransaction.multisig_config.config.threshold) {
      setErrorAlert('More signature is required');
      return;
    }

    setIsPushingTx(true);

    try {
      const response = await fetch(`/api/tx/${selectedTransaction.id}/push`, {
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
    } finally {
      setIsPushingTx(false);
    }
  };

  return (
    <Grid container>
      <TransactionSidebar
        transactions={transactions}
        loading={loading}
        onSelectTransaction={handleSelectTransaction}
      />

      {/* Transaction Details */}
      <Grid size={9}>
        {selectedTransaction && (
          <TransactionMain
            tx={selectedTransaction}
            onSignatureSubmit={handleSignatureSubmit}
            onLedgerSign={handleLedgerSign}
            onLoadStatus={handleLoadStatus}
            onPushTx={handlePushTx}
            txStatus={txStatus}
            isLoadingStatus={isLoadingStatus}
            isPushingTx={isPushingTx}
          />
        )}
      </Grid>

      <Snackbar
        open={!!errorAlert}
        onClose={() => setErrorAlert(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setErrorAlert(null)} severity="error" sx={{ width: '100%' }}>
          {errorAlert}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successAlert}
        onClose={() => setSuccessAlert(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessAlert(null)} severity="success" sx={{ width: '100%' }}>
          {successAlert}
        </Alert>
      </Snackbar>

      <Snackbar open={openAlert} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="info" sx={{ width: '100%' }}>
          Please confirm signing on your Ledger.
        </Alert>
      </Snackbar>
    </Grid>
  );
}
