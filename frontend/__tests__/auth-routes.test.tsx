import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthLayout from '@/app/(auth)/layout';
import LoginPage from '@/app/(auth)/login/page';
import SignupPage from '@/app/(auth)/signup/page';
import AdminLoginPage from '@/app/(auth)/admin/login/page';
import AdminSignupPage from '@/app/(auth)/admin/signup/page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
}));

const mockSignInWithPassword = jest.fn().mockResolvedValue({ data: {}, error: null });
const mockSignUp = jest.fn().mockResolvedValue({ data: {}, error: null });

jest.mock('@/lib/supabase-browser', () => ({
  createBrowserClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
    },
  }),
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
    },
  }),
}));

describe('Auth Route Pages & Layout Test Suites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthLayout', () => {
    it('renders children within centered responsive container', () => {
      render(
        <AuthLayout>
          <div data-testid="test-child">Child Content</div>
        </AuthLayout>
      );
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });
  });

  describe('LoginPage (/login)', () => {
    it('renders email, password inputs, submit button, and brand headers', () => {
      render(<LoginPage />);

      expect(screen.getByText(/Restaurant portal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

      // Check navigation links
      expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup');
      expect(screen.getByRole('link', { name: /sign in here/i })).toHaveAttribute('href', '/admin/login');
    });

    it('handles input changes and submits credentials with redirect to /dashboard', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitBtn = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'owner@mamas.com' } });
      fireEvent.change(passwordInput, { target: { value: 'SuperSecret123' } });

      expect(emailInput).toHaveValue('owner@mamas.com');
      expect(passwordInput).toHaveValue('SuperSecret123');

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: 'owner@mamas.com',
          password: 'SuperSecret123',
        });
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('displays error message and prevents redirect when authentication fails', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: {},
        error: { message: 'Invalid credentials provided' },
      });

      render(<LoginPage />);
      const submitBtn = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials provided')).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it('handles unhandled exceptions gracefully by setting fallback error', async () => {
      mockSignInWithPassword.mockRejectedValueOnce(new Error('Network connection error'));

      render(<LoginPage />);
      const submitBtn = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Network connection error')).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe('SignupPage (/signup)', () => {
    it('renders restaurant name, email, password inputs, and submit button', () => {
      render(<SignupPage />);

      expect(screen.getByText(/Create your restaurant voice AI account/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/restaurant name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/owner email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create restaurant account/i })).toBeInTheDocument();

      // Check navigation link
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
    });

    it('handles input changes and registers venue with redirect to /dashboard', async () => {
      render(<SignupPage />);

      const nameInput = screen.getByLabelText(/restaurant name/i);
      const emailInput = screen.getByLabelText(/owner email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitBtn = screen.getByRole('button', { name: /create restaurant account/i });

      fireEvent.change(nameInput, { target: { value: "Luigi's Trattoria" } });
      fireEvent.change(emailInput, { target: { value: 'luigi@trattoria.com' } });
      fireEvent.change(passwordInput, { target: { value: 'LuigiPassword88' } });

      expect(nameInput).toHaveValue("Luigi's Trattoria");
      expect(emailInput).toHaveValue('luigi@trattoria.com');
      expect(passwordInput).toHaveValue('LuigiPassword88');

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'luigi@trattoria.com',
          password: 'LuigiPassword88',
          options: {
            data: {
              restaurant_name: "Luigi's Trattoria",
            },
          },
        });
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('displays error message and prevents redirect when signup fails', async () => {
      mockSignUp.mockResolvedValueOnce({
        data: {},
        error: { message: 'Email already registered' },
      });

      render(<SignupPage />);
      const submitBtn = screen.getByRole('button', { name: /create restaurant account/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Email already registered')).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe('AdminLoginPage (/admin/login)', () => {
    it('renders operator email, password inputs, submit button, and restricted banner', () => {
      render(<AdminLoginPage />);

      expect(screen.getByText(/Operator Admin Panel/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/operator email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in as admin/i })).toBeInTheDocument();

      // Check navigation links
      expect(screen.getByRole('link', { name: /request operator credentials/i })).toHaveAttribute('href', '/admin/signup');
      expect(screen.getByRole('link', { name: /return to restaurant portal/i })).toHaveAttribute('href', '/login');
    });

    it('handles operator login credentials and redirects to /admin', async () => {
      render(<AdminLoginPage />);

      const emailInput = screen.getByLabelText(/operator email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitBtn = screen.getByRole('button', { name: /sign in as admin/i });

      fireEvent.change(emailInput, { target: { value: 'operator@talkbyte.io' } });
      fireEvent.change(passwordInput, { target: { value: 'AdminAccess2026!' } });

      expect(emailInput).toHaveValue('operator@talkbyte.io');
      expect(passwordInput).toHaveValue('AdminAccess2026!');

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: 'operator@talkbyte.io',
          password: 'AdminAccess2026!',
        });
        expect(mockPush).toHaveBeenCalledWith('/admin');
      });
    });

    it('displays error message and prevents redirect on admin login failure', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: {},
        error: { message: 'Unauthorized operator account' },
      });

      render(<AdminLoginPage />);
      const submitBtn = screen.getByRole('button', { name: /sign in as admin/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Unauthorized operator account')).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe('AdminSignupPage (/admin/signup)', () => {
    it('renders operator name, corporate email, password, invite code inputs', () => {
      render(<AdminSignupPage />);

      expect(screen.getByText(/Operator Account Registration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/operator name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/corporate email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/invite code/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /register operator account/i })).toBeInTheDocument();

      // Check navigation link
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/admin/login');
    });

    it('handles operator registration and redirects to /admin', async () => {
      render(<AdminSignupPage />);

      const nameInput = screen.getByLabelText(/operator name/i);
      const emailInput = screen.getByLabelText(/corporate email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const inviteCodeInput = screen.getByLabelText(/invite code/i);
      const submitBtn = screen.getByRole('button', { name: /register operator account/i });

      fireEvent.change(nameInput, { target: { value: 'Alex Mercer' } });
      fireEvent.change(emailInput, { target: { value: 'alex@talkbyte.io' } });
      fireEvent.change(passwordInput, { target: { value: 'OperatorSecret99' } });
      fireEvent.change(inviteCodeInput, { target: { value: 'TB-OP-9988' } });

      expect(nameInput).toHaveValue('Alex Mercer');
      expect(emailInput).toHaveValue('alex@talkbyte.io');
      expect(passwordInput).toHaveValue('OperatorSecret99');
      expect(inviteCodeInput).toHaveValue('TB-OP-9988');

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'alex@talkbyte.io',
          password: 'OperatorSecret99',
          options: {
            data: {
              full_name: 'Alex Mercer',
              role: 'operator_admin',
              invite_code: 'TB-OP-9988',
            },
          },
        });
        expect(mockPush).toHaveBeenCalledWith('/admin');
      });
    });

    it('displays error message and prevents redirect on invalid invite code', async () => {
      mockSignUp.mockResolvedValueOnce({
        data: {},
        error: { message: 'Invalid corporate invite code' },
      });

      render(<AdminSignupPage />);
      const submitBtn = screen.getByRole('button', { name: /register operator account/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Invalid corporate invite code')).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });
});
