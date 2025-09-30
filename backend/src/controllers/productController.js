
exports.createProduct = async (req, res) => {
  try {
    // Optional: Save product metadata to backend (off-chain)
    const product = req.body;
    // Simulate DB save (replace with MongoDB if needed)
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    // Simulate fetching products (replace with MongoDB query)
    res.json([{ id: 'PROD001', origin: { farm: 'ABC Farm', date: '2025-09-27' } }]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};