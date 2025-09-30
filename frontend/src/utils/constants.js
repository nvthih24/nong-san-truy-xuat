export const CHAIN_ID = 5090;
export const CHAIN_ID_HEX = '0x13e2';  // Hex của 5090
export const RPC_URL = 'https://rpc.pionescan.com';
export const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '0x7106755B33312203e76D214E234d5c23960254Fd';
export const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "productId", "type": "string" },
      { "internalType": "string", "name": "farm", "type": "string" },
      { "internalType": "string", "name": "date", "type": "string" }
    ],
    "name": "uploadTraceData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "productId", "type": "string" }
    ],
    "name": "getTraceData",
    "outputs": [
      { "internalType": "string", "name": "farm", "type": "string" },
      { "internalType": "string", "name": "date", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];