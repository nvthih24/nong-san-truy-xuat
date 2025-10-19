import React, { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import './AuthForm.css';
import './Dashboard.css';
import 'react-toastify/dist/ReactToastify.css';

interface TransporterDashboardProps {
  contract: ethers.Contract | null;
  account: string;
  connectWallet: () => Promise<void>;
}

const TransporterDashboard: React.FC<TransporterDashboardProps> = ({
  contract,
  account,
  connectWallet,
}) => {
  const [transporterName, setTransporterName] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [receiveDate, setReceiveDate] = useState<string>('');
  const [receiveImage, setReceiveImage] = useState<File | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliveryImage, setDeliveryImage] = useState<File | null>(null);
  const [transportInfo, setTransportInfo] = useState<string>('');
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
      throw error; // Ném lỗi để dừng hàm submit
    }
  };

  // Hàm xử lý submit form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn trang tải lại
    setIsLoading(true);

    if (!contract || !transporterName || !productId || !receiveDate || !deliveryDate || !transportInfo || !receiveImage || !deliveryImage) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      setIsLoading(false);
      return;
    }

    try {
      const hasTransporterRole = await contract.hasRole(
        ethers.keccak256(ethers.toUtf8Bytes('TRANSPORTER_ROLE')),
        account
      );
      if (!hasTransporterRole) {
        toast.error('Bạn không có quyền transporter!');
        setIsLoading(false);
        return;
      }

      // Tải ảnh lên
      const receiveImageUrl = await handleImageUpload(receiveImage);
      const deliveryImageUrl = await handleImageUpload(deliveryImage);

      // Chuyển ngày
      const receiveTimestamp = Math.floor(new Date(receiveDate).getTime() / 1000);
      const deliveryTimestamp = Math.floor(new Date(deliveryDate).getTime() / 1000);

      // Gọi contract
      const tx = await contract.updateTrace(
        productId,
        transporterName,
        receiveTimestamp,
        receiveImageUrl,
        deliveryTimestamp,
        deliveryImageUrl,
        transportInfo
      );
      const receipt = await tx.wait();
      const txHash = receipt.hash;

      // Lưu transaction
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/auth/transactions',
        {
          txHash,
          productId,
          userAddress: account,
          action: 'updateTrace',
          timestamp: Math.floor(Date.now() / 1000),
          receiveImageUrl,
          deliveryImageUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Cập nhật vận chuyển thành công!');

      // Reset form
      setTransporterName('');
      setProductId('');
      setReceiveDate('');
      setDeliveryDate('');
      setTransportInfo('');
      setReceiveImage(null);
      setDeliveryImage(null);

    } catch (error) {
      console.error('Lỗi khi cập nhật trace:', error);
      toast.error('Lỗi khi cập nhật trace!');
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
        <h2>Vận Chuyển</h2>
        {!account ? (
          <button className="connect-wallet-btn" onClick={connectWallet}>
            Kết Nối Ví
          </button>
        ) : (
          <div className="wallet-status">Đã Kết Nối Ví</div>
        )}
      </div>

      <form className="dashboard-form" onSubmit={handleFormSubmit}>
        <h3>Cập Nhật Thông Tin Vận Chuyển</h3>

        {/* Bọc các input trong lưới grid */}
        <div className="form-grid">
          {/* Hàng 1 */}
          <div className="form-group">
            <label htmlFor="transporterName">Tên đơn vị vận chuyển</label>
            <input
              type="text"
              id="transporterName"
              placeholder="VD: Công ty Vận Tải Xanh"
              value={transporterName}
              onChange={(e) => setTransporterName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="productId">Mã sản phẩm (Product ID)</label>
            <input
              type="text"
              id="productId"
              placeholder="VD: 1"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Hàng 2 */}
          <div className="form-group">
            <label htmlFor="receiveDate">Ngày nhận hàng</label>
            <input
              type="datetime-local" // Dùng datetime-local để chính xác hơn
              id="receiveDate"
              value={receiveDate}
              onChange={(e) => setReceiveDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="deliveryDate">Ngày giao hàng</label>
            <input
              type="datetime-local"
              id="deliveryDate"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Hàng 3 (Textarea - Chiếm 2 cột) */}
          <div className="form-group form-span-2">
            <label htmlFor="transportInfo">Thông tin vận chuyển</label>
            <textarea
              id="transportInfo"
              placeholder="VD: Xe tải lạnh 59A-123.45, nhiệt độ duy trì 5°C..."
              value={transportInfo}
              onChange={(e) => setTransportInfo(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Hàng 4 (Upload ảnh) */}
          <div className="form-group">
            <label>Ảnh chụp khi nhận hàng</label>
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
          <div className="form-group">
            <label>Ảnh chụp khi giao hàng</label>
            <div className="file-upload-zone">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setDeliveryImage(e.target.files?.[0] || null)}
                disabled={isLoading}
              />
              {deliveryImage ? (
                <span className="file-name">{deliveryImage.name}</span>
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

export default TransporterDashboard;