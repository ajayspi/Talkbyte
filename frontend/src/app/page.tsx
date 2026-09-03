'use client';

import { useEffect, useState } from 'react';
import { getHealth } from '@/lib/api';

const navItems = ['Overview', 'Calls', 'Orders', 'Menu', 'Analytics', 'Settings'];

export default function HomePage() {
  const [status, setStatus] = useState('Checking backend');

  useEffect(() => {
    getHealth()
      .then((health) => setStatus(health.status === 'ok' ? 'Backend online' : 'Backend unavailable'))
      .catch(() => setStatus('Backend unavailable'));
  }, []);

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">T</span><span>TalkByte</span></div>
        <div className="restaurant-switcher"><span className="restaurant-avatar">M</span><span>Mama&apos;s Pizzeria<small>Newtown, NSW</small></span><span aria-hidden="true">⌄</span></div>
        <nav aria-label="Main navigation">
          {navItems.map((item, index) => <a className={index === 0 ? 'nav-item active' : 'nav-item'} href={`#${item.toLowerCase()}`} key={item}><span aria-hidden="true">{['◈', '◉', '▣', '✦', '◌', '⚙'][index]}</span>{item}</a>)}
        </nav>
        <div className="sidebar-footer"><div className="status compact"><span className="status-dot" aria-hidden="true" />{status}</div><span className="plan">Growth plan · 1,240 calls left</span></div>
      </aside>
      <section className="dashboard-content">
        <header className="topbar"><div><p className="eyebrow">Thursday, 4 September 2026</p><h1 id="title">Good afternoon, John</h1></div><div className="top-actions"><button className="icon-button" aria-label="Notifications">♢</button><button className="profile-button">JR <span>John Rossi</span></button></div></header>
        <div className="content-wrap">
          <section className="hero-strip"><div><p className="eyebrow">Live operations</p><h2>Your phone line is taking orders.</h2><p>TalkByte is monitoring every call and keeping your team in the loop.</p></div><div className="hero-metric"><strong>98.4%</strong><span>answer rate today</span></div></section>
          <section className="kpi-grid" aria-label="Today&apos;s key metrics">
            <Metric label="Calls today" value="24" change="↑ 12%" detail="vs yesterday" tone="coral" />
            <Metric label="Active calls" value="2" change="Live now" detail="customers waiting" tone="teal" />
            <Metric label="Orders placed" value="18" change="↑ 8%" detail="vs yesterday" tone="gold" />
            <Metric label="Revenue today" value="$485.50" change="AUD inc. GST" detail="from paid orders" tone="ink" />
          </section>
          <section className="workspace-grid">
            <article className="surface"><div className="section-heading"><div><p className="eyebrow">Live now</p><h2>Active calls</h2></div><a href="#calls">View all</a></div><CallRow name="Sarah M." context="Regular customer · 56 orders" action="Confirming order details" time="01:45" confidence="96%" /><CallRow name="Michael L." context="New customer" action="Customer ordering" time="00:35" confidence="87%" /></article>
            <article className="surface"><div className="section-heading"><div><p className="eyebrow">Order queue</p><h2>Recent orders</h2></div><a href="#orders">View all</a></div><OrderRow id="1001" items="2× Margherita, garlic bread" total="$38.50" state="Paid · Preparing" /><OrderRow id="1002" items="Spaghetti Carbonara, Caesar salad" total="$32.45" state="Paid · Preparing" /><OrderRow id="1003" items="3× garlic bread, 2× Coke" total="$18.90" state="Awaiting payment" /></article>
          </section>
          <section className="lower-grid"><article className="surface insight"><p className="eyebrow">Service pulse</p><h2>Customers are getting through.</h2><p>Your answer rate is ahead of yesterday, and the average call is 2m 18s. Keep the line open through the evening rush.</p><div className="pulse-bar"><span /></div><div className="pulse-labels"><span>11am</span><span>Now</span><span>10pm</span></div></article><article className="surface"><div className="section-heading"><div><p className="eyebrow">Best sellers</p><h2>Menu momentum</h2></div><a href="#menu">Manage</a></div><div className="dish"><span>01</span><strong>Pizza Margherita</strong><b>38%</b></div><div className="dish"><span>02</span><strong>Garlic Bread</strong><b>22%</b></div><div className="dish"><span>03</span><strong>Spaghetti Carbonara</strong><b>18%</b></div></article></section>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, change, detail, tone }: { label: string; value: string; change: string; detail: string; tone: string }) {
  return <article className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong><small><b>{change}</b> {detail}</small></article>;
}

function CallRow({ name, context, action, time, confidence }: { name: string; context: string; action: string; time: string; confidence: string }) {
  return <div className="call-row"><span className="call-avatar">{name[0]}</span><div><strong>{name}</strong><small>{context}</small><span className="call-action">{action}</span></div><div className="row-end"><strong>{time}</strong><small>{confidence} confidence</small></div></div>;
}

function OrderRow({ id, items, total, state }: { id: string; items: string; total: string; state: string }) {
  return <div className="order-row"><div><strong>Order #{id}</strong><small>{items}</small></div><div className="row-end"><strong>{total}</strong><small>{state}</small></div></div>;
}