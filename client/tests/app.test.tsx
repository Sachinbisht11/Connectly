import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';
import { AuthProvider } from '../src/features/auth/AuthContext';

describe('App', () => {
  it('renders the Connectly app shell', () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );
    expect(screen.getByText(/Connectly/i)).toBeInTheDocument();
  });
});
