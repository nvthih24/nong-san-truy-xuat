import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';

interface AdminDashboardProps {
  contract: ethers.Contract | null;
  account: string;
  connectWallet: () => Promise<void>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ contract, account, connectWallet }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [userAddress, setUserAddress] = useState<string>('');
  const [role, setRole] = useState<string>('FARMER_ROLE');

  // Lấy danh sách user từ backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users', {
          headers: { 'x-auth-token': localStorage.getItem('token') || '' },
        });
        setUsers(res.data);
      } catch (err) {
        console.error('Lỗi khi lấy danh sách user:', err);
        alert('Lỗi khi lấy danh sách user!');
      }
    };
    fetchUsers();
  }, []);

  const grantRole = async () => {
    if (!contract || !userAddress || !role) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    try {
      // Kiểm tra quyền admin
      const hasAdminRole = await contract.hasRole(
        ethers.keccak256(ethers.toUtf8Bytes('DEFAULT_ADMIN_ROLE')),
        account
      );
      if (!hasAdminRole) {
        alert('Bạn không có quyền admin!');
        return;
      }

      // Gán role on-chain
      const tx = await contract.grantRole(
        ethers.keccak256(ethers.toUtf8Bytes(role)),
        userAddress
      );
      await tx.wait();
      alert(`Gán role ${role} thành công cho ${userAddress}!`);
      setUserAddress('');
      setRole('FARMER_ROLE');
    } catch (error) {
      console.error('Lỗi khi gán role:', error);
      alert('Lỗi khi gán role!');
    }
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <p>Connected: {account}</p>
      )}
      <section>
        <h3>Danh Sách User</h3>
        <table>
          <thead>
            <tr>
              <th>Họ Tên</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h3>Gán Role On-Chain</h3>
        <input
          type="text"
          placeholder="Địa chỉ wallet"
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="FARMER_ROLE">Nông dân</option>
          <option value="TRANSPORTER_ROLE">Vận chuyển</option>
          <option value="MANAGER_ROLE">Quản lý</option>
        </select>
        <button onClick={grantRole}>Gán Role</button>
      </section>
    </div>
  );
};

export default AdminDashboard;