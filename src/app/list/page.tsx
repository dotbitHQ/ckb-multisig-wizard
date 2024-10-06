"use client"

import React, { useEffect, useState } from 'react';
import { Grid2 as Grid, Snackbar, Alert } from '@mui/material';
import { DbTransaction } from '@/lib/database';
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import LedgerCkb from "@linkdesu/hw-app-ckb";
import TransactionSidebar from './TransactionSidebar';
import TransactionMain from './TransactionMain';

let lckb: LedgerCkb | null = null;

export default function Page() {
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<DbTransaction | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [openAlert, setOpenAlert] = useState(false);
  const [ledgerLockArgs, setLedgerLockArgs] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isPushingTx, setIsPushingTx] = useState(false);

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

  const handleSelectTransaction = async (id: string) => {
    console.info(`Selected transaction: ${id}`);
    try {
      const response = await fetch(`/api/tx/${id}`);
      const data = await response.json();
      setSelectedTransaction(data.result);
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
      const updatedTransaction = { ...selectedTransaction };
      const newSignature = {
        lock_args: selectedSighashAddress,
        signature: signature.startsWith('0x') ? signature : `0x${signature}`
      };

      const existingSignatureIndex = updatedTransaction.signed.findIndex(sig => sig.lock_args === newSignature.lock_args);
      if (existingSignatureIndex !== -1) {
        updatedTransaction.signed[existingSignatureIndex] = newSignature;
      } else {
        updatedTransaction.signed.push(newSignature);
      }

      const response = await fetch(`/api/tx/${selectedTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTransaction),
      });

      if (!response.ok) {
        throw new Error('Server error');
      }

      setSelectedTransaction(updatedTransaction);
      setTransactions(prevTransactions =>
        prevTransactions.map(tx =>
          tx.id === updatedTransaction.id ? updatedTransaction : tx
        )
      );

      if (updatedTransaction.signed.length >= updatedTransaction.multisig_config.config.threshold) {
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
      if (!lckb) {
        let transport;
        try {
          transport = await TransportWebHID.create();
        } catch (_) {
          console.warn('Failed to connect with WebHID, try WebUSB...');
          transport = await TransportWebUSB.create();
        }
        lckb = new LedgerCkb(transport);
      }

      setOpenAlert(true);

      const keydata = await lckb.getWalletPublicKey("44'/309'/0'", false);
      setLedgerLockArgs(keydata.lockArg);

      const signature = await lckb.signMessageHash("44'/309'/0'", selectedTransaction.digest.replace(/^0x/, ''));

      await handleSignatureSubmit(signature, keydata.lockArg);

      if (selectedTransaction.signed.length >= selectedTransaction.multisig_config.config.threshold) {
        await handlePushTx();
      } else {
        setSuccessAlert('Ledger signature submitted successfully');
      }
    } catch (error) {
      console.error('Error signing with ledger:', error);
      setErrorAlert(`Error signing with ledger: ${error}`);
      setLedgerLockArgs(null);
    } finally {
      setOpenAlert(false);
    }
  };

  useEffect(() => {
    if (selectedTransaction) {
      handleLoadStatus();
    }
  }, [selectedTransaction]);

  const handleLoadStatus = async () => {
    if (!selectedTransaction || isLoadingStatus) {
      return;
    }

    setIsLoadingStatus(true);

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
    } finally {
      setIsLoadingStatus(false);
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
