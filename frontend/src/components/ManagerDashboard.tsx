import React, { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { toast } from 'react-toastify';

interface ManagerDashboardProps {
  contract: ethers.Contract | null;
  account: string;
  connectWallet: () => Promise<void>;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ contract, account, connectWallet }) => {
  const [productId, setProductId] = useState<string>('');
  const [receiveDate, setReceiveDate] = useState<string>('');
  const [receiveImage, setReceiveImage] = useState<File | null>(null);
  const [price, setPrice] = useState<string>('');
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

  const updateManagerInfo = async () => {
    if (!contract || !productId || !receiveDate || !price || !receiveImage) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      // Kiểm tra role MANAGER_ROLE
      const hasManagerRole = await contract.hasRole(
        ethers.keccak256(ethers.toUtf8Bytes('MANAGER_ROLE')),
        account
      );
      if (!hasManagerRole) {
        toast.error('Bạn không có quyền manager!');
        return;
      }
      // Upload ảnh lên Cloudinary
      const managerReceiveImageUrl = await handleImageUpload(receiveImage);

      // Chuyển ngày thành timestamp
      const receiveTimestamp = Math.floor(new Date(receiveDate).getTime() / 1000);

      // Gọi hàm updateManagerInfo
      const tx = await contract.updateManagerInfo(
        productId,
        receiveTimestamp,
        managerReceiveImageUrl,
        ethers.parseEther(price)
      );
      const receipt = await tx.wait();
      const txHash = receipt.hash; // Lấy transaction hash

            // Lấy JWT token từ localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Vui lòng đăng nhập để lưu giao dịch!');
        return;
      }

      //Gửi transaction hash tới backend (có header Authorization)
      await axios.post(
        'http://localhost:5000/api/auth/transactions',
        {
          txHash,
          productId,
          userAddress: account,
          action: 'updateManagerInfo',
          timestamp: Math.floor(Date.now() / 1000),
          managerReceiveImageUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, 
          },
        }
      );

      toast('Cập nhật thông tin quản lý thành công!');
      setProductId('');
      setReceiveDate('');
      setPrice('');
      setReceiveImage(null);
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      toast.error('Lỗi khi cập nhật thông tin quản lý!');
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
          type="file"
          accept="image/*"
          onChange={(e) => setReceiveImage(e.target.files?.[0] || null)}
          required
          disabled={isLoading}
        />
        <input
          type="text"
          placeholder="Giá cả (ETH)"
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