import React, { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { toast } from 'react-toastify';

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
  const [plantingImage, setPlantingImage] = useState<File | null>(null);
  const [harvestDate, setHarvestDate] = useState<string>('');
  const [harvestImage, setHarvestImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Hàm upload ảnh lên Cloudinary và trả về URL
  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axios.post('http://localhost:5000/api/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  };


  const addProduct = async () => {
    if (!contract || !productName || !productId || !farmName || !plantingDate || !harvestDate || !plantingImage || !harvestImage) {
      toast.error('Vui lòng điền đầy đủ thông tin và chọn ảnh!');
      return;
    }

    setIsLoading(true);
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
      // Upload ảnh lên Cloudinary
      const plantingImageUrl = await handleImageUpload(plantingImage);
      const harvestImageUrl = await handleImageUpload(harvestImage);

      // Chuyển ngày thành timestamp
      const plantingTimestamp = Math.floor(new Date(plantingDate).getTime() / 1000);
      const harvestTimestamp = Math.floor(new Date(harvestDate).getTime() / 1000);

      // Gọi hàm addProduct
      const tx = await contract.addProduct(
        productName,
        productId,
        farmName,
        plantingTimestamp,
        plantingImageUrl,
        harvestTimestamp,
        harvestImageUrl
      );
      const receipt = await tx.wait();
      const txHash = receipt.hash;

      // Lấy JWT token từ localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Vui lòng đăng nhập để lưu giao dịch!');
        return;
      }

      // Gửi transaction hash tới backend
      const response = await axios.post(
        'http://localhost:5000/api/auth/transactions',
        {
          txHash,
          productId,
          userAddress: account,
          action: 'addProduct',
          timestamp: Math.floor(Date.now() / 1000),
          plantingImageUrl,
          harvestImageUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            
          },
          
        }
      );
      console.log('Giao dịch đã được lưu:', response.data);

      alert(`Sản phẩm thêm thành công!`);
      setProductName('');
      setProductId('');
      setFarmName('');
      setPlantingDate('');
      setHarvestDate('');
      setPlantingImage(null);
      setHarvestImage(null);
    } catch (error: any) {
      console.error('Lỗi khi thêm sản phẩm:', error);
      const errorMessage =
        error.response?.data?.error || // Lỗi từ backend
        error.reason || // Lỗi từ blockchain
        error.message || // Lỗi chung
        'Unknown error';
      alert(`Lỗi khi thêm sản phẩm: ${errorMessage}`);
    } finally {
      setIsLoading(false);
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
          disabled={isLoading}
        />
        <input
          type="text"
          placeholder="Mã sản phẩm"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          required
          disabled={isLoading}
        />
        <input
          type="text"
          placeholder="Tên nông trại"
          value={farmName}
          onChange={(e) => setFarmName(e.target.value)}
          required
          disabled={isLoading}
        />
        <input
          type="date"
          placeholder="Ngày gieo trồng"
          value={plantingDate}
          onChange={(e) => setPlantingDate(e.target.value)}
          required
          disabled={isLoading}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPlantingImage(e.target.files?.[0] || null)}
          required
          disabled={isLoading}
        />
        <input
          type="date"
          placeholder="Ngày thu hoạch"
          value={harvestDate}
          onChange={(e) => setHarvestDate(e.target.value)}
          required
          disabled={isLoading}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setHarvestImage(e.target.files?.[0] || null)}
          required
          disabled={isLoading}
        />
        <button onClick={addProduct} disabled={isLoading}>
          {isLoading ? 'Đang xử lý...' : 'Thêm'}
        </button>
      </section>
    </div>
  );
};

export default FarmerDashboard;

