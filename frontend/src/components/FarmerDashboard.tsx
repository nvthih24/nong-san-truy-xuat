import React, { useState } from 'react';
import { ethers } from 'ethers';

interface FarmerDashboardProps {
  contract: ethers.Contract | null;
  account: string;
  connectWallet: () => Promise<void>;
}

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ contract, account, connectWallet }) => {
  const [productName, setProductName] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [farmName, setFarmName] = useState<string>('');
  const [plantingDate, setPlantingDate] = useState<string>('');
  const [harvestDate, setHarvestDate] = useState<string>('');

  const addProduct = async () => {
    if (!contract || !productName || !productId || !farmName || !plantingDate || !harvestDate) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      // Kiểm tra role FARMER_ROLE
      const hasFarmerRole = await contract.hasRole(
        ethers.keccak256(ethers.toUtf8Bytes('FARMER_ROLE')),
        account
      );
      if (!hasFarmerRole) {
        alert('Bạn không có quyền farmer!');
        return;
      }

      // Chuyển ngày gieo trồng và ngày thu hoạch thành timestamp (Unix seconds)
      const plantingTimestamp = Math.floor(new Date(plantingDate).getTime() / 1000);
      const harvestTimestamp = Math.floor(new Date(harvestDate).getTime() / 1000);

      // Gọi hàm addProduct với các tham số mới
      const tx = await contract.addProduct(
        productName,
        productId,
        farmName,
        plantingTimestamp,
        harvestTimestamp
      );
      await tx.wait();
      alert('Sản phẩm thêm thành công!');
      // Reset form
      setProductName('');
      setProductId('');
      setFarmName('');
      setPlantingDate('');
      setHarvestDate('');
    } catch (error) {
      console.error('Lỗi khi thêm sản phẩm:', error);
      alert('Lỗi khi thêm sản phẩm!');
    }
  };

  return (
    <div>
      <h2>Nông Dân Dashboard</h2>
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <p>Connected: {account}</p>
      )}
      <section>
        <h3>Thêm Sản Phẩm Mới</h3>
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
          type="text"
          placeholder="Tên nông trại"
          value={farmName}
          onChange={(e) => setFarmName(e.target.value)}
          required
        />
        <input
          type="date"
          placeholder="Ngày gieo trồng"
          value={plantingDate}
          onChange={(e) => setPlantingDate(e.target.value)}
          required
        />
        <input
          type="date"
          placeholder="Ngày thu hoạch"
          value={harvestDate}
          onChange={(e) => setHarvestDate(e.target.value)}
          required
        />
        
        <button onClick={addProduct}>Thêm</button>
      </section>
    </div>
  );
};

export default FarmerDashboard;

