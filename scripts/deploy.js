const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const abi = [ /* Paste ABI from Traceability.sol */ ];
  const bytecode = '0x7106755B33312203e76D214E234d5c23960254Fd'; // Get from Remix/Hardhat
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  console.log('Contract deployed at:', contract.target);
}

main().catch((error) => console.error(error));