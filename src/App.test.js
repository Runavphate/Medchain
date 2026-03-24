import { render, screen } from '@testing-library/react';

// Mock window.ethereum as undefined (no wallet installed)
beforeAll(() => {
  Object.defineProperty(window, 'ethereum', {
    value: undefined,
    writable: true,
  });
});

// Mock WalletConnect to avoid ESM resolution issues in test
jest.mock('@walletconnect/ethereum-provider', () => ({
  __esModule: true,
  default: { init: jest.fn() },
}));

// Mock child components so they don't need blockchain context
jest.mock('./components/LoginPage', () => ({ connectWallet, connectWalletConnect }) => (
  <div>
    <h1>Welcome to MedChain</h1>
    <button onClick={connectWallet}>Connect MetaMask</button>
    <button onClick={connectWalletConnect}>Scan QR</button>
  </div>
));
jest.mock('./components/PatientDashboard', () => () => <div>Patient Dashboard</div>);
jest.mock('./components/DoctorDashboard', () => () => <div>Doctor Dashboard</div>);

import App from './App';

test('renders login page heading when no wallet is connected', () => {
  render(<App />);
  expect(screen.getByText('Welcome to MedChain')).toBeInTheDocument();
});

test('renders MetaMask connect button on login page', () => {
  render(<App />);
  expect(screen.getByText('Connect MetaMask')).toBeInTheDocument();
});
