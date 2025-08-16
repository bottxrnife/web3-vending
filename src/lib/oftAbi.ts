export const oftComposerAbi = [
  {
    "type": "function",
    "name": "sendOFT",
    "stateMutability": "payable",
    "inputs": [
      { "name": "token", "type": "address" },
      { "name": "dstChainId", "type": "uint32" },
      { "name": "to", "type": "bytes32" },
      { "name": "amount", "type": "uint256" },
      { "name": "options", "type": "bytes" }
    ],
    "outputs": []
  }
] as const; 