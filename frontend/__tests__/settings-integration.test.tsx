import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsTab from '@/components/restaurant/SettingsTab';
import IntegrationConfigModal from '@/components/restaurant/IntegrationConfigModal';
import * as apiModule from '@/lib/api';

describe('Settings & Integrations Extended Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('IntegrationConfigModal Component', () => {
    it('renders Square POS fields correctly', () => {
      render(
        <IntegrationConfigModal
          isOpen={true}
          onClose={() => {}}
          provider="square"
        />
      );

      expect(screen.getByText(/Configure Square POS/i)).toBeInTheDocument();
      expect(screen.getByText('Square Location ID')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\. L9B4EXAMPLE/i)).toBeInTheDocument();
      expect(screen.getByText('Square Access Token')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save & Connect/i })).toBeInTheDocument();
    });

    it('renders Stripe Checkout fields correctly', () => {
      render(
        <IntegrationConfigModal
          isOpen={true}
          onClose={() => {}}
          provider="stripe"
        />
      );

      expect(screen.getByText(/Configure Stripe Checkout/i)).toBeInTheDocument();
      expect(screen.getByText('Publishable Key')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/pk_live_\.\.\. or pk_test_\.\.\./i)).toBeInTheDocument();
      expect(screen.getByText('Secret Key')).toBeInTheDocument();
    });

    it('renders Twilio SMS fields correctly', () => {
      render(
        <IntegrationConfigModal
          isOpen={true}
          onClose={() => {}}
          provider="twilio"
        />
      );

      expect(screen.getByText(/Configure Twilio SMS/i)).toBeInTheDocument();
      expect(screen.getByText('Account SID')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/i)).toBeInTheDocument();
      expect(screen.getByText('Auth Token')).toBeInTheDocument();
      expect(screen.getByText(/From Phone Number/i)).toBeInTheDocument();
    });

    it('renders Shopify POS fields correctly', () => {
      render(
        <IntegrationConfigModal
          isOpen={true}
          onClose={() => {}}
          provider="shopify"
        />
      );

      expect(screen.getByText(/Configure Shopify POS/i)).toBeInTheDocument();
      expect(screen.getByText('Shop Domain')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/your-store\.myshopify\.com/i)).toBeInTheDocument();
      expect(screen.getByText('Admin API Access Token')).toBeInTheDocument();
    });

    it('submits Square integration and triggers saveIntegration', async () => {
      const handleSuccess = jest.fn();
      const handleClose = jest.fn();
      const saveSpy = jest.spyOn(apiModule, 'saveIntegration').mockResolvedValue({
        status: 'success',
        provider: 'square',
        connected: true,
      });

      render(
        <IntegrationConfigModal
          isOpen={true}
          onClose={handleClose}
          provider="square"
          onSuccess={handleSuccess}
        />
      );

      const locInput = screen.getByPlaceholderText(/e\.g\. L9B4EXAMPLE/i);
      const tokenInput = screen.getByPlaceholderText(/sq0atp-xxxxxxxxxxxxxxxxxxxx/i);

      fireEvent.change(locInput, { target: { value: 'L_TEST_LOC' } });
      fireEvent.change(tokenInput, { target: { value: 'sq0atp-secret-token' } });

      const submitBtn = screen.getByRole('button', { name: /Save & Connect/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(saveSpy).toHaveBeenCalledWith(
        expect.any(String),
        'square',
        'sq0atp-secret-token',
        expect.objectContaining({ location_id: 'L_TEST_LOC' })
      );
      expect(handleSuccess).toHaveBeenCalledWith(
        'square',
        expect.objectContaining({ connected: true })
      );
    });
  });

  describe('SettingsTab AI Greeting Script Generation', () => {
    it('triggers AI greeting generation and updates script textarea', async () => {
      const generateGreetingSpy = jest
        .spyOn(apiModule, 'generateGreetingScript')
        .mockResolvedValue({
          status: 'success',
          greeting: "G'day! Welcome to Mama's Pizzeria. Aria here. How can I take your order?",
          script: "G'day! Welcome to Mama's Pizzeria. Aria here. How can I take your order?",
          provider: 'openai',
        });

      render(<SettingsTab />);

      const generateBtn = screen.getByText(/Generate with AI/i);
      expect(generateBtn).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(generateBtn);
      });

      expect(generateGreetingSpy).toHaveBeenCalled();
      expect(
        screen.getByDisplayValue(
          "G'day! Welcome to Mama's Pizzeria. Aria here. How can I take your order?"
        )
      ).toBeInTheDocument();
    });

    it('handles AI greeting generation error gracefully with fallback', async () => {
      jest
        .spyOn(apiModule, 'generateGreetingScript')
        .mockRejectedValue(new Error('Network error'));

      render(<SettingsTab />);

      const generateBtn = screen.getByText(/Generate with AI/i);
      await act(async () => {
        fireEvent.click(generateBtn);
      });

      // Does not crash, sets template fallback
      expect(screen.getByDisplayValue(/Hi, welcome to/i)).toBeInTheDocument();
    });
  });

  describe('SettingsTab Integrations Interaction', () => {
    it('opens integration modal when clicking Configure', async () => {
      render(<SettingsTab />);

      const configureButtons = screen.getAllByRole('button', { name: 'Configure' });
      expect(configureButtons.length).toBeGreaterThan(0);

      act(() => {
        fireEvent.click(configureButtons[0]);
      });

      // Modal opens
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save & Connect/i })).toBeInTheDocument();
    });
  });
});
