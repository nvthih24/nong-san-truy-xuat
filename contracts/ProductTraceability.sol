// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ProductTraceability is Ownable {
    struct TraceInfo {
        string farmName;      // Tên nông trại
        uint256 harvestDate;  // Ngày thu hoạch (timestamp)
        string transportInfo; // Info vận chuyển
        string certification; // Chứng nhận
        bool isActive;        // Trạng thái
    }

    mapping(uint256 => TraceInfo) public productTraces;  // ID -> TraceInfo
    uint256 public nextProductId = 1;                    // Auto-increment ID

    event ProductAdded(uint256 indexed productId, string farmName, uint256 harvestDate);
    event TraceUpdated(uint256 indexed productId, string transportInfo, string certification);

    // Constructor gọi Ownable với initialOwner
    constructor(address initialOwner) Ownable(initialOwner) {
    }

    // Thêm sản phẩm mới (chỉ owner hoặc authorized)
    function addProduct(string memory _farmName, uint256 _harvestDate) external onlyOwner returns (uint256) {
        uint256 productId = nextProductId++;
        productTraces[productId] = TraceInfo({
            farmName: _farmName,
            harvestDate: _harvestDate,
            transportInfo: "",
            certification: "",
            isActive: true
        });
        emit ProductAdded(productId, _farmName, _harvestDate);
        return productId;
    }

    // Cập nhật trace (vận chuyển/chứng nhận)
    function updateTrace(uint256 _productId, string memory _transportInfo, string memory _certification) external onlyOwner {
        require(productTraces[_productId].isActive, "Product not active");
        productTraces[_productId].transportInfo = _transportInfo;
        productTraces[_productId].certification = _certification;
        emit TraceUpdated(_productId, _transportInfo, _certification);
    }

    // Truy xuất nguồn gốc theo ID
    function getTrace(uint256 _productId) external view returns (TraceInfo memory) {
        return productTraces[_productId];
    }

    // Deactivate product (nếu cần)
    function deactivateProduct(uint256 _productId) external onlyOwner {
        productTraces[_productId].isActive = false;
    }
}