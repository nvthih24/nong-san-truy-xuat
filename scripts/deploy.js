const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners(); // Lấy signer đầu tiên (deployer)
  console.log("Deploying contracts with the account:", deployer.address);

  const ProductTraceability = await hre.ethers.getContractFactory("ProductTraceability");
  const contract = await ProductTraceability.deploy(deployer.address); // Truyền deployer.address vào constructor

  await contract.waitForDeployment();
  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});