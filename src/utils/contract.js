import { BrowserProvider, Contract } from "ethers";

// ⚠️  Update CONTRACT_ADDRESS after redeploying on Remix
const CONTRACT_ADDRESS = "0xd0631498D79a2e260B9DEd099e518f594BB90e6f";

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

const getContract = async () => {
	const provider = new BrowserProvider(customProvider || window.ethereum);
	const signer = await provider.getSigner();
	return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
};

export const addRecord = async (cid) => {
	const contract = await getContract();
	const tx = await contract.addRecord(cid);
	await tx.wait();
};

export const grantAccess = async (doctor) => {
	const contract = await getContract();
	const tx = await contract.grantAccess(doctor);
	await tx.wait();
};

export const revokeAccess = async (doctor) => {
	const contract = await getContract();
	const tx = await contract.revokeAccess(doctor);
	await tx.wait();
};

export const getRecords = async (patient) => {
	const contract = await getContract();
	return await contract.getRecords(patient);
};

export const clearRecords = async () => {
	const contract = await getContract();
	const tx = await contract.clearRecords();
	await tx.wait();
};

// Doctor: send on-chain access request to a patient
export const requestAccessOnChain = async (patientAddress) => {
	const contract = await getContract();
	const tx = await contract.requestAccess(patientAddress);
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
	const tx = await contract.clearRequest(doctorAddress);
	await tx.wait();
};

// Read on-chain events for an account and return a unified audit log
export const getAuditLog = async (account) => {
	try {
		const provider = new (await import("ethers")).BrowserProvider(customProvider || window.ethereum);
		const contract = new (await import("ethers")).Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

		const normalize = (addr) => addr.toLowerCase();
		const acc = normalize(account);

		// Query each event type — look back last 10 000 blocks
		const fromBlock = -10000;
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