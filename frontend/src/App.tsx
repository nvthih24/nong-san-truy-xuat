import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import axios from 'axios';
import './App.css';
import CONTRACT_ABI from './abi.json';
import Homepage from './components/Homepage';
import Register from './components/Register';
import Login from './components/Login';
import FarmerDashboard from './components/FarmerDashboard';
import TransporterDashboard from './components/TransporterDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import AdminDashboard from './components/AdminDashboard';
import About from './components/About';
import Contact from './components/Contact';

// Định nghĩa type cho window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

const CONTRACT_ADDRESS = "0xe68E71cc590D54bbD9F36fcC5A2354E310a3319A";

// Component chứa toàn bộ logic ứng dụng, nằm bên trong Router
const AppContent: React.FC = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string>('');
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const navigate = useNavigate(); // Hook này bây giờ hợp lệ

  // useEffect để kiểm tra token khi tải ứng dụng
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:5000/api/auth/me', { headers: { 'x-auth-token': token } })
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'));
    }
    initContract();
  }, []);

  // useEffect để điều hướng SAU KHI state `user` được cập nhật
  useEffect(() => {
    if (user && user.role) {
      navigate(`/${user.role}`);
    }
  }, [user, navigate]);

  // Hàm xử lý khi đăng nhập thành công, nhận từ component Login
  const handleLoginSuccess = (data: { token: string; user: any }) => {
    localStorage.setItem('token', data.token);
    setUser(data.user); // Cập nhật state, kích hoạt useEffect ở trên
  };

  const initContract = async () => {
    try {
      const ethProvider: any = await detectEthereumProvider();
      if (ethProvider) {
        await ethProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13d8' }],
        }).catch(async (error: any) => {
          if (error.code === 4902) {
            await ethProvider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x13d8', chainName: 'Pione Zero Chain',
                nativeCurrency: { name: 'PZO', symbol: 'PZO', decimals: 18 },
                rpcUrls: ['https://rpc.zeroscan.org'],
                blockExplorerUrls: ['https://zeroscan.org'],
              }],
            });
          } else { throw error; }
        });

        const prov = new ethers.BrowserProvider(ethProvider);
        setProvider(prov);
        const accounts = await ethProvider.request({ method: 'eth_requestAccounts' });
        const sign = await prov.getSigner(accounts[0]);
        setSigner(sign);
        const cont = new ethers.Contract(CONTRACT_ADDRESS.trim(), CONTRACT_ABI, sign);
        setContract(cont);
        setAccount(accounts[0]);
      } else {
        alert('Vui lòng cài đặt MetaMask!');
      }
    } catch (error) {
      console.error('Lỗi khi khởi tạo contract:', error);
      alert('Lỗi khi kết nối wallet hoặc contract!');
    }
  };

  const connectWallet = async () => {
    await initContract();
  };

  return (
    <Routes>
      <Route path="/" element={<Homepage user={user} setUser={setUser} onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/register" element={<Register />} />
      {/* Truyền hàm handleLoginSuccess vào Login component */}
      <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />

      {/* Các route được bảo vệ */}
      <Route
        path="/farmer"
        element={user && user.role === 'farmer' ? <FarmerDashboard contract={contract} account={account} connectWallet={connectWallet} /> : <Navigate to="/login" />}
      />
      <Route
        path="/transporter"
        element={user && user.role === 'transporter' ? <TransporterDashboard contract={contract} account={account} connectWallet={connectWallet} /> : <Navigate to="/login" />}
      />
      <Route
        path="/manager"
        element={user && user.role === 'manager' ? <ManagerDashboard contract={contract} account={account} connectWallet={connectWallet} /> : <Navigate to="/login" />}
      />
      <Route
        path="/admin"
        element={user && user.role === 'admin' ? <AdminDashboard contract={contract} account={account} connectWallet={connectWallet} /> : <Navigate to="/login" />}
      />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  );
};

// Component App chính chỉ có nhiệm vụ bọc <Router>
const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;