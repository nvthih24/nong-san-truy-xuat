import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { QrReader } from 'react-qr-reader';
import CONTRACT_ABI from '../abi.json';

const CONTRACT_ADDRESS = '0x3E3092bf6Ef5C54Ee5d01B18120c4789eDBbbDf8';

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

const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const [productId, setProductId] = useState<string>('');
  const [traceInfo, setTraceInfo] = useState<TraceInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string>('');

  const fetchTrace = async (id: string = productId) => {
    if (!id) {
      setError('Vui lòng nhập mã sản phẩm!');
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider('https://rpc.zeroscan.org');
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const trace = await contract.getTrace(id);
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
        price: Number(trace.price),
        isActive: trace.isActive,
      };
      setTraceInfo(formattedTrace);
      setError('');
    } catch (err: any) {
      console.error('Lỗi khi truy xuất:', err);
      setError(err.reason || 'Không tìm thấy thông tin sản phẩm hoặc mã sản phẩm không hợp lệ!');
      setTraceInfo(null);
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
          fetchTrace(productIdFromQR);
        } else {
          setScanError('Mã QR không hợp lệ!');
        }
      } catch (err) {
        setScanError('Lỗi khi xử lý mã QR!');
      }
    }
  };

  const handleScanError = (err: any) => {
    console.error('Lỗi khi quét QR:', err.name, err.message);
    setScanError(`Lỗi: ${err.name} - ${err.message || 'Không thể truy cập camera. Vui lòng kiểm tra quyền hoặc thử lại!'}`);
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Chào Mừng Đến Với Hệ Thống Truy Xuất Nguồn Gốc Nông Sản</h1>
      <section>
        <h3>Truy Xuất Nguồn Gốc</h3>
        <input
          type="text"
          placeholder="Nhập mã sản phẩm (ví dụ: SP001)"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          style={{ padding: '10px', margin: '10px', width: '200px' }}
        />
        <button onClick={() => fetchTrace()} style={{ margin: '10px', padding: '10px 20px' }}>
          Truy Xuất
        </button>
        <button
          onClick={() => setIsScanning(!isScanning)}
          style={{ margin: '10px', padding: '10px 20px' }}
        >
          {isScanning ? 'Dừng Quét QR' : 'Quét QR'}
        </button>
{isScanning && (
  <div
    style={{
      width: '100%',
      maxWidth: '400px',
      height: '400px', // Chiều cao cố định để đảm bảo hiển thị
      margin: '20px auto',
      border: '2px solid #000', // Viền để dễ debug
      overflow: 'hidden', // Ngăn tràn nội dung
      position: 'relative', // Đảm bảo định vị đúng
    }}
  >
    <QrReader
      onResult={(result, error) => {
        if (result) {
          handleScan(result.getText());
        }
        if (error) {
          handleScanError(error);
        }
      }}
      constraints={{
        facingMode: { ideal: 'environment' },
        width: { ideal: 640 },
        height: { ideal: 480 },
      }}
      // Xóa thuộc tính style khỏi QrReader
    />
  </div>
)}
        {scanError && <p style={{ color: 'red' }}>{scanError}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {traceInfo && (
          <div style={{ marginTop: '20px', textAlign: 'left', maxWidth: '600px', margin: '20px auto' }}>
            <h4>Thông Tin Sản Phẩm</h4>
            <p><strong>Tên sản phẩm:</strong> {traceInfo.productName || 'Chưa có'}</p>
            <p><strong>Mã sản phẩm:</strong> {traceInfo.productId}</p>
            <p><strong>Tên nông trại:</strong> {traceInfo.farmName || 'Chưa có'}</p>
            <p>
              <strong>Ngày gieo trồng:</strong>{' '}
              {traceInfo.plantingDate ? new Date(traceInfo.plantingDate * 1000).toLocaleDateString() : 'Chưa có'}
            </p>
            {traceInfo.plantingImageUrl && (
              <div>
                <strong>Ảnh gieo trồng:</strong>
                <br />
                <img src={traceInfo.plantingImageUrl} alt="Planting" style={{ maxWidth: '100%', height: 'auto' }} />
              </div>
            )}
            <p>
              <strong>Ngày thu hoạch:</strong>{' '}
              {traceInfo.harvestDate ? new Date(traceInfo.harvestDate * 1000).toLocaleDateString() : 'Chưa có'}
            </p>
            {traceInfo.harvestImageUrl && (
              <div>
                <strong>Ảnh thu hoạch:</strong>
                <br />
                <img src={traceInfo.harvestImageUrl} alt="Harvest" style={{ maxWidth: '100%', height: 'auto' }} />
              </div>
            )}
            <p><strong>Tên đơn vị vận chuyển:</strong> {traceInfo.transporterName || 'Chưa có'}</p>
            <p>
              <strong>Ngày nhận hàng (vận chuyển):</strong>{' '}
              {traceInfo.receiveDate ? new Date(traceInfo.receiveDate * 1000).toLocaleDateString() : 'Chưa có'}
            </p>
            {traceInfo.receiveImageUrl && (
              <div>
                <strong>Ảnh nhận hàng:</strong>
                <br />
                <img src={traceInfo.receiveImageUrl} alt="Receive" style={{ maxWidth: '100%', height: 'auto' }} />
              </div>
            )}
            <p>
              <strong>Ngày giao hàng:</strong>{' '}
              {traceInfo.deliveryDate ? new Date(traceInfo.deliveryDate * 1000).toLocaleDateString() : 'Chưa có'}
            </p>
            {traceInfo.deliveryImageUrl && (
              <div>
                <strong>Ảnh giao hàng:</strong>
                <br />
                <img src={traceInfo.deliveryImageUrl} alt="Delivery" style={{ maxWidth: '100%', height: 'auto' }} />
              </div>
            )}
            <p><strong>Thông tin vận chuyển:</strong> {traceInfo.transportInfo || 'Chưa có'}</p>
            <p>
              <strong>Ngày nhận hàng (quản lý):</strong>{' '}
              {traceInfo.managerReceiveDate ? new Date(traceInfo.managerReceiveDate * 1000).toLocaleDateString() : 'Chưa có'}
            </p>
            {traceInfo.managerReceiveImageUrl && (
              <div>
                <strong>Ảnh nhận hàng (quản lý):</strong>
                <br />
                <img
                  src={traceInfo.managerReceiveImageUrl}
                  alt="Manager Receive"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
            )}
            <p>
              <strong>Giá cả:</strong>{' '}
              {traceInfo.price ? ethers.formatEther(traceInfo.price.toString()) + ' ETH' : 'Chưa có'}
            </p>
            <p><strong>Trạng thái:</strong> {traceInfo.isActive ? 'Hoạt động' : 'Không hoạt động'}</p>
          </div>
        )}
      </section>
      <section>
        <p>Vui lòng chọn một hành động:</p>
        <button onClick={() => navigate('/login')} style={{ margin: '10px', padding: '10px 20px' }}>
          Đăng Nhập
        </button>
        <button onClick={() => navigate('/register')} style={{ margin: '10px', padding: '10px 20px' }}>
          Đăng Ký
        </button>
      </section>
    </div>
  );
};

export default Homepage;