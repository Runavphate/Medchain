import { BrowserProvider, Contract } from "ethers";

// ⚠️  Update CONTRACT_ADDRESS after redeploying on Remix
const CONTRACT_ADDRESS = "0xd0631498D79a2e260B9DEd099e518f594BB90e6f"; // Placeholder - update after deployment

const EXPECTED_CHAIN_ID = 11155111; // Sepolia

const CONTRACT_ABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "patient",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "doctor",
				"type": "address"
			}
		],
		"name": "AccessGranted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "patient",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "doctor",
				"type": "address"
			}
		],
		"name": "AccessRequested",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "patient",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "doctor",
				"type": "address"
			}
		],
		"name": "AccessRevoked",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "cid",
				"type": "string"
			}
		],
		"name": "addRecord",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "clearRecords",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "doctor",
				"type": "address"
			}
		],
		"name": "clearRequest",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "doctor",
				"type": "address"
			}
		],
		"name": "grantAccess",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "patient",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "cid",
				"type": "string"
			}
		],
		"name": "RecordAdded",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "patient",
				"type": "address"
			}
		],
		"name": "requestAccess",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "doctor",
				"type": "address"
			}
		],
		"name": "revokeAccess",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "access",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getPendingRequests",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "patient",
				"type": "address"
			}
		],
		"name": "getRecords",
		"outputs": [
			{
				"internalType": "string[]",
				"name": "",
				"type": "string[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

let customProvider = null;

export const setGlobalProvider = (provider) => {
	customProvider = provider;
};

const validateSepolia = async (provider) => {
	let retries = 0;
	const maxRetries = 3;
	
	while (retries < maxRetries) {
		try {
			const network = await provider.getNetwork();
			const chainId = Number(network.chainId);
			if (chainId !== EXPECTED_CHAIN_ID) {
				throw new Error(`Please switch your wallet to the Sepolia Testnet (chainId ${EXPECTED_CHAIN_ID}). Current chainId: ${chainId}`);
			}
			return; // Success
		} catch (error) {
			if (error.message.includes('could not fetch chain id') || error.message.includes('429') || error.message.includes('network')) {
				retries++;
				if (retries >= maxRetries) {
					throw new Error('Network connection failed. Ensure MetaMask is on Sepolia network. Get ETH: https://sepoliafaucet.com');
				}
				await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
			} else {
				throw error;
			}
		}
	}
};

const validateContractDeployment = () => {
	if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
		throw new Error("Contract not deployed yet. Please deploy the MedicalAccess contract on Sepolia first.");
	}
};

const getContract = async () => {
	const provider = new BrowserProvider(customProvider || (typeof window !== "undefined" ? window.ethereum : null));
	await validateSepolia(provider);
	validateContractDeployment();
	const signer = await provider.getSigner();
	return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
};

export const addRecord = async (cid) => {
	const contract = await getContract();
	const tx = await contract.addRecord(cid, { gasLimit: 150000 });
	await tx.wait();
};

export const grantAccess = async (doctor) => {
	const contract = await getContract();
	const tx = await contract.grantAccess(doctor, { gasLimit: 100000 });
	await tx.wait();
};

export const revokeAccess = async (doctor) => {
	const contract = await getContract();
	const tx = await contract.revokeAccess(doctor, { gasLimit: 100000 });
	await tx.wait();
};

export const getRecords = async (patient) => {
	const contract = await getContract();
	return await contract.getRecords(patient);
};

export const clearRecords = async () => {
	const contract = await getContract();
	const tx = await contract.clearRecords({ gasLimit: 100000 });
	await tx.wait();
};

// Doctor: send on-chain access request to a patient
export const requestAccessOnChain = async (patientAddress) => {
	const contract = await getContract();
	const tx = await contract.requestAccess(patientAddress, { gasLimit: 100000 });
	await tx.wait();
};

// Patient: read pending doctor requests from the blockchain
export const getPendingRequests = async () => {
	const contract = await getContract();
	return await contract.getPendingRequests(); // returns address[]
};

// Patient: clear a specific doctor's request after approve/deny
export const clearRequest = async (doctorAddress) => {
	const contract = await getContract();
	const tx = await contract.clearRequest(doctorAddress, { gasLimit: 100000 });
	await tx.wait();
};

// Read on-chain events for an account and return a unified audit log
export const getAuditLog = async (account) => {
	try {
		const provider = new BrowserProvider(customProvider || (typeof window !== "undefined" ? window.ethereum : null));
		const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

		const normalize = (addr) => addr.toLowerCase();
		const acc = normalize(account);

		// Query each event type — look back last 10 000 blocks
		const latestBlock = await provider.getBlockNumber();
		const fromBlock = Math.max(0, latestBlock - 10000);
		const [added, granted, revoked, requested] = await Promise.all([
			contract.queryFilter(contract.filters.RecordAdded(), fromBlock),
			contract.queryFilter(contract.filters.AccessGranted(), fromBlock),
			contract.queryFilter(contract.filters.AccessRevoked(), fromBlock),
			contract.queryFilter(contract.filters.AccessRequested(), fromBlock),
		]);

		const events = [
			...added
				.filter(e => normalize(e.args.patient) === acc)
				.map(e => ({ type: "RecordAdded", label: "📄 Record uploaded", detail: e.args.cid?.slice(0, 12) + "…", block: e.blockNumber })),
			...granted
				.filter(e => normalize(e.args.patient) === acc || normalize(e.args.doctor) === acc)
				.map(e => ({
					type: "AccessGranted",
					label: normalize(e.args.patient) === acc ? `✅ Access granted to ${e.args.doctor.slice(0, 8)}…` : `✅ You gained access from patient ${e.args.patient.slice(0, 8)}…`,
					block: e.blockNumber,
				})),
			...revoked
				.filter(e => normalize(e.args.patient) === acc || normalize(e.args.doctor) === acc)
				.map(e => ({
					type: "AccessRevoked",
					label: normalize(e.args.patient) === acc ? `🚫 Access revoked from ${e.args.doctor.slice(0, 8)}…` : `🚫 Your access was revoked by ${e.args.patient.slice(0, 8)}…`,
					block: e.blockNumber,
				})),
			...requested
				.filter(e => normalize(e.args.patient) === acc || normalize(e.args.doctor) === acc)
				.map(e => ({
					type: "AccessRequested",
					label: normalize(e.args.doctor) === acc ? `🔔 You requested access from ${e.args.patient.slice(0, 8)}…` : `🔔 ${e.args.doctor.slice(0, 8)}… requested access`,
					block: e.blockNumber,
				})),
		];

		return events.sort((a, b) => b.block - a.block).slice(0, 30);
	} catch (err) {
		console.error("getAuditLog error:", err);
		return [];
	}
};