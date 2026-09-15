import re
import os

base_dir = r"c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989"
html_path = os.path.join(base_dir, ".claude", "talkbyte-homepage.html")
globals_path = os.path.join(base_dir, "frontend", "src", "app", "globals.css")
page_path = os.path.join(base_dir, "frontend", "src", "app", "page.tsx")

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

style_match = re.search(r"<style>(.*?)</style>", html, re.DOTALL)
if style_match:
    style = style_match.group(1)
    with open(globals_path, "a", encoding="utf-8") as f:
        f.write("\n/* NEUMORPHIC STYLES FROM HTML */\n" + style)

# Extract body contents minus scripts and cursors
# We can just write a specific page.tsx
page_tsx_content = """import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import ParticlesBackground from '@/components/marketing/ParticlesBackground';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <ParticlesBackground />
      <main className="relative z-10 min-h-screen">
        <section className="hero">
          <div className="hero-left">
            <div className="hero-eyebrow"><span className="eyebrow-dot"></span>AI Phone Ordering</div>
            <h1 className="hero-h1">
              <span className="line"><span>Every Call.</span></span>
              <span className="line"><span>Every Order.</span></span>
              <span className="line"><span className="grad-text">Answered.</span></span>
            </h1>
            <div className="hero-typer" id="typer">Answering for Sakura Ramen...</div>
            <p className="hero-sub">TalkByte's voice AI answers your restaurant's phone, takes orders naturally, syncs with Square, and never sleeps — even at 2am on a Friday night.</p>
            <div className="hero-btns flex gap-4 mt-6">
              <Link href="/dashboard" className="btn-glow" style={{padding:'14px 32px', fontSize:'14px'}}>
                Restaurant Portal
              </Link>
              <Link href="/admin" className="btn-neu" style={{padding:'14px 24px', fontSize:'14px', color:'var(--muted)'}}>
                Operator Panel
              </Link>
            </div>
          </div>

          <div className="hero-right">
            <div className="logo-orb">
              <div className="orb-ring orb-ring-1"></div>
              <div className="orb-ring orb-ring-2"></div>
              <div className="orb-ring orb-ring-3"></div>
              <div className="orb-planet planet-1" style={{top:'calc(50% - 20px)', left:'calc(50% - 20px)'}}>🟦</div>
              <div className="orb-planet planet-2" style={{top:'calc(50% - 16px)', left:'calc(50% - 16px)'}}>💳</div>
              <div className="orb-planet planet-3" style={{top:'calc(50% - 16px)', left:'calc(50% - 16px)'}}>📱</div>
              <div className="orb-inner">
                <div className="orb-emoji">🎙️</div>
                <div className="orb-wave">
                  <div className="ow-bar"></div><div className="ow-bar"></div><div className="ow-bar"></div>
                  <div className="ow-bar"></div><div className="ow-bar"></div><div className="ow-bar"></div>
                  <div className="ow-bar"></div><div className="ow-bar"></div>
                </div>
                <div className="orb-label">AI Active</div>
              </div>
            </div>
          </div>
        </section>

        {/* TICKER */}
        <div className="ticker">
          <div className="ticker-scroll" id="ticker">
            <span className="t-item"><strong>487</strong> Restaurants <span className="t-sep">·</span></span>
            <span className="t-item"><strong>99.4%</strong> Accuracy <span className="t-sep">·</span></span>
            <span className="t-item"><strong>487ms</strong> Latency <span className="t-sep">·</span></span>
            <span className="t-item"><strong>$0</strong> Missed Revenue <span className="t-sep">·</span></span>
            <span className="t-item"><strong>24/7</strong> Always On <span className="t-sep">·</span></span>
            <span className="t-item"><strong>2.4s</strong> Response <span className="t-sep">·</span></span>
            <span className="t-item"><strong>487</strong> Restaurants <span className="t-sep">·</span></span>
            <span className="t-item"><strong>99.4%</strong> Accuracy <span className="t-sep">·</span></span>
            <span className="t-item"><strong>487ms</strong> Latency <span className="t-sep">·</span></span>
            <span className="t-item"><strong>$0</strong> Missed Revenue <span className="t-sep">·</span></span>
            <span className="t-item"><strong>24/7</strong> Always On <span className="t-sep">·</span></span>
            <span className="t-item"><strong>2.4s</strong> Response <span className="t-sep">·</span></span>
          </div>
        </div>

        {/* FEATURES */}
        <section className="section" id="features">
          <div className="reveal in">
            <div className="sec-label">The Stack</div>
            <div className="sec-title">Built for Australian kitchens</div>
            <div className="sec-sub">Six reasons 487 restaurants trust TalkByte to answer their phones.</div>
          </div>
          <div className="bento">
            <div className="bcard s3 reveal in">
              <span className="bc-icon">🎙️</span>
              <div className="bc-title">Natural Voice AI</div>
              <div className="bc-desc">Deepgram STT + GPT-4.1 + ElevenLabs TTS. Understands accents, specials, and Australian slang. Sounds genuinely human.</div>
              <div className="bc-stat">487ms</div>
              <div className="bc-stat-label">end-to-end latency</div>
            </div>
            <div className="bcard s3 reveal in">
              <span className="bc-icon">🟦</span>
              <div className="bc-title">Square POS Sync</div>
              <div className="bc-desc">Orders appear in Square the moment they're confirmed. Menu prices and availability sync automatically. Zero double-entry.</div>
              <div className="bc-stat">Live</div>
              <div className="bc-stat-label">two-way sync</div>
            </div>
            <div className="bcard s2 reveal in">
              <span className="bc-icon">📞</span>
              <div className="bc-title">Never Miss a Call</div>
              <div className="bc-desc">Peak hours, holidays, 2am cravings — handled without extra staff.</div>
            </div>
            <div className="bcard s2 reveal in">
              <span className="bc-icon">💳</span>
              <div className="bc-title">Phone Payments</div>
              <div className="bc-desc">Stripe-powered card payments over the phone. PCI-compliant, instant settlement.</div>
            </div>
            <div className="bcard s2 reveal in">
              <span className="bc-icon">📊</span>
              <div className="bc-title">Live Dashboard</div>
              <div className="bc-desc">Real-time call monitoring, revenue tracking, sentiment analysis.</div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="section" id="how">
          <div className="reveal in">
            <div className="sec-label">The Call Journey</div>
            <div className="sec-title">Ring to receipt in 487ms</div>
          </div>
          <div className="how-row reveal in">
            <div className="how-step">
              <div className="how-circle">📱</div>
              <div className="how-title">Phone Rings</div>
              <div className="how-desc">Customer calls your Telnyx number</div>
              <div className="how-tech">Telnyx</div>
            </div>
            <div className="how-step">
              <div className="how-circle">🎙️</div>
              <div className="how-title">AI Greets</div>
              <div className="how-desc">LiveKit agent picks up, speaks naturally</div>
              <div className="how-tech">LiveKit + ElevenLabs</div>
            </div>
            <div className="how-step">
              <div className="how-circle">🧠</div>
              <div className="how-title">Order Taken</div>
              <div className="how-desc">GPT-4.1 handles items, mods, upsells</div>
              <div className="how-tech">Deepgram + GPT-4.1</div>
            </div>
            <div className="how-step">
              <div className="how-circle">📩</div>
              <div className="how-title">SMS Sent</div>
              <div className="how-desc">Confirmation to customer instantly</div>
              <div className="how-tech">Telnyx SMS</div>
            </div>
            <div className="how-step">
              <div className="how-circle">🟦</div>
              <div className="how-title">POS Synced</div>
              <div className="how-desc">Order fires to Square. Kitchen prints.</div>
              <div className="how-tech">Square + Stripe</div>
            </div>
          </div>
        </section>

        {/* DEMO / CALL */}
        <section className="demo-section" id="demo">
          <div className="reveal in">
            <div className="sec-label">Live Demo</div>
            <div className="sec-title">Hear a real call</div>
            <div className="sec-sub">Your AI sounds exactly like this — trained on thousands of Australian restaurant calls.</div>
          </div>
          <div className="demo-inner mt-12">
            <div className="phone-wrap reveal in">
              <div className="ph-status"><span>9:41</span><span>●●●</span></div>
              <div className="ph-caller">
                <div className="ph-badge"><span style={{width:'5px',height:'5px',borderRadius:'50%',background:'var(--green)',display:'inline-block',marginRight:'5px'}}></span>Active Call</div>
                <div className="ph-num">+61 2 8941 ···</div>
                <div className="ph-dur" id="ph-timer">02:14</div>
              </div>
              <div className="ph-orb">
                <div className="ph-wave-sm">
                  <div className="pw-bar"></div><div className="pw-bar"></div><div className="pw-bar"></div>
                  <div className="pw-bar"></div><div className="pw-bar"></div>
                </div>
              </div>
              <div className="ph-transcript">
                <div className="t-ai">Hi! Welcome to Mama's Pizzeria. What can I get you?</div>
                <div className="t-cu">Large Margherita and garlic bread please.</div>
                <div className="t-ai">One large Margherita, garlic bread! Anything else?</div>
                <div className="t-cu">A Coke as well.</div>
                <div className="t-ai">$32.50 total. Confirming your order now!</div>
              </div>
              <div className="ph-actions">
                <div className="ph-btn ph-btn-mic">🎤</div>
                <div className="ph-btn ph-btn-end">📵</div>
              </div>
            </div>

            <div className="demo-stats reveal in">
              <div className="stat-card">
                <div className="stat-num" id="s-calls">47</div>
                <div><div className="stat-label">Calls Today</div><div className="stat-sub">↑ 8 from 7-day avg</div></div>
              </div>
              <div className="stat-card">
                <div className="stat-num" style={{color:'var(--violet)'}}>94%</div>
                <div><div className="stat-label">Order Success Rate</div><div className="stat-sub">↑ 2pp this week</div></div>
              </div>
              <div className="stat-card">
                <div className="stat-num" style={{color:'var(--pink)'}}>$4,820</div>
                <div><div className="stat-label">Revenue Today</div><div className="stat-sub">↑ 12% vs yesterday</div></div>
              </div>
              <div className="stat-card">
                <div className="stat-num" style={{color:'var(--orange)'}}>487ms</div>
                <div><div className="stat-label">Avg Response</div><div className="stat-sub">Deepgram + GPT-4.1</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="section" id="pricing">
          <div className="reveal in">
            <div className="sec-label">Pricing</div>
            <div className="sec-title">Simple. Honest.</div>
            <div className="sec-sub">All plans include unlimited AI minutes, Square sync, and Australian support.</div>
          </div>
          <div className="pricing-grid">
            <div className="pcard reveal in">
              <div className="pc-plan">Starter</div>
              <div className="pc-price"><sup>$</sup>149</div>
              <div className="pc-period">per month · 1 location</div>
              <div className="pc-feats">
                <div className="pc-feat"><span className="pc-dot"></span>Unlimited AI calls</div>
                <div className="pc-feat"><span className="pc-dot"></span>Square POS sync</div>
                <div className="pc-feat"><span className="pc-dot"></span>SMS confirmations</div>
                <div className="pc-feat"><span className="pc-dot"></span>Restaurant dashboard</div>
              </div>
              <button className="btn-pc btn-pc-dark">Get Started</button>
            </div>
            <div className="pcard featured reveal in">
              <div className="pc-badge">Most Popular</div>
              <div className="pc-plan">Growth</div>
              <div className="pc-price"><sup>$</sup>199</div>
              <div className="pc-period">per month · 3 locations</div>
              <div className="pc-feats">
                <div className="pc-feat"><span className="pc-dot"></span>Everything in Starter</div>
                <div className="pc-feat"><span className="pc-dot"></span>Up to 3 locations</div>
                <div className="pc-feat"><span className="pc-dot"></span>Stripe phone payments</div>
                <div className="pc-feat"><span className="pc-dot"></span>Analytics &amp; reporting</div>
              </div>
              <button className="btn-pc btn-pc-glow">Start Free Trial</button>
            </div>
            <div className="pcard reveal in">
              <div className="pc-plan">Enterprise</div>
              <div className="pc-price"><sup>$</sup>299</div>
              <div className="pc-period">per month · unlimited</div>
              <div className="pc-feats">
                <div className="pc-feat"><span className="pc-dot"></span>Everything in Growth</div>
                <div className="pc-feat"><span className="pc-dot"></span>Unlimited locations</div>
                <div className="pc-feat"><span className="pc-dot"></span>Custom voice &amp; script</div>
                <div className="pc-feat"><span className="pc-dot"></span>Dedicated AM</div>
              </div>
              <button className="btn-pc btn-pc-dark">Contact Sales</button>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="cta-wrap">
          <div className="reveal in">
            <div className="cta-orb">
              <div className="cta-emoji" style={{position:'relative', zIndex:1}}>🎙️</div>
            </div>
            <h2 className="cta-h">Your restaurant<br/><span className="cta-miss">misses calls.</span></h2>
            <p className="cta-sub">Every missed call is a missed order. TalkByte answers every one.</p>
            <button className="btn-cta"><span>Start Free 14-Day Trial →</span></button>
            <div className="cta-trust">Setup in 15 min · No credit card · Australian support</div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
"""

with open(page_path, "w", encoding="utf-8") as f:
    f.write(page_tsx_content)

print("Done generating page.tsx and modifying globals.css")
