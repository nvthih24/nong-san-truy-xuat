import React, { useState } from 'react';
import { ethers } from 'ethers';

interface TransporterDashboardProps {
  contract: ethers.Contract | null;
  account: string;
  connectWallet: () => Promise<void>;
}

const TransporterDashboard: React.FC<TransporterDashboardProps> = ({ contract, account, connectWallet }) => {
  const [transporterName, setTransporterName] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [receiveDate, setReceiveDate] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [transportInfo, setTransportInfo] = useState<string>('');

  const updateTrace = async () => {
    if (!contract || !transporterName || !productId || !receiveDate || !deliveryDate || !transportInfo) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      // Kiểm tra role TRANSPORTER_ROLE
      const hasTransporterRole = await contract.hasRole(
        ethers.keccak256(ethers.toUtf8Bytes('TRANSPORTER_ROLE')),
        account
      );
      if (!hasTransporterRole) {
        alert('Bạn không có quyền transporter!');
        return;
      }

      // Chuyển ngày thành timestamp
      const receiveTimestamp = Math.floor(new Date(receiveDate).getTime() / 1000);
      const deliveryTimestamp = Math.floor(new Date(deliveryDate).getTime() / 1000);

      // Gọi hàm updateTrace
      const tx = await contract.updateTrace(
        productId,
        transporterName,
        receiveTimestamp,
        deliveryTimestamp,
        transportInfo
      );
      await tx.wait();
      alert('Cập nhật trace thành công!');
      setTransporterName('');
      setProductId('');
      setReceiveDate('');
      setDeliveryDate('');
      setTransportInfo('');
    } catch (error) {
      console.error('Lỗi khi cập nhật trace:', error);
      alert('Lỗi khi cập nhật trace!');
    }
  };

  return (
    <div>
      <h2>Vận Chuyển Dashboard</h2>
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <p>Connected: {account}</p>
      )}
      <section>
        <h3>Cập Nhật Thông Tin Vận Chuyển</h3>
        <input
          type="text"
          placeholder="Tên đơn vị vận chuyển"
          value={transporterName}
          onChange={(e) => setTransporterName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Mã sản phẩm"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          required
        />
        <input
          type="date"
          placeholder="Ngày nhận hàng"
          value={receiveDate}
          onChange={(e) => setReceiveDate(e.target.value)}
          required
        />
        <input
          type="date"
          placeholder="Ngày giao hàng thành công"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Thông tin vận chuyển"
          value={transportInfo}
          onChange={(e) => setTransportInfo(e.target.value)}
          required
        />
        <button onClick={updateTrace}>Cập Nhật</button>
      </section>
    </div>
  );
};

export default TransporterDashboard;