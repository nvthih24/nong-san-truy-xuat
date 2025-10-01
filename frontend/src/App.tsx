import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import axios from 'axios';
import './App.css';
import CONTRACT_ABI from './abi.json';
import Homepage from './components/Homepage'; // Thêm Homepage
import Register from './components/Register';
import Login from './components/Login';
import FarmerDashboard from './components/FarmerDashboard';
import TransporterDashboard from './components/TransporterDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import AdminDashboard from './components/AdminDashboard';

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

const CONTRACT_ADDRESS = "0x0dF050d05D426cd2178c6f5f27a970fD6240245A";

const App: React.FC = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string>('');
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);

  // Check if user is logged in (JWT from localStorage)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .get('http://localhost:5000/api/auth/me', {
          headers: { 'x-auth-token': token },
        })
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'));
    }
    initContract();
  }, []);

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
              params: [
                {
                  chainId: '0x13d8',
                  chainName: 'Pione Zero Chain',
                  nativeCurrency: { name: 'PZO', symbol: 'PZO', decimals: 18 },
                  rpcUrls: ['https://rpc.zeroscan.org'],
                  blockExplorerUrls: ['https://zeroscan.org'],
                },
              ],
            });
          } else {
            throw error;
          }
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
    try {
      const ethProvider: any = await detectEthereumProvider();
      if (ethProvider) {
        await ethProvider.request({ method: 'eth_requestAccounts' });
        await initContract();
      } else {
        alert('Vui lòng cài đặt MetaMask!');
      }
    } catch (error) {
      console.error('Lỗi khi kết nối wallet:', error);
      alert('Lỗi khi kết nối wallet!');
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} /> {/* Thêm route Homepage */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route
          path="/farmer"
          element={
            user && user.role === 'farmer' ? (
              <FarmerDashboard contract={contract} account={account} connectWallet={connectWallet} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/transporter"
          element={
            user && user.role === 'transporter' ? (
              <TransporterDashboard
                contract={contract}
                account={account}
                connectWallet={connectWallet}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/manager"
          element={
            user && user.role === 'manager' ? (
              <ManagerDashboard contract={contract} account={account} connectWallet={connectWallet} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin"
          element={
            user && user.role === 'admin' ? (
              <AdminDashboard contract={contract} account={account} connectWallet={connectWallet} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;