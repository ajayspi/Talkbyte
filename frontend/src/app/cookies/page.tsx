import { LegalPageLayout } from '@/components/ui/LegalPageLayout';

export const metadata = { title: 'Cookie Policy — TalkByte' };

export default function CookiesPage() {
  return (
    <LegalPageLayout eyebrow="Legal" title="Cookie Policy" updated="22 September 2026">
      <p>
        This policy explains how TalkByte uses cookies and similar technologies on our website, and
        the choices you have.
      </p>

      <h2>1. What we use</h2>
      <ul>
        <li><strong className="text-white/80">Essential cookies</strong> — required for the site to function (session, security, load balancing). These cannot be switched off.</li>
        <li><strong className="text-white/80">Analytics cookies</strong> — optional; they help us understand which pages are useful. They are only set after you accept in the consent banner.</li>
      </ul>

      <h2>2. What we do not do</h2>
      <ul>
        <li>No advertising or cross-site tracking cookies.</li>
        <li>No selling or sharing of visitor data with data brokers.</li>
        <li>No fingerprinting or other covert tracking.</li>
      </ul>

      <h2>3. Managing your choice</h2>
      <p>
        You can accept or decline analytics cookies in the banner shown on your first visit, and you
        can clear or block cookies at any time in your browser settings. Declining analytics cookies
        does not affect any site functionality.
      </p>

      <h2>4. Third-party pages</h2>
      <p>
        Embedded content (for example, a hosted demo or booking widget) may set its own cookies once
        you interact with it. Those providers are listed in our <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>5. Questions</h2>
      <p>Contact us for a current list of the cookies in use on this site.</p>
    </LegalPageLayout>
  );
}
