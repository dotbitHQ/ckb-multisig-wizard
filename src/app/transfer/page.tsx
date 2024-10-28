"use client"

import React, { useState, useEffect } from 'react';
import { TextField, Button, Grid2 as Grid, Typography, Paper, Box, Autocomplete, InputAdornment, Snackbar, Alert, AlertColor, CircularProgress } from '@mui/material';
import { NoteAdd } from '@mui/icons-material';

interface AddressOption {
  label: string;
  value: string;
}

export default function TransferPage() {
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    value: 0,
    fee: 1000000,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const [responseAlert, setResponseAlert] = useState<{ severity: AlertColor, message: string } | null>(null);

  useEffect(() => {
    (async () => {
      console.log('Fetching addresses ...');

      const res = await fetch('/api/address');
      const data = await res.json();
      const recommendAddresses = data.result.map((address: string) => {
        return {
          label: address,
          value: address,
        }
      });

      setAddressOptions(recommendAddresses);
    })();
  }, []);

  const handleAutocompleteInput = (name: string) => (_: React.SyntheticEvent<Element, Event>, value: string) => {
    console.log(`handleAutocompleteInput ${name}: ${value}`);

    if (value || value === '') {
      setFormData(prevState => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleCKBInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    console.log(`handleCKBInput ${name}: ${value}`);

    // Convert value to integer
    const intValue = parseInt(value);

    setFormData(prevState => ({
      ...prevState,
      [name]: intValue,
    }));
  };

  const handleShannonInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    console.log(`handleShannonInput ${name}: ${value}`);

    // Convert value to integer
    const intValue = parseInt(value);

    setFormData(prevState => ({
      ...prevState,
      [name]: intValue,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    console.log(`Submitting: ${JSON.stringify(formData, null, 2)}`);

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.error) {
        setResponseAlert({ severity: 'error', message: data.error });
      } else {
        setResponseAlert({ severity: 'success', message: data.result });
      }
    } catch (error) {
      console.error(error);
      setResponseAlert({ severity: 'error', message: `Error: ${error}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ padding: 4, maxWidth: 600, width: '100%' }}>
        <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
          Create a transfer transaction
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Autocomplete
                freeSolo
                options={addressOptions}
                renderInput={(params) => <TextField sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace' } }} {...params} label="From" multiline required />}
                onInputChange={handleAutocompleteInput('from')}
                value={formData.from}
              />
            </Grid>
            <Grid size={12}>
              <Autocomplete
                freeSolo
                options={addressOptions}
                renderInput={(params) => <TextField sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace' } }} {...params} label="To" multiline required />}
                onInputChange={handleAutocompleteInput('to')}
                value={formData.to}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Value"
                name="value"
                type="number"
                value={formData.value}
                onChange={handleCKBInput}
                required
                helperText="Floating number is not supported."
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">CKB</InputAdornment>,
                  },
                }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Fee"
                name="fee"
                type="number"
                value={formData.fee}
                onChange={handleShannonInput}
                required
                helperText="1 CKB = 1e8 Shannons, 1 000 000 Shannons is recommended for most cases."
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">Shannons</InputAdornment>,
                  },
                }}
              />
            </Grid>
            <Grid size={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={18} /> : <NoteAdd />}
              >
                Submit Transfer
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={!!responseAlert}
        onClose={() => setResponseAlert(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setResponseAlert(null)} severity={responseAlert?.severity} sx={{ width: '100%' }}>
          {responseAlert?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
