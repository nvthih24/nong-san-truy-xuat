
import React, { useState, useEffect } from 'react';
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

interface TraceInfo {
  productId: string;
  transporterName: string;
  receiveDate: number;
  receiveImageUrl: string;
  deliveryDate: number;
  deliveryImageUrl: string;
  transportInfo: string;
}

const TransporterDashboard: React.FC<TransporterDashboardProps> = ({
  contract,
  account,
  connectWallet,
}) => {
  // State cho form nhận hàng
  const [receiveTransporterName, setReceiveTransporterName] = useState<string>('');
  const [receiveProductId, setReceiveProductId] = useState<string>('');
  const [receiveDate, setReceiveDate] = useState<string>('');
  const [receiveImage, setReceiveImage] = useState<File | null>(null);
  const [receiveTransportInfo, setReceiveTransportInfo] = useState<string>('');

  // State cho form giao hàng
  const [deliveryTransporterName, setDeliveryTransporterName] = useState<string>('');
  const [deliveryProductId, setDeliveryProductId] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliveryImage, setDeliveryImage] = useState<File | null>(null);
  const [deliveryTransportInfo, setDeliveryTransportInfo] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<TraceInfo[]>([]);

  // Hàm lấy danh sách sản phẩm từ blockchain
  const fetchProducts = async () => {
    if (!contract || !account) {
      console.error('Contract hoặc account không hợp lệ:', { contract, account });
      toast.error('Vui lòng kết nối ví và đảm bảo contract hợp lệ!');
      return;
    }
    try {
      console.log('Gọi getProductsByTransporter với account:', account);
      const productList = await contract.getProductsByTransporter(account);
      console.log('Danh sách sản phẩm:', productList);
      const formattedProducts: TraceInfo[] = productList.map((product: any) => ({
        productId: product.productId,
        transporterName: product.transporterName,
        receiveDate: Number(product.receiveDate),
        receiveImageUrl: product.receiveImageUrl,
        deliveryDate: Number(product.deliveryDate),
        deliveryImageUrl: product.deliveryImageUrl,
        transportInfo: product.transportInfo,
      }));
      setProducts(formattedProducts);
    } catch (error: any) {
      console.error('Lỗi chi tiết:', error);
      toast.error(`Lỗi khi lấy danh sách sản phẩm: ${error.message}`);
    }
  };

  // Gọi fetchProducts khi account hoặc contract thay đổi
  useEffect(() => {
    fetchProducts();
  }, [account, contract]);

  // Hàm upload ảnh
  const handleImageUpload = async (file: File) => {
    if (!file) {
      toast.error('Vui lòng chọn file ảnh!');
      throw new Error('No file selected');
    }
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await axios.post('http://localhost:5000/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!response.data.url) {
        throw new Error('Không nhận được URL ảnh từ server');
      }
      return response.data.url;
    } catch (error: any) {
      console.error('Lỗi upload ảnh:', error);
      const errorMessage = error.response?.data?.details || error.message || 'Lỗi không xác định';
      toast.error(`Lỗi khi tải ảnh lên: ${errorMessage}`);
      throw error;
    }
  };

  // Hàm xử lý submit form nhận hàng
  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!contract || !receiveTransporterName || !receiveProductId || !receiveDate || !receiveTransportInfo || !receiveImage) {
      toast.error('Vui lòng điền đầy đủ thông tin nhận hàng!');
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

      const receiveImageUrl = await handleImageUpload(receiveImage);
      const receiveTimestamp = Math.floor(new Date(receiveDate).getTime() / 1000);

      const tx = await contract.updateReceive(
        receiveProductId,
        receiveTransporterName,
        receiveTimestamp,
        receiveImageUrl,
        receiveTransportInfo
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
          productId: receiveProductId,
          userAddress: account,
          action: 'updateReceive',
          timestamp: Math.floor(Date.now() / 1000),
          receiveImageUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Cập nhật thông tin nhận hàng thành công!');
      setReceiveTransporterName('');
      setReceiveProductId('');
      setReceiveDate('');
      setReceiveTransportInfo('');
      setReceiveImage(null);
      fetchProducts();
    } catch (error: any) {
      console.error('Lỗi khi cập nhật nhận hàng:', error);
      const errorMessage =
        error.response?.data?.error || error.reason || error.message || 'Unknown error';
      toast.error(`Lỗi khi cập nhật nhận hàng: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm xử lý submit form giao hàng
  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!contract || !deliveryTransporterName || !deliveryProductId || !deliveryDate || !deliveryTransportInfo || !deliveryImage) {
      toast.error('Vui lòng điền đầy đủ thông tin giao hàng!');
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

      const deliveryImageUrl = await handleImageUpload(deliveryImage);
      const deliveryTimestamp = Math.floor(new Date(deliveryDate).getTime() / 1000);

      const tx = await contract.updateDelivery(
        deliveryProductId,
        deliveryTransporterName,
        deliveryTimestamp,
        deliveryImageUrl,
        deliveryTransportInfo
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
          productId: deliveryProductId,
          userAddress: account,
          action: 'updateDelivery',
          timestamp: Math.floor(Date.now() / 1000),
          deliveryImageUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Cập nhật thông tin giao hàng thành công!');
      setDeliveryTransporterName('');
      setDeliveryProductId('');
      setDeliveryDate('');
      setDeliveryTransportInfo('');
      setDeliveryImage(null);
      fetchProducts();
    } catch (error: any) {
      console.error('Lỗi khi cập nhật giao hàng:', error);
      const errorMessage =
        error.response?.data?.error || error.reason || error.message || 'Unknown error';
      toast.error(`Lỗi khi cập nhật giao hàng: ${errorMessage}`);
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
        <h2>Vận Chuyển</h2>
        {!account ? (
          <button className="connect-wallet-btn" onClick={connectWallet}>
            Kết Nối Ví
          </button>
        ) : (
          <div className="wallet-status">Đã Kết Nối Ví</div>
        )}
      </div>

      {/* Form Nhận Hàng */}
      <form className="dashboard-form" onSubmit={handleReceiveSubmit}>
        <h3>Cập Nhật Thông Tin Nhận Hàng</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="receiveTransporterName">Tên đơn vị vận chuyển</label>
            <input
              type="text"
              id="receiveTransporterName"
              placeholder="VD: Công ty Vận Tải Xanh"
              value={receiveTransporterName}
              onChange={(e) => setReceiveTransporterName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="receiveProductId">Mã sản phẩm (Product ID)</label>
            <input
              type="text"
              id="receiveProductId"
              placeholder="VD: CAITHIA-001"
              value={receiveProductId}
              onChange={(e) => setReceiveProductId(e.target.value)}
              disabled={isLoading}
            />
          </div>
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
          <div className="form-group form-span-2">
            <label htmlFor="receiveTransportInfo">Thông tin vận chuyển</label>
            <textarea
              id="receiveTransportInfo"
              placeholder="VD: Xe tải lạnh 59A-123.45, nhiệt độ duy trì 5°C..."
              value={receiveTransportInfo}
              onChange={(e) => setReceiveTransportInfo(e.target.value)}
              disabled={isLoading}
            />
          </div>
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
        </div>
        <button type="submit" className="primary-btn" disabled={isLoading || !account}>
          {isLoading ? 'Đang xử lý...' : 'Cập Nhật Nhận Hàng Lên Blockchain'}
        </button>
      </form>

      {/* Form Giao Hàng */}
      <form className="dashboard-form" onSubmit={handleDeliverySubmit}>
        <h3>Cập Nhật Thông Tin Giao Hàng</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="deliveryTransporterName">Tên đơn vị vận chuyển</label>
            <input
              type="text"
              id="deliveryTransporterName"
              placeholder="VD: Công ty Vận Tải Xanh"
              value={deliveryTransporterName}
              onChange={(e) => setDeliveryTransporterName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="deliveryProductId">Mã sản phẩm (Product ID)</label>
            <input
              type="text"
              id="deliveryProductId"
              placeholder="VD: CAITHIA-001"
              value={deliveryProductId}
              onChange={(e) => setDeliveryProductId(e.target.value)}
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
          <div className="form-group form-span-2">
            <label htmlFor="deliveryTransportInfo">Thông tin vận chuyển</label>
            <textarea
              id="deliveryTransportInfo"
              placeholder="VD: Xe tải lạnh 59A-123.45, nhiệt độ duy trì 5°C..."
              value={deliveryTransportInfo}
              onChange={(e) => setDeliveryTransportInfo(e.target.value)}
              disabled={isLoading}
            />
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
        <button type="submit" className="primary-btn" disabled={isLoading || !account}>
          {isLoading ? 'Đang xử lý...' : 'Cập Nhật Giao Hàng Lên Blockchain'}
        </button>
      </form>

      {/* Danh sách sản phẩm vận chuyển */}
      <div className="product-list">
        <h3>Danh Sách Thông Tin Vận Chuyển Đã Thêm</h3>
        {products.length === 0 ? (
          <p>Chưa có thông tin vận chuyển nào được thêm.</p>
        ) : (
          <table className="product-table">
            <thead>
              <tr>
                <th>Mã sản phẩm</th>
                <th>Tên đơn vị vận chuyển</th>
                <th>Ngày nhận hàng</th>
                <th>Ảnh nhận hàng</th>
                <th>Ngày giao hàng</th>
                <th>Ảnh giao hàng</th>
                <th>Thông tin vận chuyển</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={index}>
                  <td>{product.productId}</td>
                  <td>{product.transporterName}</td>
                  <td>{formatDate(product.receiveDate)}</td>
                  <td>
                    {product.receiveImageUrl ? (
                      <a href={product.receiveImageUrl} target="_blank" rel="noopener noreferrer">
                        Xem ảnh
                      </a>
                    ) : (
                      'Chưa có'
                    )}
                  </td>
                  <td>{formatDate(product.deliveryDate)}</td>
                  <td>
                    {product.deliveryImageUrl ? (
                      <a href={product.deliveryImageUrl} target="_blank" rel="noopener noreferrer">
                        Xem ảnh
                      </a>
                    ) : (
                      'Chưa có'
                    )}
                  </td>
                  <td>{product.transportInfo || 'Chưa có'}</td>
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

export default TransporterDashboard;
