import { LegalPageLayout } from '@/components/ui/LegalPageLayout';

export const metadata = { title: 'Privacy Policy — TalkByte' };

export default function PrivacyPage() {
  return (
    <LegalPageLayout eyebrow="Legal" title="Privacy Policy" updated="22 September 2026">
      <p>
        TalkByte AI (&ldquo;TalkByte&rdquo;, &ldquo;we&rdquo;) provides voice AI services to businesses. This
        policy explains what we collect, why, and the choices you have. It is written to comply with
        the Australian Privacy Act 1988 and the Australian Privacy Principles (APPs).
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><strong className="text-white/80">Caller data:</strong> phone numbers, call recordings and transcripts of conversations handled on behalf of our business customers.</li>
        <li><strong className="text-white/80">Customer accounts:</strong> business name, contact details, and configuration data (greetings, intents, integrations).</li>
        <li><strong className="text-white/80">Payment data:</strong> billing details processed by Stripe or Square. We never store raw card numbers.</li>
        <li><strong className="text-white/80">Usage data:</strong> dashboard activity, analytics events and device/browser metadata from our website.</li>
      </ul>

      <h2>2. How we use information</h2>
      <ul>
        <li>To answer calls, take bookings and orders, and process payments for our customers.</li>
        <li>To improve the accuracy and safety of our conversational AI models.</li>
        <li>To provide support, billing and service communications.</li>
        <li>To meet legal, regulatory and audit obligations.</li>
      </ul>
      <p>We do not sell personal information, and we do not use customer call recordings for advertising.</p>

      <h2>3. Call recording &amp; disclosure</h2>
      <p>
        Calls handled by TalkByte may be recorded and transcribed. Our business customers are
        responsible for providing legally required notifications to callers (such as
        &ldquo;this call may be recorded&rdquo;). Recordings are encrypted in transit and at rest, access is
        restricted to the account owner and TalkByte operations staff, and recordings are retained
        per the customer&rsquo;s configured retention window (default 90 days).
      </p>

      <h2>4. Sharing</h2>
      <p>
        We share data only with the processors needed to run the service: Supabase (database and
        auth), Deepgram (speech recognition), ElevenLabs (voice synthesis), LiveKit (real-time
        media), Stripe and Square (payments), and Telnyx (telephony). Each is bound by contractual
        confidentiality and security obligations. We may disclose information where required by law.
      </p>

      <h2>5. Data security</h2>
      <p>
        We apply tenant isolation, encryption in transit (TLS) and at rest, PII masking in
        transcripts, and full audit logging of agent decisions. Access is role-based and
        least-privilege.
      </p>

      <h2>6. Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of personal information we hold about
        you. Australian residents may also complain to the Office of the Australian Information
        Commissioner (OAIC). To make a request, contact us — we respond within 30 days.
      </p>

      <h2>7. Cookies</h2>
      <p>
        Our website uses only essential cookies plus optional analytics cookies that activate after
        consent. See our <a href="/cookies">Cookie Policy</a> for details.
      </p>

      <h2>8. Changes</h2>
      <p>
        We will post any changes here and update the date above. Material changes affecting customer
        data will be communicated directly.
      </p>
    </LegalPageLayout>
  );
}

