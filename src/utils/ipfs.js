import axios from "axios";
import CryptoJS from "crypto-js";

// 🔴 Replace with your Pinata keys
const PINATA_API_KEY = "ed576a669d69ebb372fc";
const PINATA_SECRET_KEY = "ecbac87bc5185a28e9c4b341a64fc3e312f5108f491bb08e78aac4c503f61bfa";

export const uploadEncryptedFile = async (file) => {
  if (!file) throw new Error("No file selected");

  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        // Encrypt file - use base64 for binary-safe encoding
        const base64String = btoa(
          new Uint8Array(reader.result).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );

        const encrypted = CryptoJS.AES.encrypt(
          base64String,
          "medical-secret-key"
        ).toString();

        const blob = new Blob([encrypted]);
        const formData = new FormData();
        formData.append("file", blob);

        console.log("Uploading file:", file.name);
        const res = await axios.post(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              pinata_api_key: PINATA_API_KEY,
              pinata_secret_api_key: PINATA_SECRET_KEY,
            },
          }
        );

        if (!res.data.IpfsHash) throw new Error("No IPFS hash returned");
        console.log("Upload successful, CID:", res.data.IpfsHash);
        resolve(res.data.IpfsHash);
      } catch (err) {
        console.error("Upload error:", err.message);
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error("File read error"));
    };

    reader.readAsArrayBuffer(file);
  });
};

export const decryptAndViewFile = async (cid) => {
  try {
    console.log("Fetching encrypted file from IPFS:", cid);
    const res = await axios.get(
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      { responseType: "text" }
    );

    // Decrypt the file
    const decrypted = CryptoJS.AES.decrypt(res.data, "medical-secret-key").toString(
      CryptoJS.enc.Utf8
    );

    console.log("File decrypted successfully");
    
    // Convert base64 back to binary
    const binaryString = atob(decrypted);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
  } catch (err) {
    console.error("Decryption error:", err);
    throw new Error("Failed to decrypt file: " + err.message);
  }
};