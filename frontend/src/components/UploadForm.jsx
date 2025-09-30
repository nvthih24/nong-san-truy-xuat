import { useState } from 'react';

function UploadForm({ onSubmit }) {
  const [productId, setProductId] = useState('');
  const [farm, setFarm] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ productId, origin: { farm, date } });
    setProductId('');
    setFarm('');
    setDate('');
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-4">
        <label className="block text-sm font-medium">Product ID</label>
        <input
          type="text"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="mt-1 p-2 border rounded w-full"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Farm</label>
        <input
          type="text"
          value={farm}
          onChange={(e) => setFarm(e.target.value)}
          className="mt-1 p-2 border rounded w-full"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Harvest Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 p-2 border rounded w-full"
          required
        />
      </div>
      <button
        type="submit"
        onClick={handleSubmit}
        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Upload to Blockchain
      </button>
    </div>
  );
}

export default UploadForm;