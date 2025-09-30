import { ethers } from 'ethers';
import { CHAIN_ID, CHAIN_ID_HEX, RPC_URL, CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/constants';

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
  }

  async connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();

        // Kiểm tra chain hiện tại để tránh gọi add/switch lặp lại
        const { chainId } = await this.provider.getNetwork();
        if (Number(chainId) !== CHAIN_ID) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x13e2' }],  // '0x13e2' cho 5090
            });
          } catch (error) {
            if (error.code === 4902) {  // Network not found
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: CHAIN_ID_HEX,  // Sử dụng CHAIN_ID_HEX đã import
                  chainName: 'Pione Chain',
                  rpcUrls: [RPC_URL],
                  nativeCurrency: { name: 'PIO', symbol: 'PIO', decimals: 18 },  // Symbol PIO chính thức
                  blockExplorerUrls: ['https://pionescan.com'],
                }],
              });
            } else {
              throw error;
            }
          }
        }

        this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
        return { address: await this.signer.getAddress() };
      } catch (error) {
        throw new Error(`Lỗi kết nối ví: ${error.message}`);
      }
    } else {
      throw new Error('Cài MetaMask để kết nối!');
    }
  }

  async uploadTraceData(productId, originData) {
    if (!this.contract) throw new Error('Wallet not connected!');
    const tx = await this.contract.uploadTraceData(productId, originData.farm, originData.date);
    await tx.wait();
    return tx.hash;
  }

  async getTraceData(productId) {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(RPC_URL);
    }
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.provider);
    const [farm, date] = await contract.getTraceData(productId);
    return { farm, date };
  }
}

export default new BlockchainService();