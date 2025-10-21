import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import './AuthForm.css'; // Import file CSS chung
import './Dashboard.css'; // Import file CSS Dashboard
import 'react-toastify/dist/ReactToastify.css';

interface FarmerDashboardProps {
  contract: ethers.Contract | null;
  account: string;
  connectWallet: () => Promise<void>;
}

interface Product {
  productName: string;
  productId: string;
  farmName: string;
  plantingDate: number;
  plantingImageUrl: string;
  harvestDate: number;
  harvestImageUrl: string;
}

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  contract,
  account,
  connectWallet,
}) => {
  // State cho form gieo trồng
  const [plantingProductName, setPlantingProductName] = useState<string>('');
  const [plantingProductId, setPlantingProductId] = useState<string>('');
  const [plantingFarmName, setPlantingFarmName] = useState<string>('');
  const [plantingDate, setPlantingDate] = useState<string>('');
  const [plantingImage, setPlantingImage] = useState<File | null>(null);

  // State cho form thu hoạch
  const [harvestProductName, setHarvestProductName] = useState<string>('');
  const [harvestProductId, setHarvestProductId] = useState<string>('');
  const [harvestFarmName, setHarvestFarmName] = useState<string>('');
  const [harvestDate, setHarvestDate] = useState<string>('');
  const [harvestImage, setHarvestImage] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);

  // Hàm lấy danh sách sản phẩm từ blockchain
  const fetchProducts = async () => {
    if (!contract || !account) return;
    try {
      const productList = await contract.getProductsByFarmer(account);
      const formattedProducts: Product[] = productList.map((product: any) => ({
        productName: product.productName,
        productId: product.productId,
        farmName: product.farmName,
        plantingDate: Number(product.plantingDate),
        plantingImageUrl: product.plantingImageUrl,
        harvestDate: Number(product.harvestDate),
        harvestImageUrl: product.harvestImageUrl,
      }));
      setProducts(formattedProducts);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách sản phẩm:', error);
      toast.error('Lỗi khi lấy danh sách sản phẩm!');
    }
  };

  // Gọi fetchProducts khi account hoặc contract thay đổi
  useEffect(() => {
    fetchProducts();
  }, [account, contract]);

  // Hàm upload ảnh
  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await axios.post('http://localhost:5000/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.url;
    } catch (error) {
      toast.error('Lỗi khi tải ảnh lên!');
      throw error;
    }
  };

  // Hàm xử lý submit form gieo trồng
  const handlePlantingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!contract || !plantingProductName || !plantingProductId || !plantingFarmName || !plantingDate || !plantingImage) {
      toast.error('Vui lòng điền đầy đủ thông tin gieo trồng và chọn ảnh!');
      setIsLoading(false);
      return;
    }

    try {
      const hasFarmerRole = await contract.hasRole(
        ethers.keccak256(ethers.toUtf8Bytes('FARMER_ROLE')),
        account
      );
      if (!hasFarmerRole) {
        toast.error('Bạn không có quyền farmer!');
        setIsLoading(false);
        return;
      }

      const plantingImageUrl = await handleImageUpload(plantingImage);
      const plantingTimestamp = Math.floor(new Date(plantingDate).getTime() / 1000);

      const tx = await contract.addProduct(
        plantingProductName,
        plantingProductId,
        plantingFarmName,
        plantingTimestamp,
        plantingImageUrl,
        0, // harvestDate ban đầu là 0
        '' // harvestImageUrl ban đầu rỗng
      );
      const receipt = await tx.wait();
      const txHash = receipt.hash;

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vui lòng đăng nhập để lưu giao dịch!');
        setIsLoading(false);
        return;
      }

      await axios.post(
        'http://localhost:5000/api/auth/transactions',
        {
          txHash,
          productId: plantingProductId,
          userAddress: account,
          action: 'addProduct',
          timestamp: Math.floor(Date.now() / 1000),
          plantingImageUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Thêm thông tin gieo trồng thành công!');
      setPlantingProductName('');
      setPlantingProductId('');
      setPlantingFarmName('');
      setPlantingDate('');
      setPlantingImage(null);
      fetchProducts(); // Cập nhật danh sách sản phẩm
    } catch (error: any) {
      console.error('Lỗi khi thêm sản phẩm:', error);
      const errorMessage =
        error.response?.data?.error || error.reason || error.message || 'Unknown error';
      toast.error(`Lỗi khi thêm sản phẩm: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm xử lý submit form thu hoạch
  const handleHarvestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!contract || !harvestProductName || !harvestProductId || !harvestFarmName || !harvestDate || !harvestImage) {
      toast.error('Vui lòng điền đầy đủ thông tin thu hoạch và chọn ảnh!');
      setIsLoading(false);
      return;
    }

    try {
      const hasFarmerRole = await contract.hasRole(
        ethers.keccak256(ethers.toUtf8Bytes('FARMER_ROLE')),
        account
      );
      if (!hasFarmerRole) {
        toast.error('Bạn không có quyền farmer!');
        setIsLoading(false);
        return;
      }

      const harvestImageUrl = await handleImageUpload(harvestImage);
      const harvestTimestamp = Math.floor(new Date(harvestDate).getTime() / 1000);

      // Gọi hàm updateProduct để cập nhật thông tin thu hoạch
      const tx = await contract.updateProduct(
        harvestProductId,
        harvestProductName,
        harvestFarmName,
        harvestTimestamp,
        harvestImageUrl
      );
      const receipt = await tx.wait();
      const txHash = receipt.hash;

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vui lòng đăng nhập để lưu giao dịch!');
        setIsLoading(false);
        return;
      }

      await axios.post(
        'http://localhost:5000/api/auth/transactions',
        {
          txHash,
          productId: harvestProductId,
          userAddress: account,
          action: 'updateProduct',
          timestamp: Math.floor(Date.now() / 1000),
          harvestImageUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Cập nhật thông tin thu hoạch thành công!');
      setHarvestProductName('');
      setHarvestProductId('');
      setHarvestFarmName('');
      setHarvestDate('');
      setHarvestImage(null);
      fetchProducts(); // Cập nhật danh sách sản phẩm
    } catch (error: any) {
      console.error('Lỗi khi cập nhật thu hoạch:', error);
      const errorMessage =
        error.response?.data?.error || error.reason || error.message || 'Unknown error';
      toast.error(`Lỗi khi cập nhật thu hoạch: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm rút gọn địa chỉ ví
  const truncateAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Hàm format ngày
  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return 'Chưa cập nhật';
    return new Date(timestamp * 1000).toLocaleString('vi-VN');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Nông Dân</h2>
        {!account ? (
          <button className="connect-wallet-btn" onClick={connectWallet}>
            Kết Nối Ví
          </button>
        ) : (
          <div className="wallet-status">
            Đã Kết Nối Ví
          </div>
        )}
      </div>

      {/* Form Gieo Trồng */}
      <form className="dashboard-form" onSubmit={handlePlantingSubmit}>
        <h3>Thêm Thông Tin Gieo Trồng</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="plantingProductName">Tên sản phẩm</label>
            <input
              type="text"
              id="plantingProductName"
              placeholder="VD: Cải thìa hữu cơ"
              value={plantingProductName}
              onChange={(e) => setPlantingProductName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="plantingProductId">Mã sản phẩm (ID)</label>
            <input
              type="text"
              id="plantingProductId"
              placeholder="VD: CAITHIA-001"
              value={plantingProductId}
              onChange={(e) => setPlantingProductId(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-group form-span-2">
            <label htmlFor="plantingFarmName">Tên nông trại</label>
            <input
              type="text"
              id="plantingFarmName"
              placeholder="VD: Nông trại Xanh Đà Lạt"
              value={plantingFarmName}
              onChange={(e) => setPlantingFarmName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="plantingDate">Ngày gieo trồng</label>
            <input
              type="datetime-local"
              id="plantingDate"
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>Ảnh chụp gieo trồng</label>
            <div className="file-upload-zone">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPlantingImage(e.target.files?.[0] || null)}
                disabled={isLoading}
              />
              {plantingImage ? (
                <span className="file-name">{plantingImage.name}</span>
              ) : (
                <span className="file-upload-text">Nhấn hoặc kéo thả ảnh vào đây</span>
              )}
            </div>
          </div>
        </div>
        <button type="submit" className="primary-btn" disabled={isLoading || !account}>
          {isLoading ? 'Đang xử lý...' : 'Thêm Sản Phẩm Gieo Trồng '}
        </button>
      </form>

      {/* Form Thu Hoạch */}
      <form className="dashboard-form" onSubmit={handleHarvestSubmit}>
        <h3>Cập Nhật Thông Tin Thu Hoạch</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="harvestProductName">Tên sản phẩm</label>
            <input
              type="text"
              id="harvestProductName"
              placeholder="VD: Cải thìa hữu cơ"
              value={harvestProductName}
              onChange={(e) => setHarvestProductName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="harvestProductId">Mã sản phẩm (ID)</label>
            <input
              type="text"
              id="harvestProductId"
              placeholder="VD: CAITHIA-001"
              value={harvestProductId}
              onChange={(e) => setHarvestProductId(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-group form-span-2">
            <label htmlFor="harvestFarmName">Tên nông trại</label>
            <input
              type="text"
              id="harvestFarmName"
              placeholder="VD: Nông trại Xanh Đà Lạt"
              value={harvestFarmName}
              onChange={(e) => setHarvestFarmName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="harvestDate">Ngày thu hoạch</label>
            <input
              type="datetime-local"
              id="harvestDate"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>Ảnh chụp thu hoạch</label>
            <div className="file-upload-zone">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setHarvestImage(e.target.files?.[0] || null)}
                disabled={isLoading}
              />
              {harvestImage ? (
                <span className="file-name">{harvestImage.name}</span>
              ) : (
                <span className="file-upload-text">Nhấn hoặc kéo thả ảnh vào đây</span>
              )}
            </div>
          </div>
        </div>
        <button type="submit" className="primary-btn" disabled={isLoading || !account}>
          {isLoading ? 'Đang xử lý...' : 'Cập Nhật Thu Hoạch '}
        </button>
      </form>

      {/* Danh sách sản phẩm */}
      <div className="product-list">
        <h3>Danh Sách Sản Phẩm Đã Thêm</h3>
        {products.length === 0 ? (
          <p>Chưa có sản phẩm nào được thêm.</p>
        ) : (
          <table className="product-table">
            <thead>
              <tr>
                <th>Tên sản phẩm</th>
                <th>Mã sản phẩm</th>
                <th>Tên nông trại</th>
                <th>Ngày gieo trồng</th>
                <th>Ảnh gieo trồng</th>
                <th>Ngày thu hoạch</th>
                <th>Ảnh thu hoạch</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={index}>
                  <td>{product.productName}</td>
                  <td>{product.productId}</td>
                  <td>{product.farmName}</td>
                  <td>{formatDate(product.plantingDate)}</td>
                  <td>
                    {product.plantingImageUrl ? (
                      <a href={product.plantingImageUrl} target="_blank" rel="noopener noreferrer">
                        Xem ảnh
                      </a>
                    ) : (
                      'Chưa có'
                    )}
                  </td>
                  <td>{formatDate(product.harvestDate)}</td>
                  <td>
                    {product.harvestImageUrl ? (
                      <a href={product.harvestImageUrl} target="_blank" rel="noopener noreferrer">
                        Xem ảnh
                      </a>
                    ) : (
                      'Chưa có'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default FarmerDashboard;