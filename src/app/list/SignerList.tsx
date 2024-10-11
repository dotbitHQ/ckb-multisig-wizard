import React, { useState } from 'react';
import { List, ListItem, ListItemText, Typography, IconButton, Tooltip, Collapse, ListItemButton } from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import CopyToClipboard from 'react-copy-to-clipboard';
import * as util from '@/lib/util';

interface User {
  name: string;
  pubKeyHash: string;
}

interface SignerProps {
  sighash_addresses: string[];
  users: User[];
}

export default function SignerList({ sighash_addresses, users }: SignerProps) {
  const [open, setOpen] = useState<{ [key: string]: boolean }>({});

  const handleClick = (name: string) => {
    setOpen(prevOpen => ({ ...prevOpen, [name]: !prevOpen[name] }));
  };

  const signerMap = new Map(users.map(user => [user.pubKeyHash, user.name]));

  return (
    <List dense disablePadding>
      {sighash_addresses.map((pubkey_hash, index) => {
        const signerName = signerMap.get(pubkey_hash) || `Unknown Signer ${index + 1}`;
        const address = util.lockArgsToAddress(pubkey_hash, process.env.NEXT_PUBLIC_ENV || '');

        return (
          <React.Fragment key={pubkey_hash}>
            <ListItemButton sx={{ pl: 0 }} onClick={() => handleClick(signerName)}>
              <ListItem disablePadding>
                <ListItemText primary={
                  <Typography sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {signerName}
                  </Typography>
                } secondary={
                  <Typography sx={{ fontFamily: 'monospace' }}>
                    {pubkey_hash}
                  </Typography>
                } />
                {open[signerName] ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
            </ListItemButton>
            <Collapse in={open[signerName]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding dense>
                <ListItem sx={{ pl: 2 }}>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontFamily: 'monospace' }}>
                        Pubkey Hash: {pubkey_hash}
                      </Typography>
                    }
                  />
                  <CopyToClipboard text={pubkey_hash}>
                    <Tooltip title="Copy the pubkey hash">
                      <IconButton aria-label="copy">
                        <FileCopyIcon />
                      </IconButton>
                    </Tooltip>
                  </CopyToClipboard>
                </ListItem>
                <ListItem sx={{ pl: 2 }}>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontFamily: 'monospace' }}>
                        Default Address: {`${address.substring(0, 10)}...${address.substring(address.length - 10)}`}
                      </Typography>
                    }
                  />
                  <CopyToClipboard text={address}>
                    <Tooltip title="Copy the address">
                      <IconButton aria-label="copy">
                        <FileCopyIcon />
                      </IconButton>
                    </Tooltip>
                  </CopyToClipboard>
                </ListItem>
              </List>
            </Collapse>
          </React.Fragment>
        );
      })}
    </List>
  );
}
