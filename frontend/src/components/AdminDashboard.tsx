import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import CONTRACT_ABI from '../abi.json';
import './AdminDashboard.css';
import './Dashboard.css';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
const CONTRACT_ADDRESS = '0xe68E71cc590D54bbD9F36fcC5A2354E310a3319A';

interface AdminDashboardProps {
  contract: ethers.Contract | null;
  account: string;
  connectWallet: () => Promise<void>;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  address: string;
  isBlocked: boolean;
}

interface Product {
  productId: string;
  productName: string;
  farmName: string;
  plantingDate: string;
  harvestDate: string;
  isActive: boolean;
  plantingImage: string;
  harvestImage: string;
  transportImage: string;
  manageImage: string;
}

interface Transaction {
  _id: string;
  txHash: string;
  productId: string;
  action: string;
  timestamp: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ contract, account, connectWallet }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalTransactions: 0,
    totalTraces: 0,
  });
  const [selectedTab, setSelectedTab] = useState<'stats' | 'users' | 'products'>('stats');
  const [selectedUserRole, setSelectedUserRole] = useState<'farmer' | 'transporter' | 'manager'>('farmer');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [role, setRole] = useState<string>('FARMER_ROLE');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [qrCodes, setQRCodes] = useState<any[]>([]);
  const token = localStorage.getItem('token');

  const [chartData, setChartData] = useState({
    labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
    datasets: [
      {
        label: 'Sản phẩm mới / tuần',
        data: [0, 0, 0, 0],
        backgroundColor: 'rgba(75,192,192,0.5)',
      },
    ],
  });

  // Fetch danh sách mã QR
  useEffect(() => {
    const fetchQRCodes = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/qrcodes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQRCodes(res.data);
      } catch (error) {
        console.error('❌ Lỗi khi lấy danh sách mã QR:', error);
        alert('Lỗi khi tải danh sách mã QR!');
      }
    };

    fetchQRCodes();
  }, []);

  // Fetch sản phẩm từ blockchain
  useEffect(() => {
    const fetchBlockchainProducts = async () => {
      setLoadingProducts(true);
      try {
        const provider = new ethers.JsonRpcProvider('https://rpc.zeroscan.org');
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        const total = await contractInstance.nextProductId();
        const count = Number(total);
        if (count === 0) {
          console.warn('⚠️ Không có sản phẩm nào trên blockchain.');
          setProducts([]);
          return;
        }

        const tempProducts = [];
        const weekCounts = [0, 0, 0, 0];
        const now = Date.now();
        const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
        const weekLabels = [];

        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(now - i * oneWeekMs);
          const weekEnd = new Date(now - (i - 1) * oneWeekMs);
          weekLabels.push(
            `${weekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - ` +
            `${weekEnd.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`
          );
        }

        for (let i = 1; i < count; i++) {
          try {
            const productId = await contractInstance.indexToProductId(i);
            const trace = await contractInstance.getTrace(productId);

            const plantingDate = Number(trace.plantingDate) * 1000;
            const weeksAgo = Math.floor((now - plantingDate) / oneWeekMs);
            if (weeksAgo >= 0 && weeksAgo < 4) {
              weekCounts[weeksAgo]++;
            }

            tempProducts.push({
              productId: trace.productId,
              productName: trace.productName,
              farmName: trace.farmName,
              plantingDate: new Date(plantingDate).toLocaleDateString(),
              harvestDate: new Date(Number(trace.harvestDate) * 1000).toLocaleDateString(),
              isActive: trace.isActive,
              plantingImage: trace.plantingImageUrl,
              harvestImage: trace.harvestImageUrl,
              transportImage: trace.receiveImageUrl,
              manageImage: trace.managerReceiveImageUrl,
              managerReceiveImageUrl: trace.managerReceiveImageUrl,
            });
          } catch (err) {
            console.warn(`⚠️ Không đọc được sản phẩm id=${i}:`, err);
          }
        }

        if (tempProducts.length === 0) {
          console.warn('⚠️ Không lấy được sản phẩm nào từ blockchain.');
          alert('Không tìm thấy sản phẩm nào trên blockchain!');
        }

        setChartData({
          labels: weekLabels,
          datasets: [
            {
              label: 'Sản phẩm mới / tuần',
              data: weekCounts,
              backgroundColor: 'rgba(75,192,192,0.5)',
            },
          ],
        });

        setProducts(tempProducts);
      } catch (error) {
        console.error('❌ Lỗi khi đọc sản phẩm từ blockchain:', error);
        alert('Lỗi khi tải danh sách sản phẩm từ blockchain!');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchBlockchainProducts();
  }, []);

  // Fetch thống kê tổng hợp
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const usersRes = await axios.get('http://localhost:5000/api/auth/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const totalUsers = usersRes.data.length || 0;

        let totalTransactions = 0;
        try {
          const transactionsRes = await axios.get('http://localhost:5000/api/auth/transactions', {
            headers: { Authorization: `Bearer ${token}` },
          });
          totalTransactions = transactionsRes.data.length || 0;
        } catch {
          console.warn('⚠️ Không lấy được giao dịch');
        }

        const provider = new ethers.JsonRpcProvider('https://rpc.zeroscan.org');
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        let totalTraces = 0;
        try {
          const total = await contractInstance.nextProductId();
          totalTraces = Number(total) - 1;
        } catch (err) {
          console.warn('⚠️ Không đọc được tổng số truy xuất từ blockchain:', err);
        }

        let totalProducts = 0;
        try {
          const nextProductId = await contractInstance.nextProductId();
          totalProducts = Number(nextProductId) - 1;
        } catch {
          console.warn('⚠️ Không lấy được sản phẩm on-chain');
        }

        setStats({
          totalUsers,
          totalProducts,
          totalTransactions,
          totalTraces,
        });
      } catch (error) {
        console.error('❌ Lỗi khi lấy thống kê:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch danh sách users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/auth/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const filteredUsers = res.data.filter((user: User) => user.role === selectedUserRole);
        setUsers(filteredUsers);
      } catch (error) {
        console.error('❌ Error fetching users:', error);
      }
    };
    fetchUsers();
  }, [selectedUserRole]);

  // Fetch danh sách giao dịch
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/auth/transactions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTransactions(res.data);
      } catch (error) {
        console.error('❌ Error fetching transactions:', error);
      }
    };
    fetchTransactions();
  }, []);

  // Tạo mã QR
  const generateQRCode = async (productId: string) => {
    if (!token) {
      alert('Vui lòng đăng nhập lại!');
      return;
    }
    try {
      const qrContent = `http://yourapp.com/trace/${productId}`;
      const res = await axios.post(
        'http://localhost:5000/api/qrcodes',
        { productId, qrContent, createdBy: account },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQRCodes([...qrCodes, res.data.qrCode]);
      alert('✅ Tạo mã QR thành công!');
    } catch (error) {
      console.error('❌ Lỗi khi tạo mã QR:', error);
      alert('Lỗi khi tạo mã QR!');
    }
  };

  // Xóa mã QR
  const deleteQRCode = async (qrCodeId: string) => {
    if (!token) {
      alert('Vui lòng đăng nhập lại!');
      return;
    }
    try {
      await axios.delete(`http://localhost:5000/api/qrcodes/${qrCodeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQRCodes(qrCodes.filter((qr) => qr._id !== qrCodeId));
      alert('✅ Xóa mã QR thành công!');
    } catch (error) {
      console.error('❌ Lỗi khi xóa mã QR:', error);
      alert('Lỗi khi xóa mã QR!');
    }
  };

  // In mã QR
  const printQRCode = async (qrCode: any, product: Product) => {
    try {
      const doc = new jsPDF();
      
      // Tiêu đề
      doc.setFontSize(16);
      doc.text('Mã QR Sản phẩm', 20, 20);
      
      // Thông tin sản phẩm
      doc.setFontSize(12);
      doc.text(`Mã sản phẩm: ${product.productId}`, 20, 40);
      doc.text(`Tên sản phẩm: ${product.productName}`, 20, 50);
      doc.text(`Nông trại: ${product.farmName}`, 20, 60);
      doc.text(`Ngày gieo trồng: ${product.plantingDate}`, 20, 70);
      doc.text(`Ngày thu hoạch: ${product.harvestDate}`, 20, 80);

      // Tải hình ảnh mã QR
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = qrCode.qrImageUrl;

      await new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Không thể tải hình ảnh mã QR'));
      });

      // Tạo canvas để chuyển hình ảnh thành base64
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Không thể tạo canvas context');
      }
      ctx.drawImage(img, 0, 0);
      const imgData = canvas.toDataURL('image/png');

      // Thêm hình ảnh mã QR vào PDF
      doc.addImage(imgData, 'PNG', 20, 90, 50, 50);

      // Lưu file PDF
      doc.save(`qr_${product.productId}.pdf`);
    } catch (error) {
      console.error('❌ Lỗi khi in mã QR:', error);
      alert('Lỗi khi tạo file PDF mã QR!');
    }
  };

  // Gán role on-chain
  const grantRole = async () => {
    if (!contract || !userAddress || !role) {
      toast.warn('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    try {
      setIsLoading(true);
      const hasAdminRole = await contract.hasRole(
        ethers.keccak256(ethers.toUtf8Bytes('DEFAULT_ADMIN_ROLE')),
        account
      );
      if (!hasAdminRole) {
        toast.error('Bạn không có quyền admin!');
        return;
      }
      const tx = await contract.grantRole(
        ethers.keccak256(ethers.toUtf8Bytes(role)),
        userAddress
      );
      await tx.wait();
      toast.success(`Gán role ${role} thành công cho ${userAddress}!`);
      setUserAddress('');
      setRole('FARMER_ROLE');
    } catch (error) {
      console.error('Lỗi khi gán role:', error);
      toast.error('Lỗi khi gán role!');
    } finally {
      setIsLoading(false);
    }
  };

  // Khóa / Mở khóa tài khoản
  const toggleUserBlock = async (userId: string, isBlocked: boolean) => {
    try {
      await axios.put(
        `http://localhost:5000/api/auth/users/${userId}/block`,
        { isBlocked: !isBlocked }, // Sửa logic: gửi trạng thái mới
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users.map((user) => (user._id === userId ? { ...user, isBlocked: !isBlocked } : user)));
      toast.success(`${isBlocked ? 'Mở khóa' : 'Khóa'} tài khoản thành công!`);
    } catch (error) {
      console.error('Error toggling user block:', error);
      toast.error('Lỗi khi cập nhật tài khoản!');
    }
  };

  // Hàm rút gọn địa chỉ ví
  const truncateAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Xem chi tiết user
  const viewUserDetail = (user: User) => {
    setSelectedUser(user);
  };

  // Xuất CSV
  const exportCSV = () => {
    const csvData = users.map((user) => ({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked ? 'Khóa' : 'Hoạt động',
    }));
    return (
      <CSVLink
        data={csvData}
        filename="users.csv"
        className="btn-action btn-secondary" // <-- Thêm class này
        style={{ textDecoration: 'none' }} // <-- Thêm style này để bỏ gạch chân
      >
        Xuất CSV
      </CSVLink>
    );
  };

  // Xuất PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Danh sách người dùng', 10, 10);
    users.forEach((user, index) => {
      doc.text(`${index + 1}. ${user.fullName} - ${user.email} - ${user.role}`, 10, 20 + index * 10);
    });
    doc.save('users.pdf');
  };

  return (
    <div className="admin-container">
      {/* HEADER */}
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        {!account ? (
          <button className="connect-wallet-btn" onClick={connectWallet}>Kết Nối Ví</button>
        ) : (
          <div className="wallet-status">{truncateAddress(account)}</div>
        )}
      </div>

      {/* TABS */}
      <div className="admin-tabs">
        <button className={`tab-btn ${selectedTab === 'stats' ? 'active' : ''}`} onClick={() => setSelectedTab('stats')}>📊 Thống kê</button>
        <button className={`tab-btn ${selectedTab === 'users' ? 'active' : ''}`} onClick={() => setSelectedTab('users')}>👥 Người dùng</button>
        <button className={`tab-btn ${selectedTab === 'products' ? 'active' : ''}`} onClick={() => setSelectedTab('products')}>📦 Sản phẩm</button>
      </div>

      {/* --- NỘI DUNG TAB THỐNG KÊ --- */}
      {selectedTab === 'stats' && (
        <>
          <section className="admin-section">
            <h3>Tổng quan hệ thống</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Tổng người dùng</div>
                <div className="stat-value">{stats.totalUsers}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Tổng sản phẩm (on-chain)</div>
                <div className="stat-value">{stats.totalProducts}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Giao dịch đã lưu</div>
                <div className="stat-value">{stats.totalTransactions}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Lượt truy xuất</div>
                <div className="stat-value">{stats.totalTraces}</div>
              </div>
            </div>
            <div className="chart-container">
              <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </section>

          <section className="admin-section role-form">
            <h3>Cấp quyền truy cập Blockchain</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="userAddress">Địa chỉ ví</label>
                <input type="text" id="userAddress" placeholder="0x..." value={userAddress} onChange={(e) => setUserAddress(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="role">Vai trò</label>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="FARMER_ROLE">Nông dân</option>
                  <option value="TRANSPORTER_ROLE">Vận chuyển</option>
                  <option value="MANAGER_ROLE">Quản lý</option>
                </select>
              </div>
              <button className="primary-btn" onClick={grantRole} disabled={isLoading}>{isLoading ? 'Đang xử lý...' : 'Gán quyền'}</button>
            </div>
          </section>
        </>
      )}

      {/* --- NỘI DUNG TAB NGƯỜI DÙNG --- */}
      {selectedTab === 'users' && (
        <section className="admin-section">
          <div className="table-controls">
            <div className="filter-tabs">
              <button className={`filter-btn ${selectedUserRole === 'farmer' ? 'active' : ''}`} onClick={() => setSelectedUserRole('farmer')}>Nông dân</button>
              <button className={`filter-btn ${selectedUserRole === 'transporter' ? 'active' : ''}`} onClick={() => setSelectedUserRole('transporter')}>Vận chuyển</button>
              <button className={`filter-btn ${selectedUserRole === 'manager' ? 'active' : ''}`} onClick={() => setSelectedUserRole('manager')}>Quản lý</button>
            </div>
            <div className="export-buttons">
              {exportCSV()} {/* CSVLink tự render thẻ a */}
              <button onClick={exportPDF} className="btn-action btn-secondary">Xuất PDF</button>
            </div>
          </div>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.isBlocked ? 'Khóa' : 'Hoạt động'}</td>
                    <td className="action-buttons">
                      <button className="btn-action btn-primary" onClick={() => viewUserDetail(u)}>Chi tiết</button>
                      <button className={`btn-action ${u.isBlocked ? 'btn-success' : 'btn-danger'}`} onClick={() => toggleUserBlock(u._id, u.isBlocked)}>
                        {u.isBlocked ? 'Mở khóa' : 'Khóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* --- MODAL CHI TIẾT NGƯỜI DÙNG --- */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết người dùng: {selectedUser.fullName}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedUser(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p><b>ID:</b> {selectedUser._id}</p>
              <p><b>Họ tên:</b> {selectedUser.fullName}</p>
              <p><b>Email:</b> {selectedUser.email}</p>
              <p><b>Vai trò:</b> {selectedUser.role}</p>
              <p><b>Địa chỉ ví:</b> {selectedUser.address}</p>
              <p><b>Trạng thái:</b> {selectedUser.isBlocked ? 'Đang bị khóa' : 'Hoạt động'}</p>
            </div>
          </div>
        </div>
      )}
      {/* --- KẾT THÚC MODAL NGƯỜI DÙNG --- */}



      {/* --- NỘI DUNG TAB SẢN PHẨM --- */}
      {selectedTab === 'products' && (
        <section className="admin-section">
          <h3>Danh sách sản phẩm (on-chain)</h3>
          {loadingProducts ? (
            <p>Đang tải dữ liệu từ blockchain...</p>
          ) : products.length === 0 ? (
            <p>Chưa có sản phẩm nào được ghi nhận.</p>
          ) : (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã sản phẩm</th>
                    <th>Tên sản phẩm</th>
                    <th>Nông trại</th>
                    <th>Ngày gieo trồng</th>
                    <th>Ngày thu hoạch</th>
                    <th>Trạng thái</th>
                    <th>Mã QR</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, index) => {
                    const qrCode = qrCodes.find((qr) => qr.productId === p.productId);
                    return (
                      <tr key={index}>
                        <td>{p.productId}</td>
                        <td>{p.productName}</td>
                        <td>{p.farmName}</td>
                        <td>{p.plantingDate}</td>
                        <td>{p.harvestDate}</td>
                        <td>{p.isActive ? 'Hoạt động' : 'Ngừng'}</td>
                        <td className="action-buttons">
                          {qrCode ? (
                            <>
                              <img src={qrCode.qrImageUrl} alt="QR" width="40" style={{ borderRadius: '4px' }} />
                              <button className="btn-action btn-warning" onClick={() => printQRCode(qrCode, p)}>In</button>
                              <button className="btn-action btn-danger" onClick={() => deleteQRCode(qrCode._id)}>Xóa</button>
                            </>
                          ) : (
                            <button className="btn-action btn-success" onClick={() => generateQRCode(p.productId)}>Tạo QR</button>
                          )}
                        </td>
                        <td>
                          <button className="btn-action btn-primary" onClick={() => setSelectedProduct(p)}>Xem chi tiết</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* MODAL CHI TIẾT SẢN PHẨM */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết sản phẩm: {selectedProduct.productName}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedProduct(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p><b>Mã sản phẩm:</b> {selectedProduct.productId}</p>
              <p><b>Tên sản phẩm:</b> {selectedProduct.productName}</p>
              <p><b>Nông trại:</b> {selectedProduct.farmName}</p>
              <p><b>Ngày gieo trồng:</b> {selectedProduct.plantingDate}</p>
              <p><b>Ngày thu hoạch:</b> {selectedProduct.harvestDate}</p>
              <p><b>Trạng thái:</b> {selectedProduct.isActive ? 'Hoạt động' : 'Ngừng'}</p>
              {qrCodes.find((qr) => qr.productId === selectedProduct.productId) && (
                <div>
                  <p><b>Mã QR:</b></p>
                  <img
                    src={qrCodes.find((qr) => qr.productId === selectedProduct.productId)?.qrImageUrl}
                    alt="QR Code"
                    width="100"
                  />
                </div>
              )}
              <h4>🖼️ Hình ảnh truy xuất</h4>
              <div className="image-gallery">
                {selectedProduct.plantingImage && (
                  <div>
                    <p>Gieo trồng:</p>
                    <img src={selectedProduct.plantingImage} alt="Planting" />
                  </div>
                )}
                {selectedProduct.harvestImage && (
                  <div>
                    <p>Thu hoạch:</p>
                    <img src={selectedProduct.harvestImage} alt="Harvest" />
                  </div>
                )}
                {selectedProduct.transportImage && (
                  <div>
                    <p>Vận chuyển:</p>
                    <img src={selectedProduct.transportImage} alt="Transport" />
                  </div>
                )}
                {selectedProduct.manageImage && (
                  <div>
                    <p>Quản lý:</p>
                    <img src={selectedProduct.manageImage} alt="Manage" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;