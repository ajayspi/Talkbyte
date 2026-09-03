'use client';

import React, { useState } from 'react';
import {
  DollarIcon,
  ShoppingCartIcon,
  BarChartIcon,
  RefreshIcon,
  SearchIcon,
  DownloadIcon,
  CheckCircleIcon,
  XIcon,
} from '@/components/icons';
import type { Order } from '@/types/database.types';

interface OrderRowItem {
  id: string;
  orderNumber: string;
  time: string;
  items: string;
  total: string;
  rawTotal: number;
  status: 'Paid' | 'Link Sent' | 'Expired' | 'POS Synced';
  paymentTimeline: {
    placed: 'done';
    linkSent: 'done' | 'active' | 'failed';
    paid: 'done' | 'pending' | 'failed';
  };
  pos: 'Synced' | 'Pending' | 'Failed';
  customerPhone: string;
  stripeLink?: string;
  posOrderId?: string;
}

const INITIAL_ORDERS: OrderRowItem[] = [
  {
    id: 'ord-1047',
    orderNumber: '#1047',
    time: '14:22',
    items: 'Margherita L, Extra Cheese, Garlic ×2, Coke',
    total: '$38.50',
    rawTotal: 38.5,
    status: 'Paid',
    paymentTimeline: {
      placed: 'done',
      linkSent: 'done',
      paid: 'done',
    },
    pos: 'Synced',
    customerPhone: '+61 412 893 210',
    stripeLink: 'https://buy.stripe.com/live_ord1047_token',
    posOrderId: 'sq_ord_9011a',
  },
  {
    id: 'ord-1046',
    orderNumber: '#1046',
    time: '14:08',
    items: 'Pepperoni XL, Coke ×3',
    total: '$54.00',
    rawTotal: 54.0,
    status: 'Link Sent',
    paymentTimeline: {
      placed: 'done',
      linkSent: 'active',
      paid: 'pending',
    },
    pos: 'Pending',
    customerPhone: '+61 498 765 432',
    stripeLink: 'https://buy.stripe.com/live_ord1046_token',
  },
  {
    id: 'ord-1045',
    orderNumber: '#1045',
    time: '13:55',
    items: 'Veggie Special, Tiramisu',
    total: '$42.80',
    rawTotal: 42.8,
    status: 'POS Synced',
    paymentTimeline: {
      placed: 'done',
      linkSent: 'done',
      paid: 'done',
    },
    pos: 'Synced',
    customerPhone: '+61 455 332 110',
    stripeLink: 'https://buy.stripe.com/live_ord1045_token',
    posOrderId: 'sq_ord_9010b',
  },
  {
    id: 'ord-1044',
    orderNumber: '#1044',
    time: '13:41',
    items: 'Quattro Stagioni',
    total: '$28.00',
    rawTotal: 28.0,
    status: 'Expired',
    paymentTimeline: {
      placed: 'done',
      linkSent: 'failed',
      paid: 'pending',
    },
    pos: 'Failed',
    customerPhone: '+61 423 111 222',
    stripeLink: 'https://buy.stripe.com/live_ord1044_expired',
  },
];

export const OrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<OrderRowItem[]>(INITIAL_ORDERS);
  const [statusFilter, setStatusFilter] = useState<string>('All Status');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderRowItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    const matchesFilter =
      statusFilter === 'All Status' ||
      (statusFilter === 'Paid' && (order.status === 'Paid' || order.status === 'POS Synced')) ||
      (statusFilter === 'Link Sent' && order.status === 'Link Sent') ||
      (statusFilter === 'Expired' && order.status === 'Expired') ||
      (statusFilter === 'POS Synced' && order.pos === 'Synced');

    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  // Action: Resend Link
  const handleResendLink = (orderId: string) => {
    showToast(`SMS payment link re-sent to customer for order ${orderId}.`);
  };

  // Action: Retry POS Push
  const handleRetryPOS = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              pos: 'Synced',
              status: 'POS Synced',
              paymentTimeline: { placed: 'done', linkSent: 'done', paid: 'done' },
              posOrderId: `sq_ord_retry_${Date.now().toString().slice(-4)}`,
            }
          : o
      )
    );
    showToast(`POS push re-attempted. Order ${orderId} is now Synced!`);
  };

  // Action: Export CSV
  const handleExportCSV = () => {
    const headers = ['Order Number', 'Time', 'Items', 'Total AUD', 'Status', 'POS Status', 'Phone'];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      o.time,
      `"${o.items}"`,
      o.total,
      o.status,
      o.pos,
      o.customerPhone,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `talkbyte_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Orders CSV exported successfully.');
  };

  return (
    <div className="section active space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a0a1e] text-white px-5 py-3 rounded-xl shadow-2xl border border-teal-500/40 flex items-center gap-3 animate-fade-in">
          <CheckCircleIcon size={18} className="text-teal-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card teal">
          <div className="kpi-label">Today&apos;s Revenue</div>
          <div className="kpi-value">$1,284</div>
          <div className="kpi-icon text-teal-600">
            <DollarIcon size={24} />
          </div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-label">Orders Today</div>
          <div className="kpi-value">47</div>
          <div className="kpi-icon text-purple-600">
            <ShoppingCartIcon size={24} />
          </div>
        </div>

        <div className="kpi-card orange">
          <div className="kpi-label">Avg Order Value</div>
          <div className="kpi-value">$27.30</div>
          <div className="kpi-icon text-[#FF6B35]">
            <BarChartIcon size={24} />
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-label">POS Sync Rate</div>
          <div className="kpi-value">98%</div>
          <div className="kpi-icon text-emerald-600">
            <RefreshIcon size={24} />
          </div>
        </div>
      </div>

      {/* Expiry Warning Strip */}
      <div className="alert alert-warn flex items-center justify-between">
        <div>
          ⚠️ 2 orders have unpaid payment links expiring soon. Resend or call the customer.
        </div>
      </div>

      {/* Main Orders Card */}
      <div className="card">
        <div className="card-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="card-title">All Orders — Today</span>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-48">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-purple-500"
              />
              <SearchIcon
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-auto text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none bg-white cursor-pointer focus:border-purple-500"
            >
              <option value="All Status">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Link Sent">Link Sent</option>
              <option value="Expired">Expired</option>
              <option value="POS Synced">POS Synced</option>
            </select>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="topbar-btn btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <DownloadIcon size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Time</th>
                <th>Items</th>
                <th>Total (incl. GST)</th>
                <th>Payment</th>
                <th>POS</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-purple-50/40 transition-colors">
                    <td>
                      <strong className="text-gray-900">{order.orderNumber}</strong>
                    </td>
                    <td>{order.time}</td>
                    <td className="max-w-xs truncate text-gray-700">{order.items}</td>
                    <td>
                      <strong className="text-gray-900">{order.total}</strong>
                    </td>

                    {/* 3-Stage Visual Pipeline */}
                    <td>
                      <div className="order-timeline">
                        {/* Stage 1: Order Placed */}
                        <div
                          className="tl-dot done"
                          title="Order Placed"
                        >
                          ✓
                        </div>
                        <div
                          className={`tl-line ${
                            order.paymentTimeline.linkSent === 'done' ||
                            order.paymentTimeline.linkSent === 'active'
                              ? 'done'
                              : ''
                          }`}
                        />

                        {/* Stage 2: Link Sent */}
                        {order.paymentTimeline.linkSent === 'done' && (
                          <div className="tl-dot done" title="Link Sent">
                            ✓
                          </div>
                        )}
                        {order.paymentTimeline.linkSent === 'active' && (
                          <div className="tl-dot active" title="Link Sent (Waiting Payment)">
                            →
                          </div>
                        )}
                        {order.paymentTimeline.linkSent === 'failed' && (
                          <div
                            className="tl-dot"
                            style={{ background: '#fee2e2', color: '#dc2626' }}
                            title="Link Expired / Failed"
                          >
                            ✗
                          </div>
                        )}
                        <div
                          className={`tl-line ${
                            order.paymentTimeline.paid === 'done' ? 'done' : ''
                          }`}
                        />

                        {/* Stage 3: Paid */}
                        {order.paymentTimeline.paid === 'done' && (
                          <div className="tl-dot done" title="Paid">
                            ✓
                          </div>
                        )}
                        {order.paymentTimeline.paid === 'pending' && (
                          <div className="tl-dot pending" title="Pending Payment">
                            ○
                          </div>
                        )}
                        {order.paymentTimeline.paid === 'failed' && (
                          <div
                            className="tl-dot"
                            style={{ background: '#fee2e2', color: '#dc2626' }}
                            title="Payment Failed"
                          >
                            ✗
                          </div>
                        )}
                      </div>
                    </td>

                    {/* POS Status Badge */}
                    <td>
                      {order.pos === 'Synced' && (
                        <span className="badge badge-green">Synced</span>
                      )}
                      {order.pos === 'Pending' && (
                        <span className="badge badge-gray">Pending</span>
                      )}
                      {order.pos === 'Failed' && (
                        <span className="badge badge-red">Failed</span>
                      )}
                    </td>

                    {/* Contextual Action */}
                    <td>
                      {order.pos === 'Synced' && (
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="call-btn call-btn-monitor text-[11px] py-1 px-2.5 rounded hover:bg-gray-200 text-gray-700"
                        >
                          View
                        </button>
                      )}

                      {order.status === 'Link Sent' && (
                        <button
                          onClick={() => handleResendLink(order.orderNumber)}
                          className="call-btn call-btn-intercept text-[11px] py-1 px-2.5 rounded bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          Resend Link
                        </button>
                      )}

                      {order.pos === 'Failed' && (
                        <button
                          onClick={() => handleRetryPOS(order.id)}
                          className="call-btn call-btn-intercept text-[11px] py-1 px-2.5 rounded bg-[#FF6B35] hover:bg-[#e05a27] text-white"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                    No orders matching &quot;{statusFilter}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 text-xs text-gray-500 border-t border-gray-100 flex items-center justify-between">
          <span>
            Payment flow:{' '}
            <strong className="text-gray-700">
              Order Placed → Link Sent → Paid → POS Synced
            </strong>
          </span>
          <span>Showing {filteredOrders.length} of {orders.length} orders today</span>
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Order Details {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-gray-500">
                  Placed at {selectedOrder.time} · Customer: {selectedOrder.customerPhone}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ordered Items
                </span>
                <p className="text-sm font-medium text-gray-800 mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {selectedOrder.items}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 p-2.5 rounded-lg">
                  <span className="text-gray-500">Gross Total (incl. GST)</span>
                  <div className="text-base font-bold text-gray-900 mt-0.5">
                    {selectedOrder.total}
                  </div>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-lg">
                  <span className="text-gray-500">POS Reference</span>
                  <div className="text-xs font-mono font-bold text-purple-700 mt-0.5">
                    {selectedOrder.posOrderId || 'Square #PENDING'}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Stripe Payment Link
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedOrder.stripeLink}
                    className="text-xs bg-gray-50 text-gray-600 p-2 rounded-lg border border-gray-200 w-full font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrder.stripeLink || '');
                      showToast('Payment link copied to clipboard.');
                    }}
                    className="text-xs px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg whitespace-nowrap font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="topbar-btn btn-ghost text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default OrdersTab;
