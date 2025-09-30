import { useState } from "react";
import { ethers } from "ethers";
import { QRCodeCanvas } from "qrcode.react";
import contractABI from "./AgricultureTraceability.json";

// địa chỉ contract trên testnet
const contractAddress = "0x5aa575be81A5B9BB557f1A50D09118F3E7e7350b"; 

function App() {
  const [productId, setProductId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [batchInfo, setBatchInfo] = useState("");

  const getBatchInfo = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);

      // gọi hàm getBatchInfo với cả productId và batchId
      const info = await contract.getBatchInfo(productId, batchId);
      console.log("Batch info:", info);
      setBatchInfo({
        batchId: info[0],
        status: info[1],
        certification: info[2],
        harvestLocation: info[3],
        harvestDate: new Date(Number(info[4]) * 1000).toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
        }),
      });
    } catch (err) {
      console.error(err);
      alert("Error fetching batch info. Check console.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Truy xuất nguồn gốc nông sản 🌱</h2>

      <input
        type="text"
        placeholder="Nhập Product ID (VD: PROD003)"
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
        style={{ marginRight: "10px", padding: "5px" }}
      />
      <input
        type="text"
        placeholder="Nhập Batch ID (VD: BATCH-003)"
        value={batchId}
        onChange={(e) => setBatchId(e.target.value)}
        style={{ marginRight: "10px", padding: "5px" }}
      />
      <button onClick={getBatchInfo}>Lấy thông tin</button>

      {batchInfo && (
        <div style={{ marginTop: "20px" }}>
          <h3>Thông tin lô hàng:</h3>
          <p><b>Mã lô:</b> {batchInfo.batchId}</p>
          <p><b>Trạng thái:</b> {batchInfo.status}</p>
          <p><b>Chứng nhận:</b> {batchInfo.certification}</p>
          <p><b>Nơi thu hoạch:</b> {batchInfo.harvestLocation}</p>
          <p><b>Ngày thu hoạch:</b> {batchInfo.harvestDate}</p>

          <h3>Mã QR:</h3>
          <QRCodeCanvas value={JSON.stringify(batchInfo)} size={200} />
        </div>
      )}
    </div>
  );
}

export default App;
