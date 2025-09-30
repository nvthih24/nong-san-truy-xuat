import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';  // Thêm CSS nếu cần\
import CONTRACT_ABI from './abi.json';
import detectEthereumProvider from '@metamask/detect-provider';

// ABI của contract (copy từ artifacts sau compile: npx hardhat compile)
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
  const [productId, setProductId] = useState<number>(0);
  const [traceInfo, setTraceInfo] = useState<any>(null);
  const [farmName, setFarmName] = useState<string>('');
  const [harvestDate, setHarvestDate] = useState<number>(Date.now() / 1000);
  const [transportInfo, setTransportInfo] = useState<string>('');
  const [certification, setCertification] = useState<string>('');

  useEffect(() => {
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
      const sign = await prov.getSigner(accounts[0]); // cần await
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

  const addProduct = async () => {
    if (!contract || !farmName || !harvestDate) return;
    try {
      const tx = await contract.addProduct(farmName, Math.floor(harvestDate));
      await tx.wait();
      console.log("Tx Hash:", tx.hash);
      alert('Sản phẩm thêm thành công!');
      setFarmName('');
      setHarvestDate(Date.now() / 1000);
    } catch (error) {
      console.error(error);
      alert('Lỗi khi thêm sản phẩm!');
    }
  };

  const updateTrace = async () => {
    if (!contract || !productId || !transportInfo || !certification) return;
    try {
      const tx = await contract.updateTrace(productId, transportInfo, certification);
      await tx.wait();
      alert('Cập nhật trace thành công!');
      setTransportInfo('');
      setCertification('');
    } catch (error) {
      console.error(error);
      alert('Lỗi khi cập nhật trace!');
    }
  };

  const getTrace = async () => {
    if (!contract || !productId) return;
    try {
      const info = await contract.getTrace(productId);
      setTraceInfo(info);
    } catch (error) {
      console.error(error);
      alert('Lỗi khi truy xuất trace!');
    }
  };

  return (
    <div className="App">
      <h1>dApp Truy Xuất Nguồn Gốc Nông Sản - Pione Zero Chain</h1>
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <p>Connected: {account}</p>
      )}

      {/* Form thêm sản phẩm */}
      <section>
        <h2>Thêm Sản Phẩm Mới</h2>
        <input
          type="text"
          placeholder="Tên nông trại"
          value={farmName}
          onChange={(e) => setFarmName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Ngày thu hoạch (timestamp)"
          value={harvestDate}
          onChange={(e) => setHarvestDate(Number(e.target.value))}
        />
        <button onClick={addProduct}>Thêm</button>
      </section>

      {/* Form cập nhật trace */}
      <section>
        <h2>Cập Nhật Trace</h2>
        <input
          type="number"
          placeholder="Product ID"
          value={productId}
          onChange={(e) => setProductId(Number(e.target.value))}
        />
        <input
          type="text"
          placeholder="Info vận chuyển"
          value={transportInfo}
          onChange={(e) => setTransportInfo(e.target.value)}
        />
        <input
          type="text"
          placeholder="Chứng nhận"
          value={certification}
          onChange={(e) => setCertification(e.target.value)}
        />
        <button onClick={updateTrace}>Cập Nhật</button>
      </section>

      {/* Truy xuất */}
      <section>
        <h2>Truy Xuất Nguồn Gốc</h2>
        <input
          type="number"
          placeholder="Product ID"
          value={productId}
          onChange={(e) => setProductId(Number(e.target.value))}
        />
        <button onClick={getTrace}>Tìm Kiếm</button>
        {traceInfo && (
          <div>
            <p>Farm: {traceInfo.farmName}</p>
            <p>Harvest Date: {new Date(Number(traceInfo.harvestDate) * 1000).toLocaleString()}</p>
            <p>Transport: {traceInfo.transportInfo}</p>
            <p>Certification: {traceInfo.certification}</p>
            <p>Active: {traceInfo.isActive ? 'Yes' : 'No'}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default App;