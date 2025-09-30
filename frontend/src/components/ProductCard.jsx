function ProductCard({ product }) {
  return (
    <div className="border p-4 rounded shadow">
      <h3 className="text-lg font-bold">{product.id}</h3>
      <p>Farm: {product.origin?.farm || 'N/A'}</p>
      <p>Date: {product.origin?.date || 'N/A'}</p>
    </div>
  );
}

export default ProductCard;