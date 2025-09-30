import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import api from '../services/api';

function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Fetch products from backend (optional off-chain storage)
    api.get('/products').then((response) => setProducts(response.data));
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl mb-4">All Products</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default Home;