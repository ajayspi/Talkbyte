import { LegalPageLayout } from '@/components/ui/LegalPageLayout';

export const metadata = { title: 'Terms of Service — TalkByte' };

export default function TermsPage() {
  return (
    <LegalPageLayout eyebrow="Legal" title="Terms of Service" updated="22 September 2026">
      <p>
        These terms govern your use of the TalkByte AI service (&ldquo;the Service&rdquo;). By creating an
        account or deploying the Service, you agree to them.
      </p>

      <h2>1. The Service</h2>
      <p>
        TalkByte provides conversational voice AI that answers, books, transacts and follows up on
        behalf of your business, with integrations to telephony, payments and business systems.
        Features depend on your subscription plan.
      </p>

      <h2>2. Accounts &amp; acceptable use</h2>
      <ul>
        <li>You are responsible for the lawfulness of call recording notifications and consent scripts you configure.</li>
        <li>You must not use the Service for unlawful, misleading or harassing communications, or to impersonate a human where disclosure is required.</li>
        <li>You are responsible for the accuracy of menus, pricing, policies and knowledge content the AI draws on.</li>
      </ul>

      <h2>3. Subscriptions &amp; billing</h2>
      <p>
        Plans are billed monthly or annually in advance via Stripe. Fees are non-refundable except
        as required by law or stated in a signed order form. We may change plan pricing with 30
        days&rsquo; notice.
      </p>

      <h2>4. AI accuracy &amp; human oversight</h2>
      <p>
        The Service is designed for high accuracy but is not infallible. You remain responsible for
        reviewing orders, bookings and payments it creates. The Service supports human hand-off and
        audit logging; you agree to configure and monitor them appropriate to your business.
      </p>

      <h2>5. Service levels</h2>
      <p>
        We target 99.9% monthly availability excluding scheduled maintenance and third-party
        telephony or cloud outages. SLA credits, where applicable, are defined in your order form.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        We own the Service and models. You own your content (scripts, menus, brand voice
        configurations) and the customer data generated through your use.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, TalkByte is not liable for indirect or consequential
        loss, including lost revenue from AI misinterpretation, telecommunication outages or
        third-party system downtime. Aggregate liability is capped at fees paid in the preceding 12
        months. Nothing limits liability that cannot be limited under Australian Consumer Law.
      </p>

      <h2>8. Termination</h2>
      <p>
        Either party may terminate for material breach with 30 days&rsquo; notice to remedy. On
        termination, your data is exported on request and deleted within 90 days.
      </p>

      <h2>9. Governing law</h2>
      <p>These terms are governed by the laws of Victoria, Australia.</p>
    </LegalPageLayout>
  );
}

