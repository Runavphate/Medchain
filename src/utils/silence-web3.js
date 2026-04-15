/**
 * Silence MetaMask "no longer injects web3" warning
 * 
 * [REVERTED] The dummy window.web3 assignment was interfering with 
 * library detection for Web3Modal and Ethers. This file is now empty 
 * to restore functionality.
 */
// window.web3 = window.web3 || {}; 
