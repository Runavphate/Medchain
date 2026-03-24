import { render, screen, fireEvent } from '@testing-library/react';

// Mock utility modules — no blockchain / IPFS calls in unit tests
jest.mock('../utils/contract', () => ({
    addRecord: jest.fn(),
    grantAccess: jest.fn(),
    revokeAccess: jest.fn(),
    getRecords: jest.fn(() => Promise.resolve([])),
    getPendingRequests: jest.fn(() => Promise.resolve([])),
    clearRequest: jest.fn(),
}));
jest.mock('../utils/ipfs', () => ({
    uploadEncryptedFile: jest.fn(),
    decryptAndViewFile: jest.fn(),
}));

import PatientDashboard from './PatientDashboard';

const MOCK_ACCOUNT = '0xabcDEF1234567890abcdef1234567890ABCDEF12';

test('renders Patient Dashboard heading', () => {
    render(<PatientDashboard account={MOCK_ACCOUNT} />);
    expect(screen.getByText('Patient Dashboard')).toBeInTheDocument();
});

test('shows Your Details card to enter name when no name saved', () => {
    // Clear any stored name
    localStorage.removeItem(`patientName_${MOCK_ACCOUNT}`);
    render(<PatientDashboard account={MOCK_ACCOUNT} />);
    expect(screen.getByText('👤 Your Details')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
});

test('shows inline error for invalid grant-access address without calling contract', () => {
    const { grantAccess } = require('../utils/contract');
    render(<PatientDashboard account={MOCK_ACCOUNT} />);

    const input = screen.getByPlaceholderText('Doctor wallet address (0x…)');
    fireEvent.change(input, { target: { value: 'not-an-address' } });

    const grantBtn = screen.getByText('Grant Access');
    fireEvent.click(grantBtn);

    expect(screen.getByText(/Invalid Ethereum address/i)).toBeInTheDocument();
    expect(grantAccess).not.toHaveBeenCalled();
});
