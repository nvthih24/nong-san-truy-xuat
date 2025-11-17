import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import './AuthForm.css';
import './Dashboard.css';
import 'react-toastify/dist/ReactToastify.css';

interface ModeratorDashboardProps {
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
  plantingStatus: number;
  harvestStatus: number;
}

const ModeratorDashboard: React.FC<ModeratorDashboardProps> = ({
  contract,
  account,
  connectWallet,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchId, setSearchId] = useState<string>('');
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [moderatedList, setModeratedList] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');

  // Lấy danh sách đã duyệt
  const fetchModeratedHistory = async () => {
    if (!contract || !account) return;
    try {
      const productIds: string[] = await contract.moderatedProducts(account);
      const products: Product[] = [];
      for (const id of productIds) {
        const trace = await contract.getTrace(id);
        products.push({
          productName: trace.productName,
          productId: trace.productId,
          farmName: trace.farmName,
          plantingDate: Number(trace.plantingDate),
          plantingImageUrl: trace.plantingImageUrl,
          harvestDate: Number(trace.harvestDate),
          harvestImageUrl: trace.harvestImageUrl,
          plantingStatus: Number(trace.plantingStatus),
          harvestStatus: Number(trace.harvestStatus),
        });
      }
      setModeratedList(products);
    } catch (error) {
      console.error('Lỗi lấy lịch sử duyệt:', error);
    }
  };

  // Tìm sản phẩm theo ID
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !searchId.trim()) {
      toast.error('Vui lòng nhập mã sản phẩm!');
      return;
    }

    setIsLoading(true);
    try {
      const trace = await contract.getTrace(searchId);
      const product: Product = {
        productName: trace.productName,
        productId: trace.productId,
        farmName: trace.farmName,
        plantingDate: Number(trace.plantingDate),
        plantingImageUrl: trace.plantingImageUrl,
        harvestDate: Number(trace.harvestDate),
        harvestImageUrl: trace.harvestImageUrl,
        plantingStatus: Number(trace.plantingStatus),
        harvestStatus: Number(trace.harvestStatus),
      };
      setCurrentProduct(product);
      toast.success('Tìm thấy sản phẩm!');
    } catch (error: any) {
      toast.error('Không tìm thấy sản phẩm hoặc lỗi: ' + (error.reason || error.message));
      setCurrentProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm duyệt
  const handleApprove = async (type: 'planting' | 'harvest') => {
    if (!contract || !currentProduct) return;
    setIsLoading(true);
    try {
      const tx = type === 'planting'
        ? await contract.approvePlanting(currentProduct.productId)
        : await contract.approveHarvest(currentProduct.productId);
      await tx.wait();
      toast.success(`Đã duyệt ${type === 'planting' ? 'gieo trồng' : 'thu hoạch'}!`);
      fetchModeratedHistory(); // Cập nhật lịch sử
      handleSearch(new Event('submit') as any); // Refresh sản phẩm hiện tại
    } catch (error: any) {
      toast.error(`Lỗi: ${error.reason || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (type: 'planting' | 'harvest') => {
    if (!contract || !currentProduct) return;
    setIsLoading(true);
    try {
      const tx = type === 'planting'
        ? await contract.rejectPlanting(currentProduct.productId)
        : await contract.rejectHarvest(currentProduct.productId);
      await tx.wait();
      toast.success(`Đã từ chối ${type === 'planting' ? 'gieo trồng' : 'thu hoạch'}!`);
      fetchModeratedHistory();
      handleSearch(new Event('submit') as any);
    } catch (error: any) {
      toast.error(`Lỗi: ${error.reason || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load lịch sử khi mở tab
  useEffect(() => {
    if (activeTab === 'history' && account && contract) {
      fetchModeratedHistory();
    }
  }, [activeTab, account, contract]);

  const formatDate = (ts: number) => ts === 0 ? 'Chưa cập nhật' : new Date(ts * 1000).toLocaleString('vi-VN');
  const formatStatus = (s: number) => {
    if (s === 0) return 'Chờ duyệt';
    if (s === 1) return 'Đã duyệt';
    return 'Bị từ chối';
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Kiểm Duyệt Viên</h2>
        {!account ? (
          <button className="connect-wallet-btn" onClick={connectWallet}>
            Kết Nối Ví
          </button>
        ) : (
          <div className="wallet-status">Đã kết nối</div>
        )}
      </div>

      {/* Tab */}
      <div className="tab-container">
        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Tìm & Duyệt Sản Phẩm
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Lịch Sử Đã Duyệt ({moderatedList.length})
        </button>
      </div>

      {/* === TAB TÌM & DUYỆT === */}
      {activeTab === 'search' && (
        <>
          <form className="dashboard-form" onSubmit={handleSearch}>
            <h3>Tìm Sản Phẩm Để Duyệt</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Mã sản phẩm</label>
                <input
                  type="text"
                  placeholder="VD: CAITHIA-001"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <button type="submit" className="primary-btn" disabled={isLoading || !account}>
              {isLoading ? 'Đang tìm...' : 'Tìm Sản Phẩm'}
            </button>
          </form>

          {/* Hiển thị sản phẩm tìm được */}
          {currentProduct && (
            <div className="product-detail">
              <h3>Thông Tin Sản Phẩm: {currentProduct.productId}</h3>
              <table className="product-table">
                <tbody>
                  <tr><td>Tên SP</td><td>{currentProduct.productName}</td></tr>
                  <tr><td>Nông trại</td><td>{currentProduct.farmName}</td></tr>
                  <tr><td>Ngày gieo</td><td>{formatDate(currentProduct.plantingDate)}</td></tr>
                  <tr><td>Ảnh gieo</td><td>
                    {currentProduct.plantingImageUrl ? (
                      <a href={currentProduct.plantingImageUrl} target="_blank" rel="noopener noreferrer">Xem</a>
                    ) : 'Chưa có'}
                  </td></tr>
                  <tr><td>Ngày thu hoạch</td><td>{formatDate(currentProduct.harvestDate)}</td></tr>
                  <tr><td>Ảnh thu hoạch</td><td>
                    {currentProduct.harvestImageUrl ? (
                      <a href={currentProduct.harvestImageUrl} target="_blank" rel="noopener noreferrer">Xem</a>
                    ) : 'Chưa có'}
                  </td></tr>
                  <tr><td>Trạng thái gieo</td><td>{formatStatus(currentProduct.plantingStatus)}</td></tr>
                  <tr><td>Trạng thái thu hoạch</td><td>
                    {currentProduct.harvestDate === 0 ? 'Chưa cập nhật' : formatStatus(currentProduct.harvestStatus)}
                  </td></tr>
                </tbody>
              </table>

              <div className="action-buttons">
                {currentProduct.plantingStatus === 0 && (
                  <>
                    <button onClick={() => handleApprove('planting')} disabled={isLoading} className="success-btn">
                      Duyệt Gieo Trồng
                    </button>
                    <button onClick={() => handleReject('planting')} disabled={isLoading} className="danger-btn">
                      Từ Chối
                    </button>
                  </>
                )}
                {currentProduct.harvestStatus === 0 && currentProduct.harvestDate > 0 && (
                  <>
                    <button onClick={() => handleApprove('harvest')} disabled={isLoading} className="success-btn">
                      Duyệt Thu Hoạch
                    </button>
                    <button onClick={() => handleReject('harvest')} disabled={isLoading} className="danger-btn">
                      Từ Chối
                    </button>
                  </>
                )}
                {(currentProduct.plantingStatus !== 0 && (currentProduct.harvestDate === 0 || currentProduct.harvestStatus !== 0)) && (
                  <p className="text-success">Sản phẩm đã được xử lý hoàn tất.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* === TAB LỊCH SỬ === */}
      {activeTab === 'history' && (
        <div className="product-list">
          <h3>Lịch Sử Sản Phẩm Đã Duyệt</h3>
          {moderatedList.length === 0 ? (
            <p>Chưa duyệt sản phẩm nào.</p>
          ) : (
            <table className="product-table">
              <thead>
                <tr>
                  <th>Mã SP</th>
                  <th>Tên SP</th>
                  <th>Nông trại</th>
                  <th>Gieo</th>
                  <th>Thu hoạch</th>
                </tr>
              </thead>
              <tbody>
                {moderatedList.map((p, i) => (
                  <tr key={i}>
                    <td>{p.productId}</td>
                    <td>{p.productName}</td>
                    <td>{p.farmName}</td>
                    <td>{formatStatus(p.plantingStatus)}</td>
                    <td>{p.harvestDate === 0 ? 'Chưa' : formatStatus(p.harvestStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ModeratorDashboard;