import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x0dF050d05D426cd2178c6f5f27a970fD6240245A';
import CONTRACT_ABI from '../abi.json'; // Đảm bảo abi.json khớp với contract

interface TraceInfo {
  farmName: string;
  harvestDate: number;
  transportInfo: string;
  certification: string;
  isActive: boolean;
}

const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const [productId, setProductId] = useState<string>('');
  const [traceInfo, setTraceInfo] = useState<TraceInfo | null>(null);
  const [error, setError] = useState<string>('');

  const fetchTrace = async () => {
    if (!productId) {
      setError('Vui lòng nhập mã sản phẩm!');
      return;
    }

    try {
      // Kết nối read-only với Pione Zero Chain
      const provider = new ethers.JsonRpcProvider('https://rpc.zeroscan.org');
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // Gọi hàm getTrace
      const trace: TraceInfo = await contract.getTrace(productId);
      setTraceInfo(trace);
      setError('');
    } catch (err) {
      console.error('Lỗi khi truy xuất:', err);
      setError('Không tìm thấy thông tin sản phẩm hoặc mã sản phẩm không hợp lệ!');
      setTraceInfo(null);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Chào Mừng Đến Với Hệ Thống Truy Xuất Nguồn Gốc Nông Sản</h1>
      <section>
        <h3>Truy Xuất Nguồn Gốc</h3>
        <input
          type="text"
          placeholder="Nhập mã sản phẩm"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          style={{ padding: '10px', margin: '10px', width: '200px' }}
        />
        <button
          onClick={fetchTrace}
          style={{ margin: '10px', padding: '10px 20px' }}
        >
          Truy Xuất
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {traceInfo && (
          <div style={{ marginTop: '20px' }}>
            <h4>Thông Tin Sản Phẩm</h4>
            <p><strong>Tên nông trại:</strong> {traceInfo.farmName}</p>
            <p><strong>Ngày thu hoạch:</strong> {new Date(traceInfo.harvestDate * 1000).toLocaleDateString()}</p>
            <p><strong>Thông tin vận chuyển:</strong> {traceInfo.transportInfo || 'Chưa có'}</p>
            <p><strong>Chứng nhận:</strong> {traceInfo.certification || 'Chưa có'}</p>
            <p><strong>Trạng thái:</strong> {traceInfo.isActive ? 'Hoạt động' : 'Không hoạt động'}</p>
          </div>
        )}
      </section>
      <section>
        <p>Vui lòng chọn một hành động:</p>
        <button
          onClick={() => navigate('/login')}
          style={{ margin: '10px', padding: '10px 20px' }}
        >
          Đăng Nhập
        </button>
        <button
          onClick={() => navigate('/register')}
          style={{ margin: '10px', padding: '10px 20px' }}
        >
          Đăng Ký
        </button>
      </section>
    </div>
  );
};

export default Homepage;