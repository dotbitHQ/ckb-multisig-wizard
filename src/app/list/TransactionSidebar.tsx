import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Grid2 as Grid, Stack, Chip, Tooltip } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { TreeViewBaseItem } from '@mui/x-tree-view/models';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { DbTransaction } from '@/lib/database';
import { formatInTimeZone } from 'date-fns-tz';
import { useAuth } from '@/contexts/AuthContext';
import { TreeItem2, TreeItem2Props, TreeItem2SlotProps } from '@mui/x-tree-view/TreeItem2';
import { useTreeItem2 } from '@mui/x-tree-view/useTreeItem2';
import FolderRounded from '@mui/icons-material/FolderRounded';
import ArticleIcon from '@mui/icons-material/Article';

interface TransactionListProps {
  transactions: DbTransaction[];
  loading: boolean;
  onSelectTransaction: (id: string) => void;
}

interface TransactionView extends DbTransaction {
  status: string;
  sigCount: number;
}

export default function TransactionSidebar({ transactions, loading, onSelectTransaction }: TransactionListProps) {
  const { pubKeyHash } = useAuth();
  const [transactionViews, setTransactionViews] = useState<TreeViewBaseItem[]>([]);

  useEffect(() => {
    console.log('Update transactions tree view.')

    const createTreeItems = (): TreeViewBaseItem[] => {
      const groupedByDate: Record<string, TransactionView[]> = {};
      transactions.forEach(tx => {
        const txDate = new Date(tx.uploaded_at);
        const date = formatInTimeZone(txDate, 'UTC', 'yyyy-MM-dd');
        let status = 'unsigned';
        if (tx.rejected_at) {
          status = 'rejected';
        } else if (tx.committed_at) {
          status = 'committed';
        } else {
          if (pubKeyHash && tx.multisig_config.config.sighash_addresses.includes(pubKeyHash)) {
            if (tx.signed.length >= tx.multisig_config.config.threshold || tx.signed.some(sig => sig.lock_args === pubKeyHash)) {
              status = 'signed';
            } else {
              status = 'unsigned';
            }
          } else {
            status = 'ignored';
          }
        }

        const txView: TransactionView = {
          ...tx,
          status,
          sigCount: tx.signed.length,
        };

        if (!groupedByDate[date]) {
          groupedByDate[date] = [];
        }
        groupedByDate[date].push(txView);
      });

      return Object.entries(groupedByDate).map(([date, txs]) => ({
        id: date,
        label: date,
        fileType: 'folder',
        status: 'none',
        children: txs.map(tx => {
          let txJsonPath = tx.tx_json_path.split('/').pop() || 'Unknown';

          if (txJsonPath.length > 20) {
            txJsonPath = txJsonPath.slice(0, 10) + '...' + txJsonPath.slice(-10);
          }

          return {
            id: tx.id,
            label: txJsonPath,
            fileType: 'json',
            status: tx.status,
            sigCount: tx.sigCount,
          };
        }),
      }));
    };

    setTransactionViews(createTreeItems());
  }, [transactions, pubKeyHash])

  const handleItemClick = (_: React.MouseEvent, itemId: string) => {
    if (!itemId.startsWith('tx')) {
      return;
    }

    onSelectTransaction(itemId);
  };

  const getIconFromFileType = (fileType: string) => {
    switch (fileType) {
    case 'folder':
      return FolderRounded;
    default:
      return ArticleIcon;
    }
  };

  const getItemStatusColor = (status: string) => {
    if (status === 'rejected') {
      return { color: 'error.main' };
    } else if (status === 'committed') {
      return { color: 'success.main' };
    } else if (status === 'signed') {
      return { color: '#cddc39' };
    } else if (status === 'unsigned') {
      return { color: '#ffc107'};
    } else if (status === 'ignored') {
      return { color: '#bdbdbd' };
    } else {
      return { color: 'inherit' };
    }
  };

  const CustomTreeItem = React.forwardRef(function CustomTreeItem(
    props: TreeItem2Props,
    ref: React.Ref<HTMLLIElement>,
  ) {
    const { id, itemId, label, disabled, children } = props;
    const { publicAPI } = useTreeItem2({ id, itemId, children, label, disabled, rootRef: ref });
    const item = publicAPI.getItem(itemId);

    return (
      <TreeItem2
        {...props}
        ref={ref}
        slots={{
          iconContainer: getIconFromFileType(item.fileType),
        }}
        slotProps={{
          label: {
            sx: {
              color: getItemStatusColor(item.status).color,
            },
          }
        } as TreeItem2SlotProps}
      />
    );
  });

  return (
    <Grid size={3} sx={{ padding: 2,bgcolor: 'background.paper', minHeight: '100vh', borderRight: 1, borderColor: 'divider' }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <ArrowDownwardIcon sx={{ mr: 1 }} color="success" /> Click a transaction to start
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Tooltip title="Transactions do not need your signature.">
          <Chip label="Ignored" sx={{ color: '#bdbdbd', borderColor: '#bdbdbd' }} size="small" variant="outlined"/>
        </Tooltip>
        <Tooltip title="Transactions you need to sign.">
          <Chip label="Unsigned" sx={{ color: '#ffc107', borderColor: '#ffc107' }} size="small" variant="outlined"/>
        </Tooltip>
        <Tooltip title="Transactions you have signed but not committed on chain.">
          <Chip label="Signed" sx={{ color: '#cddc39', borderColor: '#cddc39' }} size="small" variant="outlined"/>
        </Tooltip>
        <Tooltip title="Transactions you have signed and committed on chain.">
          <Chip label="Committed" sx={{ color: 'success.main', borderColor: 'success.main' }} size="small" variant="outlined"/>
        </Tooltip>
        <Tooltip title="Transactions you have signed but rejected by node.">
          <Chip label="Rejected" sx={{ color: 'error.main', borderColor: 'error.main' }} size="small" variant="outlined"/>
        </Tooltip>
      </Stack>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      ) : (
        <RichTreeView
          sx={{
            '& .MuiTreeItem-content': {
              cursor: 'pointer',
            },
          }}
          items={transactionViews}
          onItemClick={handleItemClick}
          slots={{
            item: CustomTreeItem,
          }}
        />
      )}
    </Grid>
  );
}
