import { useState } from 'react';
import blockchainService from '../services/blockchainService';

function Trace() {
  const [productId, setProductId] = useState('');
  const [traceData, setTraceData] = useState(null);
  const [error, setError] = useState('');

  const handleTrace = async (e) => {
    e.preventDefault();
    try {
      const data = await blockchainService.getTraceData(productId);
      setTraceData(data);
      setError('');
    } catch (err) {
      setError('Error fetching data: ' + err.message);
      setTraceData(null);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl mb-4">Trace Product</h2>
      <div className="max-w-md mx-auto">
        <input
          type="text"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="Enter Product ID"
          className="p-2 border rounded w-full mb-4"
        />
        <button
          onClick={handleTrace}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Trace
        </button>
        {traceData && (
          <div className="mt-4 p-4 border rounded">
            <p><strong>Farm:</strong> {traceData.farm}</p>
            <p><strong>Date:</strong> {traceData.date}</p>
          </div>
        )}
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}

export default Trace;