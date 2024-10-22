"use client"

import React, { useMemo, useEffect, useState } from 'react';
import { Grid2 as Grid, Snackbar, Alert } from '@mui/material';
import { DbTransaction } from '@/lib/database';
import { getLedgerCkb } from '@/lib/ledger';
import TransactionSidebar from './TransactionSidebar';
import TransactionMain from './TransactionMain';
import { useRouter, useSearchParams } from 'next/navigation';
import * as util from '@/lib/util';

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<DbTransaction | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);
  const [openAlert, setOpenAlert] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isPushingTx, setIsPushingTx] = useState(false);

  useEffect(() => {
    (async () => {
      console.log('Fetching transactions');
      try {
        const response = await fetch('/api/tx');
        const data = await response.json();
        if (data.result) {
          const txs: DbTransaction[] = data.result;
          setTransactions(txs);

          const txId = searchParams.get('tx');
          if (txId) {
            let tx = txs.find(tx => tx.id === txId);
            if (tx) {
              setSelectedTransaction(tx);
            }
          }
        } else {
          console.error('Error fetching transactions:', data.error);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const txStatus = useMemo(() => {
    if (selectedTransaction) {
      if (selectedTransaction.committed_at) {
        return 'committed';
      } else if (selectedTransaction.rejected_at) {
        return 'rejected';
      } else if (selectedTransaction.pushed_at) {
        return 'pushed';
      } else {
        return 'unknown';
      }
    }

    return null;
  }, [selectedTransaction]);

  const fetchTransaction = async (id: string) => {
    console.log(`Fetching tx: ${id}`);
    try {
      const response = await fetch(`/api/tx/${id}`);
      const data = await response.json();
      if (data.result) {
        return data.result;
      } else {
        throw new Error(data.error || 'Failed to fetch transaction');
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
      setErrorAlert(`Error fetching transaction: ${error}`);
      return null;
    }
  };

  const handleLoadStatus = async () => {
    if (!selectedTransaction || isLoadingStatus) {
      return;
    }

    setIsLoadingStatus(true);

    try {
      const tx = await fetchTransaction(selectedTransaction.id);
      if (tx) {
        setSelectedTransaction(tx);
      }
    } catch (_) {
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleSelectTransaction = async (id: string) => {
    console.info(`Selected transaction: ${id}`);

    router.push(`/list?tx=${id}`);
    const tx = await fetchTransaction(id);
    if (tx) {
      setSelectedTransaction(tx);

      // Update the transactions if the transaction is updated
      const currentTx = transactions.find(prevTx => prevTx.id === tx.id);
      if (!util.isObjectEqual(tx, currentTx)) {
        console.log('Transaction updated, updating local state ...');
        setTransactions(prevTransactions =>
          prevTransactions.map(prevTx =>
            prevTx.id === tx.id ? tx : prevTx
          )
        );
      }
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
      // setTransactions(prevTransactions =>
      //   prevTransactions.map(tx =>
      //     tx.id === data.transaction.id ? data.transaction : tx
      //   )
      // );

      if (data.transaction.signed.length >= data.transaction.multisig_config.config.threshold &&
        !data.transaction.pushed_at &&
        !data.transaction.rejected_at) {
        console.log('Enough signatures collected, will push transaction automatically.');
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
      let signature = await lckb.signMessageHash("44'/309'/0'", selectedTransaction.digest.replace(/^0x/, ''));
      const lockArgs = keydata.lockArg.startsWith('0x') ? keydata.lockArg : `0x${keydata.lockArg}`;

      if (!signature.startsWith("0x")) {
        signature = `0x${signature}`;
      }

      // Debug only
      // const signature = '0xf34347f24fd19dc0bdca3045dd46a4c1bc2c419727d40f6bd796f1c4310d1aab1d22440e06a31a223bf032660751654bf6c233def549cc26c4f7c906719e992b00'
      // const lockArgs = '0xaf59eba3d501a7590692b97998808203003021c2'

      await handleSignatureSubmit(signature, lockArgs);
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

    console.log('Pushing transaction ...');

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
      // setTransactions(prevTransactions =>
      //   prevTransactions.map(tx =>
      //     tx.id === updatedTransaction.id ? updatedTransaction : tx
      //   )
      // );
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
        selectedTransaction={selectedTransaction}
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
