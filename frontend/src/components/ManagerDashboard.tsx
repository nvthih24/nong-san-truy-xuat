import React, { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import './AuthForm.css';
import './Dashboard.css';

interface ManagerDashboardProps {
  contract: ethers.Contract | null;
  account: string;
  connectWallet: () => Promise<void>;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  contract,
  account,
  connectWallet,
}) => {
  const [productId, setProductId] = useState<string>('');
  const [receiveDate, setReceiveDate] = useState<string>('');
  const [receiveImage, setReceiveImage] = useState<File | null>(null);
  const [price, setPrice] = useState<string>(''); // Giữ là string để người dùng dễ nhập (vd: "0.1")
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

    if (!contract || !productId || !receiveDate || !price || !receiveImage) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      setIsLoading(false);
      return;
    }

    try {
      // Kiểm tra role MANAGER_ROLE
      const hasManagerRole = await contract.hasRole(
        ethers.keccak256(ethers.toUtf8Bytes('MANAGER_ROLE')),
        account
      );
      if (!hasManagerRole) {
        toast.error('Bạn không có quyền manager!');
        setIsLoading(false);
        return;
      }

      // Upload ảnh
      const managerReceiveImageUrl = await handleImageUpload(receiveImage);

      // Chuyển ngày
      const receiveTimestamp = Math.floor(new Date(receiveDate).getTime() / 1000);

      // Gọi hàm updateManagerInfo
      const tx = await contract.updateManagerInfo(
        productId,
        receiveTimestamp,
        managerReceiveImageUrl,
        ethers.parseEther(price) // Chuyển đổi string (vd: "0.1") thành số Wei
      );
      const receipt = await tx.wait();
      const txHash = receipt.hash;

      // Lấy JWT token
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vui lòng đăng nhập để lưu giao dịch!'); // Đổi từ alert
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
          action: 'updateManagerInfo',
          timestamp: Math.floor(Date.now() / 1000),
          managerReceiveImageUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Cập nhật thông tin quản lý thành công!'); // Đổi từ toast()

      // Reset form
      setProductId('');
      setReceiveDate('');
      setPrice('');
      setReceiveImage(null);

    } catch (error: any) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      const errorMessage =
        error.reason || // Lỗi từ blockchain
        error.message ||
        'Lỗi khi cập nhật thông tin quản lý!';
      toast.error(errorMessage);
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
        <h2>Quản Lý</h2>
        {!account ? (
          <button className="connect-wallet-btn" onClick={connectWallet}>
            Kết Nối Ví
          </button>
        ) : (
          <div className="wallet-status">Đã Kết Nối Ví</div>
        )}
      </div>

      <form className="dashboard-form" onSubmit={handleFormSubmit}>
        <h3>Cập Nhật Thông Tin Quản Lý</h3>

        <div className="form-grid">
          {/* Hàng 1 */}
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
          <div className="form-group">
            <label htmlFor="price">Giá bán (Dong)</label>
            <input
              type="number" // Dùng type="number" để dễ nhập
              step="any"     // Cho phép nhập số thập phân
              min="0"
              id="price"
              placeholder="VD: 0.1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Hàng 2 */}
          <div className="form-group">
            <label htmlFor="receiveDate">Ngày nhận hàng</label>
            <input
              type="datetime-local"
              id="receiveDate"
              value={receiveDate}
              onChange={(e) => setReceiveDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>Ảnh chụp nhận hàng</label>
            <div className="file-upload-zone">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setReceiveImage(e.target.files?.[0] || null)}
                disabled={isLoading}
              />
              {receiveImage ? (
                <span className="file-name">{receiveImage.name}</span>
              ) : (
                <span className="file-upload-text">Nhấn hoặc kéo thả ảnh vào đây</span>
              )}
            </div>
          </div>
        </div>

        {/* Nút Submit */}
        <button type="submit" className="primary-btn" disabled={isLoading || !account}>
          {isLoading ? 'Đang xử lý...' : 'Cập Nhật Lên Blockchain'}
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

export default ManagerDashboard;