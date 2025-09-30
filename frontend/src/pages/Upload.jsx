import { useState } from 'react';
import UploadForm from '../components/UploadForm';
import blockchainService from '../services/blockchainService';
import api from '../services/api';

function Upload() {
  const [status, setStatus] = useState('');

  const handleUpload = async (data) => {
    try {
      await blockchainService.connectWallet();
      const txHash = await blockchainService.uploadTraceData(data.productId, data.origin);
      setStatus(`Success! Tx: ${txHash}`);
      // Optional: Save to backend (off-chain)
      await api.post('/products', data);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl mb-4">Upload Product Data</h2>
      <UploadForm onSubmit={handleUpload} />
      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}

export default Upload;