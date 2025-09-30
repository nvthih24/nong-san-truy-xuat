import { ethers } from "ethers";
import CounterArtifact from "../artifacts/contracts/Counter.sol/Counter.json";

async function main() {
  // Provider kết nối node local của Hardhat
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // Lấy danh sách account từ node local
  const accounts = await provider.listAccounts();
  console.log("Accounts:", accounts);

  // signer = account đầu tiên
  const signer = await provider.getSigner(0);

  // Địa chỉ contract sau khi bạn deploy Counter
  const contractAddress = "0x7106755B33312203e76D214E234d5c23960254Fd";  // ⚠️ thay bằng địa chỉ deploy thực tế

  // Lấy ABI từ Counter.json
  const abi = CounterArtifact.abi;

  // Tạo contract instance
  const counter = new ethers.Contract(contractAddress, abi, signer);

  // Gọi thử các hàm trong Counter
  const current = await counter.getCount();
  console.log("Current count:", current.toString());

  console.log("Sending tx to increment...");
  const tx = await counter.increment();
  await tx.wait();

  const updated = await counter.getCount();
  console.log("Updated count:", updated.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
