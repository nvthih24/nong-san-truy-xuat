import React, { useState } from 'react';
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

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  contract,
  account,
  connectWallet,
}) => {
  const [productName, setProductName] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [farmName, setFarmName] = useState<string>('');
  const [plantingDate, setPlantingDate] = useState<string>('');
  const [plantingImage, setPlantingImage] = useState<File | null>(null);
  const [harvestDate, setHarvestDate] = useState<string>('');
  const [harvestImage, setHarvestImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  // Hàm xử lý submit form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn trang tải lại
    setIsLoading(true);

    if (!contract || !productName || !productId || !farmName || !plantingDate || !harvestDate || !plantingImage || !harvestImage) {
      toast.error('Vui lòng điền đầy đủ thông tin và chọn ảnh!');
      setIsLoading(false);
      return;
    }

    try {
      // Kiểm tra role FARMER_ROLE
      const hasFarmerRole = await contract.hasRole(
        ethers.keccak256(ethers.toUtf8Bytes('FARMER_ROLE')),
        account
      );
      if (!hasFarmerRole) {
        toast.error('Bạn không có quyền farmer!');
        setIsLoading(false);
        return;
      }

      // Upload ảnh
      const plantingImageUrl = await handleImageUpload(plantingImage);
      const harvestImageUrl = await handleImageUpload(harvestImage);

      // Chuyển ngày
      const plantingTimestamp = Math.floor(new Date(plantingDate).getTime() / 1000);
      const harvestTimestamp = Math.floor(new Date(harvestDate).getTime() / 1000);

      // Gọi hàm addProduct
      const tx = await contract.addProduct(
        productName,
        productId,
        farmName,
        plantingTimestamp,
        plantingImageUrl,
        harvestTimestamp,
        harvestImageUrl
      );
      const receipt = await tx.wait();
      const txHash = receipt.hash;

      // Lấy JWT token
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vui lòng đăng nhập để lưu giao dịch!');
        setIsLoading(false);
        return;
      }

      // Gửi transaction hash tới backend
      await axios.post(
        'http://localhost:5000/api/auth/transactions',
        {
          txHash,
          productId,
          userAddress: account,
          action: 'addProduct',
          timestamp: Math.floor(Date.now() / 1000),
          plantingImageUrl,
          harvestImageUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Thêm sản phẩm thành công!'); // Đổi từ alert

      // Reset form
      setProductName('');
      setProductId('');
      setFarmName('');
      setPlantingDate('');
      setHarvestDate('');
      setPlantingImage(null);
      setHarvestImage(null);

    } catch (error: any) {
      console.error('Lỗi khi thêm sản phẩm:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.reason || // Lỗi từ blockchain
        error.message ||
        'Unknown error';
      toast.error(`Lỗi khi thêm sản phẩm: ${errorMessage}`); // Đổi từ alert
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm rút gọn địa chỉ ví
  const truncateAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Nông Dân</h2> {/* Đổi tên ngắn gọn */}
        {!account ? (
          <button className="connect-wallet-btn" onClick={connectWallet}>
            Kết Nối Ví
          </button>
        ) : (
          <div className="wallet-status">Đã Kết Nối Ví</div>
        )}
      </div>

      <form className="dashboard-form" onSubmit={handleFormSubmit}>
        <h3>Thêm Sản Phẩm Mới</h3>

        <div className="form-grid">
          {/* Hàng 1 */}
          <div className="form-group">
            <label htmlFor="productName">Tên sản phẩm</label>
            <input
              type="text"
              id="productName"
              placeholder="VD: Cải thìa hữu cơ"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="productId">Mã sản phẩm (ID)</label>
            <input
              type="text"
              id="productId"
              placeholder="VD: 1 hoặc CAITHIA-001"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Hàng 2 - Chiếm 2 cột */}
          <div className="form-group form-span-2">
            <label htmlFor="farmName">Tên nông trại</label>
            <input
              type="text"
              id="farmName"
              placeholder="VD: Nông trại Xanh Đà Lạt"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Hàng 3 */}
          <div className="form-group">
            <label htmlFor="plantingDate">Ngày gieo trồng</label>
            <input
              type="datetime-local" // Dùng datetime-local để chính xác hơn
              id="plantingDate"
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
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

          {/* Hàng 4 (Upload ảnh) */}
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

        {/* Nút Submit */}
        <button type="submit" className="primary-btn" disabled={isLoading || !account}>
          {isLoading ? 'Đang xử lý...' : 'Thêm Lên Blockchain'}
        </button>
      </form>
      <ToastContainer
        position="top-right" // Vị trí hiển thị
        autoClose={3000}     // Tự động đóng sau 3 giây
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light" // Có thể đổi thành "dark" hoặc "colored"
      />
    </div>
  );
};

export default FarmerDashboard;