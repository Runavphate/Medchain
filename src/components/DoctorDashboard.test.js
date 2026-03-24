import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('../utils/contract', () => ({
    getRecords: jest.fn(() => Promise.resolve([])),
    requestAccessOnChain: jest.fn(),
}));
jest.mock('../utils/ipfs', () => ({
    decryptAndViewFile: jest.fn(),
}));

import DoctorDashboard from './DoctorDashboard';

const MOCK_ACCOUNT = '0xabcDEF1234567890abcdef1234567890ABCDEF12';

test('renders Doctor Dashboard heading', () => {
    render(<DoctorDashboard account={MOCK_ACCOUNT} />);
    expect(screen.getByText('Doctor Dashboard')).toBeInTheDocument();
});

test('Request Access and View Records buttons are disabled when patient address is empty', () => {
    render(<DoctorDashboard account={MOCK_ACCOUNT} />);
    expect(screen.getByRole('button', { name: /Request Access/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /View Records/i })).toBeDisabled();
});

test('shows inline error for invalid patient address when clicking View Records', () => {
    const { getRecords } = require('../utils/contract');
    render(<DoctorDashboard account={MOCK_ACCOUNT} />);

    const input = screen.getByPlaceholderText('Patient wallet address (0x…)');
    fireEvent.change(input, { target: { value: 'bad-address' } });

    const viewBtn = screen.getByRole('button', { name: /View Records/i });
    fireEvent.click(viewBtn);

    expect(screen.getByText(/Invalid Ethereum address/i)).toBeInTheDocument();
    expect(getRecords).not.toHaveBeenCalled();
});
