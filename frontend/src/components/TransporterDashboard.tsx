import React, { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { toast } from 'react-toastify';

interface TransporterDashboardProps {
  contract: ethers.Contract | null;
  account: string;
  connectWallet: () => Promise<void>;
}

const TransporterDashboard: React.FC<TransporterDashboardProps> = ({ contract, account, connectWallet }) => {
  const [transporterName, setTransporterName] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [receiveDate, setReceiveDate] = useState<string>('');
  const [receiveImage, setReceiveImage] = useState<File | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliveryImage, setDeliveryImage] = useState<File | null>(null);
  const [transportInfo, setTransportInfo] = useState<string>('');
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

  const updateTrace = async () => {
    if (!contract || !transporterName || !productId || !receiveDate || !deliveryDate || !transportInfo || !receiveImage || !deliveryImage) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
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
      // Upload ảnh lên Cloudinary
      const receiveImageUrl = await handleImageUpload(receiveImage);
      const deliveryImageUrl = await handleImageUpload(deliveryImage);

      // Chuyển ngày thành timestamp
      const receiveTimestamp = Math.floor(new Date(receiveDate).getTime() / 1000);
      const deliveryTimestamp = Math.floor(new Date(deliveryDate).getTime() / 1000);

      // Gọi hàm updateTrace
      const tx = await contract.updateTrace(
        productId,
        transporterName,
        receiveTimestamp,
        receiveImageUrl,
        deliveryTimestamp,
        deliveryImageUrl,
        transportInfo
      );
      const receipt = await tx.wait();
      const txHash = receipt.hash; // Lấy transaction hash

      // Lấy token từ localStorage
      const token = localStorage.getItem('token');

      await axios.post(
        'http://localhost:5000/api/auth/transactions',
        {
          txHash,
          productId,
          userAddress: account,
          action: 'updateTrace',
          timestamp: Math.floor(Date.now() / 1000),
          receiveImageUrl,
          deliveryImageUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast('Cập nhật vận chuyển thành công!');
      setTransporterName('');
      setProductId('');
      setReceiveDate('');
      setDeliveryDate('');
      setTransportInfo('');
      setReceiveImage(null);
      setDeliveryImage(null);
    } catch (error) {
      console.error('Lỗi khi cập nhật trace:', error);
      alert('Lỗi khi cập nhật trace!');
    }finally {
      setIsLoading(false);
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
          type="file"
          accept="image/*"
          onChange={(e) => setReceiveImage(e.target.files?.[0] || null)}
          required
          disabled={isLoading}
        />
        <input
          type="date"
          placeholder="Ngày giao hàng thành công"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setDeliveryImage(e.target.files?.[0] || null)}
          required
          disabled={isLoading}
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