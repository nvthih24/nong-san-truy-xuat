import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import CONTRACT_ABI from '../abi.json';
import './Homepage.css';
import Login from './Login';
import Register from './Register';
import { Html5Qrcode } from 'html5-qrcode';


const CONTRACT_ADDRESS = '0xe68E71cc590D54bbD9F36fcC5A2354E310a3319A';

interface TraceInfo {
  productName: string;
  productId: string;
  farmName: string;
  plantingDate: number;
  plantingImageUrl?: string;
  harvestDate: number;
  harvestImageUrl?: string;
  transporterName: string;
  receiveDate: number;
  receiveImageUrl?: string;
  deliveryDate: number;
  deliveryImageUrl?: string;
  transportInfo: string;
  managerReceiveDate: number;
  managerReceiveImageUrl?: string;
  price: number;
  isActive: boolean;
}

interface HomepageProps {
  user?: any | null;
  setUser?: (u: any | null) => void;
  onLoginSuccess?: (data: { token: string; user: any }) => void;
}

const Homepage: React.FC<HomepageProps> = ({ user: parentUser, setUser, onLoginSuccess }) => {
  const navigate = useNavigate();
  const [productId, setProductId] = useState<string>('');
  const [traceInfo, setTraceInfo] = useState<TraceInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<'none' | 'login' | 'register'>('none');
  const [user, setUserState] = useState<any | null>(null); // thêm state user
  const switchToLogin = () => setActiveModal('login');
  const switchToRegister = () => setActiveModal('register');
  const closeModal = () => setActiveModal('none');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string>('');
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const fetchTrace = async () => {
    if (!productId.trim()) {
      setError('Vui lòng nhập mã sản phẩm!');
      return;
    }

    setError('');
    setTraceInfo(null);
    setLoading(true);

    try {
      const provider = new ethers.JsonRpcProvider('https://rpc.zeroscan.org');
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const trace = await contract.getTrace(productId);

      const formattedTrace: TraceInfo = {
        productName: trace.productName,
        productId: trace.productId,
        farmName: trace.farmName,
        plantingDate: Number(trace.plantingDate),
        plantingImageUrl: trace.plantingImageUrl,
        harvestDate: Number(trace.harvestDate),
        harvestImageUrl: trace.harvestImageUrl,
        transporterName: trace.transporterName,
        receiveDate: Number(trace.receiveDate),
        receiveImageUrl: trace.receiveImageUrl,
        deliveryDate: Number(trace.deliveryDate),
        deliveryImageUrl: trace.deliveryImageUrl,
        transportInfo: trace.transportInfo,
        managerReceiveDate: Number(trace.managerReceiveDate),
        managerReceiveImageUrl: trace.managerReceiveImageUrl,
        price: trace.price,
        isActive: trace.isActive,
      };

      setTraceInfo(formattedTrace);
    } catch (err: any) {
      console.error('Lỗi khi truy xuất:', err);
      setError(
        err.reason || 'Không tìm thấy thông tin sản phẩm hoặc mã sản phẩm không hợp lệ!'
      );
    } finally {
      setLoading(false);
    }
  };
  const handleScan = (data: string | null) => {
    if (data) {
      try {
        const url = new URL(data);
        const productIdFromQR = url.pathname.split('/').pop();
        if (productIdFromQR) {
          setProductId(productIdFromQR);
          setIsScanning(false);
          setScanError('');
          fetchTrace();
        } else {
          setScanError('Mã QR không hợp lệ!');
        }
      } catch (err) {
        setScanError('Lỗi khi xử lý mã QR!');
      }
    }
  };

  const handleScanError = (err: any) => {
    console.error('Lỗi khi quét QR:', err);
    setScanError(`Lỗi: ${err.name || 'Unknown'} - ${err.message || 'Không thể truy cập camera. Vui lòng kiểm tra quyền hoặc thử lại!'}`);
  };

  const startScanner = () => {
    // Just set the state to true. The useEffect will handle the rest.
    setScanError('');
    setIsScanning(true);
  };

  const stopScanner = () => {
    if (scanner) {
      scanner.stop().then(() => {
        setScanner(null);
        setIsScanning(false);
      }).catch((err) => {
        handleScanError(err);
      });
    }
  };

  useEffect(() => {
    if (isScanning) {
      // This effect runs when isScanning becomes true
      const html5QrCode = new Html5Qrcode('qr-reader');
      setScanner(html5QrCode);

      html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // On successful scan
          handleScan(decodedText);
          html5QrCode.stop().then(() => {
            setScanner(null);
            setIsScanning(false);
          }).catch((stopErr) => console.error('Stop scanner error', stopErr));
        },
        (errorMessage) => {
          // This is a callback for non-fatal errors, not the main error handler
          // We can ignore it or log it if needed, but don't set a visible error
          // console.log(`QR Scanner non-fatal error: ${errorMessage}`);
        }
      ).catch((err) => {
        // This catches the main error, e.g., camera permissions
        handleScanError(err);
        setIsScanning(false);
      });
    }

    // Cleanup function
    return () => {
      if (scanner) {
        scanner.stop().catch((err) => console.error('Lỗi khi dừng scanner:', err));
      }
    };
  }, [isScanning]); // Rerun this effect when isScanning changes

  return (
    <div className="homepage-container">
      {/* HEADER */}
      <header className="header">
        <div className="logo">
          <Link to="/">
            <img src="/raumania.ico" alt="ThirtySix Logo" />
            ThirtySix
          </Link>
        </div>
        <nav className="nav">
          <Link to="/about">Giới thiệu</Link>
          <Link to="/contact">Liên hệ</Link>
        </nav>
        <div className="auth-actions">
          <button className="btn-login" onClick={switchToLogin}>Đăng nhập</button>
          <button className="btn-register" onClick={switchToRegister}>Đăng ký</button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1>🌾 Truy xuất nguồn gốc nông sản Việt Nam</h1>
          <p>Minh bạch hành trình sản phẩm — từ nông trại đến bàn ăn.</p>
          <div className="search-box">
            <input
              type="text"
              placeholder="Nhập mã sản phẩm..."
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              disabled={isScanning}
            />
            <button onClick={fetchTrace} disabled={isScanning}>Truy xuất</button>
          </div>

          <div className="hero-divider">hoặc</div>

          <button
            className={`qr-toggle-btn ${isScanning ? 'scanning' : ''}`}
            onClick={isScanning ? stopScanner : startScanner}
          >
            {isScanning ? 'Dừng Quét' : 'Quét Mã QR'}
          </button>

          {loading && <div className="loader"></div>}
          {error && <p className="error">{error}</p>}

          {/* Khung máy quét sẽ xuất hiện ở đây */}
          {isScanning && <div id="qr-reader"></div>}

          {scanError && <p className="error">{scanError}</p>}
        </div>
      </section>

      {/* RESULT SECTION */}
      {traceInfo && (
        <section className="result-section">
          <h3>📋 Thông Tin Sản Phẩm</h3>
          <ul className="info-list">
            {[
              ['Tên sản phẩm', traceInfo.productName],
              ['Mã sản phẩm', traceInfo.productId],
              ['Nông trại', traceInfo.farmName],
              ['Ngày gieo trồng', new Date(traceInfo.plantingDate * 1000).toLocaleDateString()],
              ['Ngày thu hoạch', traceInfo.harvestDate ? new Date(traceInfo.harvestDate * 1000).toLocaleDateString() : 'Chưa có'],
              ['Đơn vị vận chuyển', traceInfo.transporterName || 'Chưa có'],
              ['Thông tin vận chuyển', traceInfo.transportInfo || 'Chưa có'],
              ['Giá cả', traceInfo.price ? Number(ethers.formatEther(traceInfo.price)).toFixed(0) + ' Dong' : 'Chưa có'],
              ['Trạng thái', traceInfo.isActive ? 'Hoạt động' : 'Không hoạt động'],
            ].map(([label, value]) => (
              <li key={label}><strong>{label}:</strong> {value}</li>
            ))}
          </ul>

          <h3>🚚 Hành Trình Sản Phẩm</h3>
          <div className="trace-gallery">
            {[
              {
                img: traceInfo.plantingImageUrl,
                title: "🌱 Gieo trồng",
                date: traceInfo.plantingDate,
                desc: traceInfo.farmName,
              },
              {
                img: traceInfo.harvestImageUrl,
                title: "🌾 Thu hoạch",
                date: traceInfo.harvestDate,
              },
              {
                img: traceInfo.receiveImageUrl,
                title: "🚚 Vận chuyển",
                date: traceInfo.receiveDate,
                desc: traceInfo.transporterName,
              },
              {
                img: traceInfo.deliveryImageUrl,
                title: "📦 Giao hàng",
                date: traceInfo.deliveryDate,
              },
              {
                img: traceInfo.managerReceiveImageUrl,
                title: "🧾 Quản lý nhận",
                date: traceInfo.managerReceiveDate,
              },
            ]
              .filter((step) => step.img)
              .map((step, index) => (
                <div className="trace-card" key={index}>
                  <img
                    src={step.img || '/fallback.jpg'}
                    alt={step.title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Image+Available';
                    }}
                  />
                  <h4>{step.title}</h4>
                  {step.desc && <p>{step.desc}</p>}
                  <span>{new Date(step.date * 1000).toLocaleDateString()}</span>
                </div>
              ))}
          </div>

        </section>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <p>© 2025 ThirtySix — Hệ thống truy xuất nguồn gốc nông sản Việt Nam</p>
      </footer>

      {activeModal !== 'none' && (
        // Lớp nền mờ
        <div className="modal-overlay" onClick={closeModal}>
          {activeModal === 'login' && (
            <Login
              onClose={closeModal}
              switchToRegister={switchToRegister}
              setUser={setUser}
              onLoginSuccess={(data) => {
                onLoginSuccess?.(data);
                closeModal();
              }}
            />
          )}
          {activeModal === 'register' && (
            <Register
              onClose={closeModal}
              switchToLogin={switchToLogin} // Truyền hàm chuyển đổi
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Homepage;
