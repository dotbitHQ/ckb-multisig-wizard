import React from 'react';
import { Box, Typography, CircularProgress, Grid2 as Grid } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { TreeViewBaseItem } from '@mui/x-tree-view/models';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { DbTransaction } from '@/lib/database';
import { formatInTimeZone } from 'date-fns-tz';

interface TransactionListProps {
  transactions: DbTransaction[];
  loading: boolean;
  onSelectTransaction: (id: string) => void;
}

export default function TransactionSidebar({ transactions, loading, onSelectTransaction }: TransactionListProps) {
  const createTreeItems = (): TreeViewBaseItem[] => {
    const groupedByDate: Record<string, DbTransaction[]> = {};
    transactions.forEach(tx => {
      const txDate = new Date(tx.uploaded_at);
      const date = formatInTimeZone(txDate, 'UTC', 'yyyy-MM-dd');

      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(tx);
    });

    return Object.entries(groupedByDate).map(([date, txs]) => ({
      id: date,
      label: date,
      children: txs.map(tx => {
        let txJsonPath = tx.tx_json_path.split('/').pop() || 'Unknown';

        if (txJsonPath.length > 20) {
          txJsonPath = txJsonPath.slice(0, 10) + '...' + txJsonPath.slice(-10);
        }

        return {
          id: tx.id,
          label: txJsonPath,
        };
      }),
    }));
  };

  const handleItemClick = (_: React.MouseEvent, itemId: string) => {
    if (!itemId.startsWith('tx')) {
      return;
    }

    onSelectTransaction(itemId);
  };

  return (
    <Grid size={3} sx={{ padding: 2,bgcolor: 'background.paper', minHeight: '100vh', borderRight: 1, borderColor: 'divider' }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <ArrowDownwardIcon sx={{ mr: 1 }} color="success" /> Click a transaction to start
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      ) : (
        <RichTreeView
          items={createTreeItems()}
          onItemClick={handleItemClick}
          sx={{
            '& .MuiTreeItem-content': {
              cursor: 'pointer',
            },
          }}
        />
      )}
    </Grid>
  );
}
