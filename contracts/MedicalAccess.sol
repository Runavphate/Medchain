// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MedicalAccess {
    mapping(address => mapping(address => bool)) public access;
    mapping(address => string[]) private records;

    // Pending access requests: patient => list of requesting doctors
    mapping(address => address[]) private pendingRequests;

    event RecordAdded(address patient, string cid);
    event AccessGranted(address patient, address doctor);
    event AccessRequested(address indexed patient, address indexed doctor);
    event AccessRevoked(address patient, address doctor);

    // ─── Patient ────────────────────────────────────────────────
    function addRecord(string memory cid) public {
        records[msg.sender].push(cid);
        emit RecordAdded(msg.sender, cid);
    }

    function grantAccess(address doctor) public {
        access[msg.sender][doctor] = true;
        emit AccessGranted(msg.sender, doctor);
        // Remove from pending requests if present
        _clearRequest(msg.sender, doctor);
    }

    function revokeAccess(address doctor) public {
        access[msg.sender][doctor] = false;
        emit AccessRevoked(msg.sender, doctor);
    }

    function clearRecords() public {
        delete records[msg.sender];
    }

    // Patient clears a pending request (after approve OR deny)
    function clearRequest(address doctor) public {
        _clearRequest(msg.sender, doctor);
    }

    // ─── Doctor ─────────────────────────────────────────────────
    // Doctor calls this to ask patient for access
    function requestAccess(address patient) public {
        // Avoid duplicates
        address[] storage reqs = pendingRequests[patient];
        for (uint i = 0; i < reqs.length; i++) {
            if (reqs[i] == msg.sender) return;
        }
        reqs.push(msg.sender);
        emit AccessRequested(patient, msg.sender);
    }

    function getRecords(address patient)
        public
        view
        returns (string[] memory)
    {
        require(access[patient][msg.sender], "Access denied");
        return records[patient];
    }

    // ─── View ────────────────────────────────────────────────────
    // Patient calls this to see who is requesting access
    function getPendingRequests() public view returns (address[] memory) {
        return pendingRequests[msg.sender];
    }

    // ─── Internal ────────────────────────────────────────────────
    function _clearRequest(address patient, address doctor) internal {
        address[] storage reqs = pendingRequests[patient];
        for (uint i = 0; i < reqs.length; i++) {
            if (reqs[i] == doctor) {
                reqs[i] = reqs[reqs.length - 1];
                reqs.pop();
                break;
            }
        }
    }
}
