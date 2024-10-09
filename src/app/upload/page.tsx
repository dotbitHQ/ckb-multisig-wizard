"use client"

import React, { useCallback, useState } from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Alert, AlertTitle } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import JsonEditor from '@/components/JsonEditor';

export default function TransactionUploadPage () {
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadResults, setUploadResults] = useState<{ name: string; result: string }[]>([]);
  const [jsonInput, setJsonInput] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Handle file upload logic here
    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/upload/tx', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (Array.isArray(data.result)) {
        console.log('Upload successful(some tx may contains error message):', data);
        setUploadResults(data.result);
      } else {
        console.error('Upload failed with unexpected server error');
        setErrorMessage(`Upload failed with unexpected server error`);
        setOpenErrorDialog(true);
      }

    } catch (error) {
      console.error('Upload failed, reason:', error);
      setErrorMessage(`Upload failed, reason: ${error}`);
      setOpenErrorDialog(true);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.json']
    }
  });

  const handleJsonSubmit = async () => {
    try {
      // Parse the JSON to ensure it's valid
      JSON.parse(jsonInput);

      const response = await fetch('/api/upload/tx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jsonContent: jsonInput }),
      });
      const data = await response.json();

      if (Array.isArray(data.result)) {
        console.log('Upload successful (some tx may contain error messages):', data);
        setUploadResults(data.result);
      } else {
        console.error('Upload failed with unexpected server error');
        setErrorMessage(`Upload failed with unexpected server error`);
        setOpenErrorDialog(true);
      }
    } catch (error) {
      console.error('Invalid JSON or upload failed, reason:', error);
      setErrorMessage(`Invalid JSON or upload failed, reason: ${error}`);
      setOpenErrorDialog(true);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Upload Transaction</Typography>
      </Box>

      {/* Display alert components for upload results */}
      {uploadResults.length > 0 && (
        <Box sx={{ p: 3 }}>
          {uploadResults.map((result, index) => (
            <Alert
              key={index}
              severity={result.result === 'success' ? 'success' : 'error'}
              sx={{ mb: 2 }}
            >
              <AlertTitle>{result.result === 'success' ? 'Success' : 'Error'}</AlertTitle>
              {result.name}: {result.result === 'success' ? 'Success' : result.result}
            </Alert>
          ))}
        </Box>
      )}

      {/* Body - Drag and Drop Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
        <Paper
          {...getRootProps()}
          sx={{
            width: '100%',
            height: '40%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            bgcolor: 'background.paper',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'grey.50',
            },
            mb: 3,
          }}
        >
          <input {...getInputProps()} />
          <Typography variant="h5" gutterBottom>
            {isDragActive ? 'Drop the transaction JSON files here...' : 'Drag & drop transaction JSON files here, or click to select files'}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Supported file types: JSON
          </Typography>
        </Paper>

        <Typography variant="h6" gutterBottom>
          Or paste your JSON here:
        </Typography>
        <JsonEditor value={jsonInput} onChange={setJsonInput} />
        <Button
          variant="contained"
          onClick={handleJsonSubmit}
          sx={{ mt: 2, alignSelf: 'flex-start' }}
          disabled={!jsonInput.trim()}
        >
          Submit JSON
        </Button>
      </Box>

      {/* Error Dialog */}
      <Dialog open={openErrorDialog} onClose={() => setOpenErrorDialog(false)}>
        <DialogTitle sx={{ color: 'error.main' }}>❌ Error</DialogTitle>
        <DialogContent>
          <Typography color="error">{errorMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setOpenErrorDialog(false)} color="error">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
