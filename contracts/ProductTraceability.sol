// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract ProductTraceability is AccessControl {
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    bytes32 public constant TRANSPORTER_ROLE = keccak256("TRANSPORTER_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    struct TraceInfo {
        string productName;          // Tên sản phẩm
        string productId;           // Mã sản phẩm (string)
        string farmName;            // Tên nông trại
        uint256 plantingDate;       // Ngày gieo trồng
        string plantingImageUrl;    // URL ảnh ngày gieo trồng
        uint256 harvestDate;        // Ngày thu hoạch
        string harvestImageUrl;     // URL ảnh ngày thu hoạch
        string transporterName;     // Tên đơn vị vận chuyển
        uint256 receiveDate;        // Ngày nhận hàng (transporter)
        string receiveImageUrl;     // URL ảnh ngày nhận hàng
        uint256 deliveryDate;       // Ngày giao hàng thành công
        string deliveryImageUrl;    // URL ảnh ngày giao hàng
        string transportInfo;       // Thông tin vận chuyển
        uint256 managerReceiveDate; // Ngày nhận hàng (manager)
        string managerReceiveImageUrl; // URL ảnh ngày nhận hàng (manager)
        uint256 price;              // Giá cả
        bool isActive;              // Trạng thái
    }

    mapping(string => TraceInfo) public productTraces; // productId (string) -> TraceInfo
    mapping(uint256 => string) public indexToProductId; // index -> productId
    uint256 public nextProductId = 1; // Auto-increment index

    event ProductAdded(
        string indexed productId,
        string productName,
        string farmName,
        uint256 plantingDate,
        string plantingImageUrl,
        uint256 harvestDate,
        string harvestImageUrl
    );
    event TraceUpdated(
        string indexed productId,
        string transporterName,
        uint256 receiveDate,
        string receiveImageUrl,
        uint256 deliveryDate,
        string deliveryImageUrl,
        string transportInfo
    );
    event ManagerInfoUpdated(
        string indexed productId,
        uint256 managerReceiveDate,
        string managerReceiveImageUrl,
        uint256 price
    );

    constructor(address initialOwner) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(FARMER_ROLE, initialOwner);
        _grantRole(TRANSPORTER_ROLE, initialOwner);
        _grantRole(MANAGER_ROLE, initialOwner);
    }

    // Thêm sản phẩm mới (chỉ farmer)
    function addProduct(
        string memory _productName,
        string memory _productId,
        string memory _farmName,
        uint256 _plantingDate,
        string memory _plantingImageUrl,
        uint256 _harvestDate,
        string memory _harvestImageUrl
    ) external onlyRole(FARMER_ROLE) returns (string memory) {
        require(bytes(productTraces[_productId].productId).length == 0, "Product ID exists");
        productTraces[_productId] = TraceInfo({
            productName: _productName,
            productId: _productId,
            farmName: _farmName,
            plantingDate: _plantingDate,
            plantingImageUrl: _plantingImageUrl,
            harvestDate: _harvestDate,
            harvestImageUrl: _harvestImageUrl,
            transporterName: "",
            receiveDate: 0,
            receiveImageUrl: "",
            deliveryDate: 0,
            deliveryImageUrl: "",
            transportInfo: "",
            managerReceiveDate: 0,
            managerReceiveImageUrl: "",
            price: 0,
            isActive: true
        });
        indexToProductId[nextProductId] = _productId;
        nextProductId++;
        emit ProductAdded(_productId, _productName, _farmName, _plantingDate, _plantingImageUrl, _harvestDate, _harvestImageUrl);
        return _productId;
    }

    // Cập nhật thông tin vận chuyển (chỉ transporter)
    function updateTrace(
        string memory _productId,
        string memory _transporterName,
        uint256 _receiveDate,
        string memory _receiveImageUrl,
        uint256 _deliveryDate,
        string memory _deliveryImageUrl,
        string memory _transportInfo
    ) external onlyRole(TRANSPORTER_ROLE) {
        require(bytes(productTraces[_productId].productId).length != 0, "Product not found");
        require(productTraces[_productId].isActive, "Product not active");
        TraceInfo storage trace = productTraces[_productId];
        trace.transporterName = _transporterName;
        trace.receiveDate = _receiveDate;
        trace.receiveImageUrl = _receiveImageUrl;
        trace.deliveryDate = _deliveryDate;
        trace.deliveryImageUrl = _deliveryImageUrl;
        trace.transportInfo = _transportInfo;
        emit TraceUpdated(_productId, _transporterName, _receiveDate, _receiveImageUrl, _deliveryDate, _deliveryImageUrl, _transportInfo);
    }

    // Cập nhật thông tin quản lý (chỉ manager)
    function updateManagerInfo(
        string memory _productId,
        uint256 _managerReceiveDate,
        string memory _managerReceiveImageUrl,
        uint256 _price
    ) external onlyRole(MANAGER_ROLE) {
        require(bytes(productTraces[_productId].productId).length != 0, "Product not found");
        require(productTraces[_productId].isActive, "Product not active");
        TraceInfo storage trace = productTraces[_productId];
        trace.managerReceiveDate = _managerReceiveDate;
        trace.managerReceiveImageUrl = _managerReceiveImageUrl;
        trace.price = _price;
        emit ManagerInfoUpdated(_productId, _managerReceiveDate, _managerReceiveImageUrl, _price);
    }

    // Truy xuất nguồn gốc theo productId (công khai)
    function getTrace(string memory _productId) external view returns (TraceInfo memory) {
        require(bytes(productTraces[_productId].productId).length != 0, "Product not found");
        return productTraces[_productId];
    }

    // Deactivate product (chỉ admin)
    function deactivateProduct(string memory _productId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(productTraces[_productId].productId).length != 0, "Product not found");
        productTraces[_productId].isActive = false;
    }
}