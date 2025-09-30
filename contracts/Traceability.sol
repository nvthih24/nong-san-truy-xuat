// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Traceability {
    struct Product {
        string farm;
        string date;
    }

    mapping(string => Product) private products;

    function uploadTraceData(string memory productId, string memory farm, string memory date) public {
        products[productId] = Product(farm, date);
    }

    function getTraceData(string memory productId) public view returns (string memory farm, string memory date) {
        Product memory product = products[productId];
        return (product.farm, product.date);
    }
}