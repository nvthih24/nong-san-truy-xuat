import React, { useState } from 'react';
import { ethers } from 'ethers';

interface ManagerDashboardProps {
  contract: ethers.Contract | null;
  account: string;
  connectWallet: () => Promise<void>;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ contract, account, connectWallet }) => {
  const [productName, setProductName] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [receiveDate, setReceiveDate] = useState<string>('');
  const [price, setPrice] = useState<string>('');

  const updateManagerInfo = async () => {
    if (!contract || !productName || !productId || !receiveDate || !price) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      // Kiểm tra role MANAGER_ROLE
      const hasManagerRole = await contract.hasRole(
        ethers.keccak256(ethers.toUtf8Bytes('MANAGER_ROLE')),
        account
      );
      if (!hasManagerRole) {
        alert('Bạn không có quyền manager!');
        return;
      }

      // Chuyển ngày nhận hàng thành timestamp (Unix seconds)
      const receiveTimestamp = Math.floor(new Date(receiveDate).getTime() / 1000);

      // Gọi hàm updateManagerInfo với các tham số
      const tx = await contract.updateManagerInfo(
        productId,
        productName,
        receiveTimestamp,
        ethers.parseEther(price)
      );
      await tx.wait();
      alert('Cập nhật thông tin quản lý thành công!');
      // Reset form
      setProductName('');
      setProductId('');
      setReceiveDate('');
      setPrice('');
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      alert('Lỗi khi cập nhật thông tin quản lý!');
    }
  };

  return (
    <div>
      <h2>Quản Lý Dashboard</h2>
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <p>Connected: {account}</p>
      )}
      <section>
        <h3>Cập Nhật Thông Tin Quản Lý</h3>
        <input
          type="text"
          placeholder="Tên sản phẩm"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
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
          type="text"
          placeholder="Giá cả"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <button onClick={updateManagerInfo}>Cập Nhật</button>
      </section>
    </div>
  );
};

export default ManagerDashboard;

