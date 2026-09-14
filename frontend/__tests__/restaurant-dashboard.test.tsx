import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardTab from '@/components/restaurant/DashboardTab';
import LiveCallsTab from '@/components/restaurant/LiveCallsTab';
import OrdersTab from '@/components/restaurant/OrdersTab';
import MenuTab from '@/components/restaurant/MenuTab';
import AnalyticsTab from '@/components/restaurant/AnalyticsTab';
import BillingTab from '@/components/restaurant/BillingTab';
import SettingsTab from '@/components/restaurant/SettingsTab';

describe('Restaurant Dashboard Component Suites', () => {
  describe('DashboardTab', () => {
    it('renders KPI cards, onboarding banner, and active call section', () => {
      const handleNavigate = jest.fn();
      render(<DashboardTab onNavigateTab={handleNavigate} />);

      // Onboarding banner & Warning alert
      expect(screen.getByText(/Setup almost done/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Connect POS →/i })).toBeInTheDocument();
      expect(screen.getByText(/payment links expired without payment/i)).toBeInTheDocument();

      // Top 4 KPI labels & values
      expect(screen.getByText('Calls Today')).toBeInTheDocument();
      expect(screen.getByText('47')).toBeInTheDocument();
      expect(screen.getByText('Revenue Today')).toBeInTheDocument();
      expect(screen.getByText('$1,284')).toBeInTheDocument();
      expect(screen.getByText('AI Answer Rate')).toBeInTheDocument();
      expect(screen.getByText('96%')).toBeInTheDocument();
      expect(screen.getByText('Customer Satisfaction')).toBeInTheDocument();
      expect(screen.getByText('4.7')).toBeInTheDocument();

      // Card titles
      expect(screen.getByText('Active Calls')).toBeInTheDocument();
      expect(screen.getByText('Recent Orders')).toBeInTheDocument();
      expect(screen.getByText('Calls Today (by hour)')).toBeInTheDocument();
      expect(screen.getByText('Customer Sentiment — Last 7 Days')).toBeInTheDocument();

      // Active Call details
      expect(screen.getByText('+61 4•• ••• 847')).toBeInTheDocument();
      expect(screen.getByText(/Inbound · Ordering/i)).toBeInTheDocument();
      expect(screen.getByText(/Can I get a large margherita/i)).toBeInTheDocument();
      expect(screen.getByText('1 active · 0 queued')).toBeInTheDocument();

      // Recent Orders items
      expect(screen.getByText('#1047')).toBeInTheDocument();
      expect(screen.getByText('#1046')).toBeInTheDocument();
      expect(screen.getByText('#1045')).toBeInTheDocument();
      expect(screen.getByText('#1044')).toBeInTheDocument();
    });

    it('allows taking over and monitoring an active call', () => {
      const handleNavigate = jest.fn();
      render(<DashboardTab onNavigateTab={handleNavigate} />);

      const takeOverBtn = screen.getByRole('button', { name: 'Take Over' });
      expect(takeOverBtn).toBeInTheDocument();
      fireEvent.click(takeOverBtn);
      expect(screen.getByText('Staff Speaking ✓')).toBeInTheDocument();

      const monitorBtn = screen.getByRole('button', { name: 'Monitor' });
      expect(monitorBtn).toBeInTheDocument();
      fireEvent.click(monitorBtn);
      expect(screen.getByText('Monitoring 🎧')).toBeInTheDocument();
    });

    it('handles navigation callbacks when clicking CTAs', () => {
      const handleNavigate = jest.fn();
      render(<DashboardTab onNavigateTab={handleNavigate} />);

      fireEvent.click(screen.getByRole('button', { name: /Connect POS →/i }));
      expect(handleNavigate).toHaveBeenCalledWith('settings');

      fireEvent.click(screen.getByText('Review orders'));
      expect(handleNavigate).toHaveBeenCalledWith('orders');
    });
  });

  describe('LiveCallsTab', () => {
    it('renders live active call monitors and historical logs', () => {
      render(<LiveCallsTab />);

      // KPI strip
      expect(screen.getByText('Active Now')).toBeInTheDocument();
      expect(screen.getByText('Calls Today')).toBeInTheDocument();
      expect(screen.getByText('Avg Duration')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();

      // Active Calls section
      expect(screen.getByText('Active Calls')).toBeInTheDocument();
      expect(screen.getByText(/Live \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\+61 4•• ••• 847/i)).toBeInTheDocument();
      expect(screen.getByText(/\+61 2•• ••• 312/i)).toBeInTheDocument();

      // Recent Calls table
      expect(screen.getByText('Recent Calls — Today')).toBeInTheDocument();
      expect(screen.getByText('+61 4•• ••• 211')).toBeInTheDocument();
      expect(screen.getByText('+61 3•• ••• 564')).toBeInTheDocument();
      expect(screen.getByText('Order Placed')).toBeInTheDocument();
    });

    it('interacts with live call controls (takeover, monitor, end call)', () => {
      render(<LiveCallsTab />);

      // Take over call 1
      const takeOverButtons = screen.getAllByRole('button', { name: /Take Over Call/i });
      expect(takeOverButtons.length).toBeGreaterThanOrEqual(2);
      fireEvent.click(takeOverButtons[0]);

      expect(screen.getByText('Staff Intercept Active')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Release to AI/i })).toBeInTheDocument();

      // End call 1
      const endCallButtons = screen.getAllByRole('button', { name: /End Call/i });
      fireEvent.click(endCallButtons[0]);
      expect(screen.getByText(/Call #TB-847 was ended by staff\./i)).toBeInTheDocument();
    });
  });

  describe('OrdersTab', () => {
    it('renders orders pipeline, KPI stats, and orders table', () => {
      render(<OrdersTab />);

      // KPI Cards
      expect(screen.getByText("Today's Revenue")).toBeInTheDocument();
      expect(screen.getByText('Orders Today')).toBeInTheDocument();
      expect(screen.getByText('Avg Order Value')).toBeInTheDocument();
      expect(screen.getByText('POS Sync Rate')).toBeInTheDocument();

      // Main Card Header & Search
      expect(screen.getByText('All Orders — Today')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search orders...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();

      // Table orders
      expect(screen.getByText('#1047')).toBeInTheDocument();
      expect(screen.getByText('#1046')).toBeInTheDocument();
      expect(screen.getByText('#1045')).toBeInTheDocument();
      expect(screen.getByText('#1044')).toBeInTheDocument();
    });

    it('filters orders by search input and status dropdown', () => {
      render(<OrdersTab />);

      // Search filtering
      const searchInput = screen.getByPlaceholderText('Search orders...');
      fireEvent.change(searchInput, { target: { value: '#1047' } });
      expect(screen.getByText('#1047')).toBeInTheDocument();
      expect(screen.queryByText('#1046')).not.toBeInTheDocument();

      // Reset search
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('#1046')).toBeInTheDocument();

      // Filter dropdown
      const statusSelect = screen.getByRole('combobox');
      fireEvent.change(statusSelect, { target: { value: 'Expired' } });
      expect(screen.getByText('#1044')).toBeInTheDocument();
      expect(screen.queryByText('#1047')).not.toBeInTheDocument();
    });

    it('opens and closes order details modal', () => {
      render(<OrdersTab />);

      const viewButton = screen.getAllByRole('button', { name: 'View' })[0];
      fireEvent.click(viewButton);

      expect(screen.getByText(/Order Details #1047/i)).toBeInTheDocument();
      expect(screen.getByText(/Stripe Payment Link/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByText(/Order Details #1047/i)).not.toBeInTheDocument();
    });
  });

  describe('MenuTab', () => {
    it('renders menu items and category filters', () => {
      const setOpenModal = jest.fn();
      render(<MenuTab isAddItemModalOpen={false} setIsAddItemModalOpen={setOpenModal} />);

      // Title & Sync status
      expect(screen.getByText('Menu Management')).toBeInTheDocument();
      expect(screen.getByText('Changes go live to AI agent within 30 seconds')).toBeInTheDocument();
      expect(screen.getByText('✓ Menu synced to AI agent 4 minutes ago')).toBeInTheDocument();

      // Category filters
      expect(screen.getByText(/All Items/i)).toBeInTheDocument();
      expect(screen.getByText(/🍕 Pizzas/i)).toBeInTheDocument();
      expect(screen.getByText(/🥗 Sides/i)).toBeInTheDocument();

      // Menu items
      expect(screen.getByText('Margherita')).toBeInTheDocument();
      expect(screen.getByText('Pepperoni Supreme')).toBeInTheDocument();
      expect(screen.getByText('Quattro Formaggi')).toBeInTheDocument();
      expect(screen.getByText('Garlic Bread')).toBeInTheDocument();
    });

    it('filters menu items by category pill', () => {
      render(<MenuTab />);

      fireEvent.click(screen.getByText(/🥤 Drinks/i));
      expect(screen.getByText('San Pellegrino Sparkling')).toBeInTheDocument();
      expect(screen.queryByText('Margherita')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText(/All Items/i));
      expect(screen.getByText('Margherita')).toBeInTheDocument();
    });

    it('opens Add Menu Item modal', () => {
      render(<MenuTab />);

      const addButtons = screen.getAllByText(/Add (New )?Item/i);
      fireEvent.click(addButtons[0]);

      expect(screen.getByText('Add Menu Item')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\. Prosciutto & Fig/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByText('Add Menu Item')).not.toBeInTheDocument();
    });
  });

  describe('AnalyticsTab', () => {
    it('renders analytics metrics and timeframe selector', () => {
      render(<AnalyticsTab />);

      // Timeframe buttons
      expect(screen.getByRole('button', { name: '7 Days' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '30 Days' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();

      // 4 KPI cards
      expect(screen.getByText('Total Calls')).toBeInTheDocument();
      expect(screen.getByText('312')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('$8,420')).toBeInTheDocument();
      expect(screen.getByText('Order Conversion')).toBeInTheDocument();
      expect(screen.getByText('82%')).toBeInTheDocument();
      expect(screen.getByText('Avg Handle Time')).toBeInTheDocument();
      expect(screen.getByText('2:18')).toBeInTheDocument();

      // Chart & section titles
      expect(screen.getByText('Call Volume — Last 7 Days')).toBeInTheDocument();
      expect(screen.getByText('Revenue — Last 7 Days')).toBeInTheDocument();
      expect(screen.getByText('Peak Hours Heatmap')).toBeInTheDocument();
      expect(screen.getByText('Top Ordered Items')).toBeInTheDocument();

      // Top ordered dishes
      expect(screen.getByText('🍕 Margherita L')).toBeInTheDocument();
      expect(screen.getByText('🍕 Pepperoni XL')).toBeInTheDocument();
      expect(screen.getByText('🍞 Garlic Bread')).toBeInTheDocument();
    });

    it('toggles timeframe buttons correctly', () => {
      render(<AnalyticsTab />);

      const btn30 = screen.getByRole('button', { name: '30 Days' });
      fireEvent.click(btn30);
      expect(btn30.className).toContain('btn-primary');
    });
  });

  describe('BillingTab', () => {
    it('renders subscription tiers and monthly usage progress bars', () => {
      render(<BillingTab />);

      // Next billing alert
      expect(screen.getByText(/Next billing date: 1 October 2026/i)).toBeInTheDocument();

      // Plans
      expect(screen.getByText('Starter')).toBeInTheDocument();
      expect(screen.getByText('Growth')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
      expect(screen.getByText('$149')).toBeInTheDocument();
      expect(screen.getByText('$249')).toBeInTheDocument();
      expect(screen.getByText('$499')).toBeInTheDocument();
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
      expect(screen.getByText('Active Plan')).toBeInTheDocument();

      // Monthly Usage
      expect(screen.getByText(/Usage This Month/i)).toBeInTheDocument();
      expect(screen.getByText('Calls Handled')).toBeInTheDocument();
      expect(screen.getByText('1,481')).toBeInTheDocument();
      expect(screen.getByText('AI Conversation Minutes')).toBeInTheDocument();
      expect(screen.getByText('4,183')).toBeInTheDocument();
      expect(screen.getByText('SMS & WhatsApp Messages')).toBeInTheDocument();

      // Billing History
      expect(screen.getByText(/Billing & Invoice History/i)).toBeInTheDocument();
      expect(screen.getByText('Sep 2026')).toBeInTheDocument();
      expect(screen.getByText('Aug 2026')).toBeInTheDocument();
      expect(screen.getByText('Jul 2026')).toBeInTheDocument();
    });

    it('opens and confirms plan switch modal', () => {
      render(<BillingTab />);

      const switchBtn = screen.getByRole('button', { name: /Upgrade to Starter|Switch to Starter/i });
      fireEvent.click(switchBtn);

      expect(screen.getByText('Confirm Subscription Change')).toBeInTheDocument();
      expect(screen.getByText(/Starter includes up to 500 inbound calls/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Proceed to Stripe Checkout|Confirm/i }));
      expect(screen.queryByText('Confirm Subscription Change')).not.toBeInTheDocument();
    });
  });

  describe('SettingsTab', () => {
    it('renders restaurant profile, POS integration badges, and voice settings', () => {
      render(<SettingsTab />);

      // Business details
      expect(screen.getByText('Business Details')).toBeInTheDocument();
      expect(screen.getByDisplayValue("Mama's Pizzeria")).toBeInTheDocument();
      expect(screen.getByDisplayValue("+61 2 9999 1234")).toBeInTheDocument();
      expect(screen.getByText('Holiday Closure Mode')).toBeInTheDocument();

      // Integrations
      expect(screen.getByText('Integrations')).toBeInTheDocument();
      expect(screen.getByText('Square POS')).toBeInTheDocument();
      expect(screen.getByText('Stripe Checkout')).toBeInTheDocument();
      expect(screen.getByText('Twilio SMS')).toBeInTheDocument();
      expect(screen.getByText('Shopify POS')).toBeInTheDocument();

      // AI Voice Settings
      expect(screen.getByText('AI Voice Settings')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Aria')).toBeInTheDocument();
      expect(screen.getByText('Allow Manual Takeover')).toBeInTheDocument();
      expect(screen.getByText('Transfer on Low Confidence')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save Voice Configuration' })).toBeInTheDocument();

      // Staff Access
      expect(screen.getByText('Staff Access')).toBeInTheDocument();
      expect(screen.getByText('John Rossi')).toBeInTheDocument();
      expect(screen.getByText('Sarah M.')).toBeInTheDocument();
    });

    it('opens and submits invite staff modal', () => {
      render(<SettingsTab />);

      const inviteBtn = screen.getByRole('button', { name: 'Invite' });
      fireEvent.click(inviteBtn);

      expect(screen.getByText('Invite Staff Member')).toBeInTheDocument();

      const nameInput = screen.getByPlaceholderText(/e\.g\. Marco Rossi/i);
      const emailInput = screen.getByPlaceholderText(/e\.g\. marco@mamaspizzeria\.com\.au/i);
      fireEvent.change(nameInput, { target: { value: 'Luigi V.' } });
      fireEvent.change(emailInput, { target: { value: 'luigi@mamaspizzeria.com.au' } });

      fireEvent.click(screen.getByRole('button', { name: 'Send Invite Token' }));
      expect(screen.queryByText('Invite Staff Member')).not.toBeInTheDocument();
      expect(screen.getByText('Luigi V.')).toBeInTheDocument();
    });
  });
});
