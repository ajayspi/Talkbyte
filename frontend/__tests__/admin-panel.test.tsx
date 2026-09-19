import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import OverviewView from '@/components/admin/OverviewView';
import LiveMonitorView from '@/components/admin/LiveMonitorView';
import RestaurantsView from '@/components/admin/RestaurantsView';
import UsersView from '@/components/admin/UsersView';
import RevenueView from '@/components/admin/RevenueView';
import BillingView from '@/components/admin/BillingView';
import InfraView from '@/components/admin/InfraView';
import AuditView from '@/components/admin/AuditView';
import AnalyticsView from '@/components/admin/AnalyticsView';

// Mock Recharts ResponsiveContainer to ensure stable dimensions in JSDOM
jest.mock('recharts', () => {
  const originalModule = jest.requireActual('recharts');
  return {
    ...originalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 800, height: 400 }}>
        {children}
      </div>
    ),
  };
});

describe('Admin Panel Component Suites', () => {
  describe('OverviewView', () => {
    it('renders platform overview KPI cards, warning alert, and tables', () => {
      render(<OverviewView />);

      // Warning alert
      expect(screen.getByText(/3 restaurants/i)).toBeInTheDocument();
      expect(screen.getByText(/payment links expiring unredeemed/i)).toBeInTheDocument();

      // High-level KPIs
      expect(screen.getByText('Active Restaurants')).toBeInTheDocument();
      expect(screen.getByText('487')).toBeInTheDocument();
      expect(screen.getByText('MRR')).toBeInTheDocument();
      expect(screen.getByText('$125.4K')).toBeInTheDocument();
      expect(screen.getByText('Calls Today')).toBeInTheDocument();
      expect(screen.getByText('2,847')).toBeInTheDocument();
      expect(screen.getByText('Churn Rate')).toBeInTheDocument();
      expect(screen.getByText('2.1%')).toBeInTheDocument();

      // Operational KPIs
      expect(screen.getByText('Order Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('74.2%')).toBeInTheDocument();
      expect(screen.getByText('Payment Conversion')).toBeInTheDocument();
      expect(screen.getByText('82.7%')).toBeInTheDocument();
      expect(screen.getByText('Avg E2E Latency')).toBeInTheDocument();
      expect(screen.getByText('387ms')).toBeInTheDocument();
      expect(screen.getByText('Escalation Rate')).toBeInTheDocument();
      expect(screen.getByText('11.4%')).toBeInTheDocument();

      // Chart & Table Headers
      expect(screen.getByText('Calls Per Hour — Today')).toBeInTheDocument();
      expect(screen.getByText('MRR Growth — 6 Months')).toBeInTheDocument();
      expect(screen.getByText('Top Restaurants by Orders Today')).toBeInTheDocument();
      expect(screen.getByText("Mama's Pizzeria")).toBeInTheDocument();
      expect(screen.getByText('At-Risk Restaurants')).toBeInTheDocument();
      expect(screen.getByText('Sakura Sushi')).toBeInTheDocument();
      expect(screen.getByText('The Greek Place')).toBeInTheDocument();
    });

    it('opens triage intervention modal when clicking action in At-Risk radar', () => {
      render(<OverviewView />);

      const contactBtn = screen.getByRole('button', { name: 'Contact' });
      fireEvent.click(contactBtn);

      expect(screen.getByText(/Triage Intervention: Sakura Sushi/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Execute Intervention' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByText(/Triage Intervention: Sakura Sushi/i)).not.toBeInTheDocument();
    });
  });

  describe('LiveMonitorView', () => {
    it('renders live call cards, status filters, and recent completed calls', () => {
      render(<LiveMonitorView />);

      // Header & Subheader
      expect(screen.getByText('Live Call Monitor')).toBeInTheDocument();
      expect(screen.getByText(/23 active calls across 487 restaurants/i)).toBeInTheDocument();

      // 5-KPI Strip
      expect(screen.getByText('Active Calls')).toBeInTheDocument();
      expect(screen.getByText('In Ordering')).toBeInTheDocument();
      expect(screen.getByText('Confirming')).toBeInTheDocument();
      expect(screen.getByText('Escalating')).toBeInTheDocument();
      expect(screen.getByText('Avg Call Duration')).toBeInTheDocument();

      // Active Call Cards
      expect(screen.getByText('Active Call Cards')).toBeInTheDocument();
      expect(screen.getAllByText("Mama's Pizzeria")[0]).toBeInTheDocument();
      expect(screen.getAllByText('Thai Express')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Burger Palace')[0]).toBeInTheDocument();
      expect(screen.getByText('Spaghetti Junction')).toBeInTheDocument();

      // Recent Completed Calls Table
      expect(screen.getByText('Recent Completed Calls')).toBeInTheDocument();
      expect(screen.getByText('19:38:22')).toBeInTheDocument();
    });

    it('opens live call inspector modal on card click', () => {
      render(<LiveMonitorView />);

      const mamasCard = screen.getAllByText("Mama's Pizzeria")[0];
      fireEvent.click(mamasCard);

      expect(screen.getByText(/Live Call Inspector: Mama's Pizzeria/i)).toBeInTheDocument();
      expect(screen.getByText('Deepgram TTFT')).toBeInTheDocument();
      expect(screen.getByText('ElevenLabs TTS')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Mute AI' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Transfer to Staff' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Terminate Call' })).toBeInTheDocument();
    });
  });

  describe('RestaurantsView', () => {
    it('renders fleet directory table, filter controls, and add button', () => {
      render(<RestaurantsView />);

      // Header & Search
      expect(screen.getByText(/Restaurant Fleet/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search restaurants/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Plans')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Status')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Restaurant/i })).toBeInTheDocument();

      // Table records
      expect(screen.getByText("Mama's Pizzeria")).toBeInTheDocument();
      expect(screen.getByText(/Carlton VIC/i)).toBeInTheDocument();
      expect(screen.getByText('Thai Express')).toBeInTheDocument();
      expect(screen.getByText(/Newtown NSW/i)).toBeInTheDocument();
      expect(screen.getByText('Burger Palace')).toBeInTheDocument();
    });

    it('filters restaurants when typing in search input', () => {
      render(<RestaurantsView />);

      const searchInput = screen.getByPlaceholderText(/Search restaurants/i);
      fireEvent.change(searchInput, { target: { value: 'Carlton' } });

      expect(screen.getByText("Mama's Pizzeria")).toBeInTheDocument();
      expect(screen.queryByText('Burger Palace')).not.toBeInTheDocument();
    });

    it('opens and closes Add Restaurant provisioning modal', () => {
      render(<RestaurantsView />);

      const addBtn = screen.getByRole('button', { name: /Add Restaurant/i });
      fireEvent.click(addBtn);

      expect(screen.getByText(/\+ Provision New Restaurant Tenant/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\. Bella Napoli Trattoria/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByText(/\+ Provision New Restaurant Tenant/i)).not.toBeInTheDocument();
    });
  });

  describe('UsersView', () => {
    it('renders user directory, RBAC summary cards, and role filters', () => {
      render(<UsersView />);

      // Overview Stat Cards
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Venue Owners')).toBeInTheDocument();
      expect(screen.getByText('Active Staff')).toBeInTheDocument();
      expect(screen.getByText('Readonly / Auditor')).toBeInTheDocument();

      // Header & Controls
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search users or venues/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Invite User/i })).toBeInTheDocument();

      // Table entries
      expect(screen.getByText('Marco Rossi')).toBeInTheDocument();
      expect(screen.getByText('marco@mamaspizzeria.com.au')).toBeInTheDocument();
      expect(screen.getByText('Somchai Prasert')).toBeInTheDocument();
      expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
    });

    it('filters users by search input', () => {
      render(<UsersView />);

      const searchInput = screen.getByPlaceholderText(/Search users or venues/i);
      fireEvent.change(searchInput, { target: { value: 'Somchai' } });

      expect(screen.getByText('Somchai Prasert')).toBeInTheDocument();
      expect(screen.queryByText('Marco Rossi')).not.toBeInTheDocument();
    });

    it('opens and submits Invite Tenant User modal', () => {
      render(<UsersView />);

      const inviteBtn = screen.getByRole('button', { name: /Invite User/i });
      fireEvent.click(inviteBtn);

      expect(screen.getByText('Invite Tenant User')).toBeInTheDocument();

      const nameInput = screen.getByPlaceholderText(/e\.g\. Alex Johnson/i);
      const emailInput = screen.getByPlaceholderText(/alex@restaurant\.com\.au/i);
      fireEvent.change(nameInput, { target: { value: 'Franco B.' } });
      fireEvent.change(emailInput, { target: { value: 'franco@mamaspizzeria.com.au' } });

      fireEvent.click(screen.getByRole('button', { name: 'Send Invitation Link' }));
      expect(screen.queryByText('Invite Tenant User')).not.toBeInTheDocument();
      expect(screen.getByText('Franco B.')).toBeInTheDocument();
    });
  });

  describe('RevenueView', () => {
    it('renders revenue KPIs, plan distribution, and unit economics COGS', () => {
      render(<RevenueView />);

      // Header
      expect(screen.getByText('Revenue & Financials')).toBeInTheDocument();

      // 4 Executive KPIs
      expect(screen.getByText('MRR')).toBeInTheDocument();
      expect(screen.getByText('$125.4K')).toBeInTheDocument();
      expect(screen.getByText('ARR')).toBeInTheDocument();
      expect(screen.getByText('$1.51M')).toBeInTheDocument();
      expect(screen.getByText('Avg Revenue / Restaurant')).toBeInTheDocument();
      expect(screen.getByText('$257')).toBeInTheDocument();
      expect(screen.getByText('LTV / Restaurant')).toBeInTheDocument();
      expect(screen.getByText('$5,940')).toBeInTheDocument();

      // Plan Distribution
      expect(screen.getByText('Plan Distribution')).toBeInTheDocument();
      expect(screen.getByText('Total MRR')).toBeInTheDocument();

      // Cost Breakdown (per minute)
      expect(screen.getByText('Cost Breakdown (per minute)')).toBeInTheDocument();
      expect(screen.getByText('Telnyx SIP (blended)')).toBeInTheDocument();
      expect(screen.getByText('Deepgram Flux STT')).toBeInTheDocument();
      expect(screen.getByText('GPT-4.1 LLM')).toBeInTheDocument();
      expect(screen.getByText('ElevenLabs TTS')).toBeInTheDocument();
      expect(screen.getByText('TOTAL COST')).toBeInTheDocument();
      expect(screen.getByText('$0.062/min')).toBeInTheDocument();
      expect(screen.getByText('Margin: 31%')).toBeInTheDocument();

      // Chart Header
      expect(screen.getByText('Monthly Revenue & Call Volume Trend')).toBeInTheDocument();
    });
  });

  describe('BillingView', () => {
    it('renders billing KPIs, subscription lifecycle, and invoice history', () => {
      render(<BillingView />);

      // Header
      expect(screen.getByText(/Billing & Stripe Subscriptions/i)).toBeInTheDocument();

      // 4 KPIs
      expect(screen.getByText('Active Subscriptions')).toBeInTheDocument();
      expect(screen.getByText('SaaS MRR')).toBeInTheDocument();
      expect(screen.getByText('Outstanding Balance')).toBeInTheDocument();
      expect(screen.getByText('Smart Retries')).toBeInTheDocument();

      // Warning Banner
      expect(screen.getAllByText(/Taco Loco/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/Stripe Smart Retry is active/i)).toBeInTheDocument();

      // Subscription Lifecycle Table
      expect(screen.getByText('Subscription Lifecycle')).toBeInTheDocument();
      expect(screen.getAllByText("Mama's Pizzeria")[0]).toBeInTheDocument();
      expect(screen.getAllByText('Thai Express')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Burger Palace')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Taco Loco')[0]).toBeInTheDocument();

      // Recent Invoices Table
      expect(screen.getByText('Recent Invoices')).toBeInTheDocument();
      expect(screen.getByText('INV-4821')).toBeInTheDocument();
      expect(screen.getByText('INV-4820')).toBeInTheDocument();
      expect(screen.getByText('INV-4819')).toBeInTheDocument();
    });

    it('triggers retry payment action on past-due subscription', () => {
      render(<BillingView />);

      const retryButtons = screen.getAllByRole('button', { name: /Retry/i });
      expect(retryButtons.length).toBeGreaterThan(0);
      fireEvent.click(retryButtons[0]);
    });
  });

  describe('InfraView', () => {
    it('renders infrastructure service cards and incident alert', () => {
      render(<InfraView />);

      // Header & Run Health Check Button
      expect(screen.getByText('Infrastructure Health')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Run Health Check/i })).toBeInTheDocument();

      // Deepgram Incident Banner
      expect(screen.getAllByText(/Deepgram Flux/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/elevated latency detected/i)).toBeInTheDocument();

      // 9 Services Cards
      expect(screen.getByText('📡 Telnyx SIP')).toBeInTheDocument();
      expect(screen.getByText('🔊 Deepgram Flux (STT)')).toBeInTheDocument();
      expect(screen.getByText('🧠 OpenAI GPT-4.1')).toBeInTheDocument();
      expect(screen.getByText('🗣️ ElevenLabs TTS')).toBeInTheDocument();
      expect(screen.getByText('💳 Stripe')).toBeInTheDocument();
      expect(screen.getByText('🗄️ Supabase (Postgres)')).toBeInTheDocument();
      expect(screen.getByText('⚡ Upstash Redis')).toBeInTheDocument();
      expect(screen.getByText('📦 Square POS API')).toBeInTheDocument();
      expect(screen.getByText('🎙️ LiveKit Voice Agent')).toBeInTheDocument();
    });
  });

  describe('AuditView', () => {
    it('renders audit ledger, category filters, and search bar', () => {
      render(<AuditView />);

      // Header & Controls
      expect(screen.getByText('Audit Log')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Filter events/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Events')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Last 24h')).toBeInTheDocument();
      expect(screen.getByTitle('Export CSV')).toBeInTheDocument();

      // Audit records
      expect(screen.getByText("Mama's Pizzeria")).toBeInTheDocument();
      expect(screen.getByText('Spaghetti Junction')).toBeInTheDocument();
      expect(screen.getByText('Thai Express')).toBeInTheDocument();
      expect(screen.getByText('Deepgram Flux')).toBeInTheDocument();
    });

    it('filters audit logs by query text', () => {
      render(<AuditView />);

      const filterInput = screen.getByPlaceholderText(/Filter events/i);
      fireEvent.change(filterInput, { target: { value: 'Spaghetti' } });

      expect(screen.getByText('Spaghetti Junction')).toBeInTheDocument();
      expect(screen.queryByText("Mama's Pizzeria")).not.toBeInTheDocument();
    });
  });

  describe('AnalyticsView', () => {
    it('renders platform analytics metrics, funnel breakdown, and cuisine benchmarks', () => {
      render(<AnalyticsView />);

      // Header & Select
      expect(screen.getByText('Platform Analytics')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Last 7 days')).toBeInTheDocument();

      // 4 KPIs
      expect(screen.getByText('Total Calls (7d)')).toBeInTheDocument();
      expect(screen.getAllByText('19,847')[0]).toBeInTheDocument();
      expect(screen.getByText('Orders Completed')).toBeInTheDocument();
      expect(screen.getAllByText('14,731')[0]).toBeInTheDocument();

      expect(screen.getByText('$441K')).toBeInTheDocument();
      expect(screen.getByText('Avg Order Value')).toBeInTheDocument();
      expect(screen.getByText('$43.20')).toBeInTheDocument();

      // Chart & Table Sections
      expect(screen.getByText('Daily Orders vs Calls — 7 days')).toBeInTheDocument();
      expect(screen.getByText('Completion Rate by Cuisine Type')).toBeInTheDocument();
      expect(screen.getByText('Top Abandonment Reasons')).toBeInTheDocument();
      expect(screen.getByText('Payment Conversion Funnel')).toBeInTheDocument();

      // Conversion Funnel Stages
      expect(screen.getByText('Calls received')).toBeInTheDocument();
      expect(screen.getByText('Orders confirmed')).toBeInTheDocument();
      expect(screen.getByText('SMS payment link sent')).toBeInTheDocument();
      expect(screen.getByText('Payment link opened')).toBeInTheDocument();
      expect(screen.getByText('Payment completed')).toBeInTheDocument();
      expect(screen.getByText('POS synced successfully')).toBeInTheDocument();
    });
  });
});
