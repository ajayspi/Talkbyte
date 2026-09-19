'use client';

import React, { useState, useEffect } from 'react';
import {
  UtensilsIcon,
  PlusIcon,
  CheckCircleIcon,
  XIcon,
} from '@/components/icons';
import { toggleMenuItemAvailability, getMenuItems } from '@/lib/supabase';
import type { MenuItem } from '@/types/database.types';

interface MenuTabProps {
  isAddItemModalOpen?: boolean;
  setIsAddItemModalOpen?: (open: boolean) => void;
}

interface LocalMenuItem {
  id: string;
  name: string;
  price: string;
  priceRaw: number;
  category: 'Pizzas' | 'Sides' | 'Drinks' | 'Desserts';
  desc: string;
  available: boolean;
}

const DEFAULT_MENU_ITEMS: LocalMenuItem[] = [
  {
    id: 'item-101',
    name: 'Margherita',
    price: '$18.50',
    priceRaw: 18.5,
    category: 'Pizzas',
    desc: 'San Marzano tomato, fresh mozzarella, basil, EVOO. S/M/L/XL.',
    available: true,
  },
  {
    id: 'item-102',
    name: 'Pepperoni Supreme',
    price: '$22.00',
    priceRaw: 22.0,
    category: 'Pizzas',
    desc: 'Double pepperoni, mozzarella, house tomato sauce.',
    available: true,
  },
  {
    id: 'item-103',
    name: 'Quattro Formaggi',
    price: '$24.00',
    priceRaw: 24.0,
    category: 'Pizzas',
    desc: 'Mozzarella, gorgonzola, parmesan, pecorino.',
    available: false,
  },
  {
    id: 'item-104',
    name: 'Veggie Special',
    price: '$21.50',
    priceRaw: 21.5,
    category: 'Pizzas',
    desc: 'Roasted capsicum, mushroom, olives, artichoke, cherry tomato.',
    available: true,
  },
  {
    id: 'item-105',
    name: 'Garlic Bread',
    price: '$7.00',
    priceRaw: 7.0,
    category: 'Sides',
    desc: 'Toasted sourdough, house garlic butter, parsley.',
    available: true,
  },
  {
    id: 'item-106',
    name: 'Diavola Piccante',
    price: '$26.00',
    priceRaw: 26.0,
    category: 'Pizzas',
    desc: 'Spicy calabrese salami, fior di latte, hot honey drizzle.',
    available: true,
  },
  {
    id: 'item-107',
    name: 'Italian Garden Salad',
    price: '$11.00',
    priceRaw: 11.0,
    category: 'Sides',
    desc: 'Baby cos lettuce, radicchio, kalamata olives, balsamic vinaigrette.',
    available: true,
  },
  {
    id: 'item-108',
    name: 'San Pellegrino Sparkling',
    price: '$5.00',
    priceRaw: 5.0,
    category: 'Drinks',
    desc: 'Natural sparkling mineral water 500ml glass bottle.',
    available: true,
  },
  {
    id: 'item-109',
    name: 'Traditional Tiramisu',
    price: '$14.00',
    priceRaw: 14.0,
    category: 'Desserts',
    desc: 'Savoiardi soaked in Italian espresso, mascarpone cream, cocoa.',
    available: true,
  },
];

export const MenuTab: React.FC<MenuTabProps> = ({
  isAddItemModalOpen: externalIsAddItemOpen,
  setIsAddItemModalOpen: externalSetIsAddItemOpen,
}) => {
  const [items, setItems] = useState<LocalMenuItem[]>(DEFAULT_MENU_ITEMS);
  const [activeCategory, setActiveCategory] = useState<string>('All Items');
  const [internalAddItemOpen, setInternalAddItemOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isUploadCsvOpen, setIsUploadCsvOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isAddItemOpen =
    externalIsAddItemOpen !== undefined ? externalIsAddItemOpen : internalAddItemOpen;
  const setAddItemOpen =
    externalSetIsAddItemOpen || setInternalAddItemOpen;

  // Form states for new item modal
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'Pizzas' | 'Sides' | 'Drinks' | 'Desserts'>('Pizzas');
  const [newItemDesc, setNewItemDesc] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Instantaneous 30-second AI availability toggle calling toggleMenuItemAvailability
  const handleToggleAvailability = async (id: string, currentAvailable: boolean) => {
    const newAvailable = !currentAvailable;
    // Optimistic UI state update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, available: newAvailable } : item
      )
    );

    // Call Supabase backend mutation
    try {
      await toggleMenuItemAvailability(id, newAvailable);
      showToast(
        `✓ ${newAvailable ? 'Available' : 'Out of stock'}: AI voice agent synced in <30s.`
      );
    } catch {
      showToast(`Updated locally. AI sync pending.`);
    }
  };

  // Filter items by category
  const filteredItems = items.filter((item) => {
    if (activeCategory === 'All Items') return true;
    if (activeCategory.includes('Pizzas') && item.category === 'Pizzas') return true;
    if (activeCategory.includes('Sides') && item.category === 'Sides') return true;
    if (activeCategory.includes('Drinks') && item.category === 'Drinks') return true;
    if (activeCategory.includes('Desserts') && item.category === 'Desserts') return true;
    return false;
  });

  // Handle Add Item Submit
  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return;

    const parsedPrice = parseFloat(newItemPrice.replace('$', '')) || 15.0;
    const formattedPrice = `$${parsedPrice.toFixed(2)}`;

    const newItem: LocalMenuItem = {
      id: `item-${Date.now()}`,
      name: newItemName,
      price: formattedPrice,
      priceRaw: parsedPrice,
      category: newItemCategory,
      desc: newItemDesc || 'Freshly prepared daily with high quality ingredients.',
      available: true,
    };

    setItems((prev) => [newItem, ...prev]);
    setAddItemOpen(false);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemDesc('');
    showToast(`✓ "${newItem.name}" added to menu catalog & queued for AI RAG embeddings.`);
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

      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="card-title text-base font-bold text-gray-900">
            Menu Management
          </h2>
          <div className="text-xs text-gray-500 mt-1">
            Changes go live to AI agent within 30 seconds
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="topbar-btn btn-ghost text-xs flex items-center gap-1.5"
          >
            📥 Import from Website
          </button>
          <button
            onClick={() => setIsUploadCsvOpen(true)}
            className="topbar-btn btn-ghost text-xs"
          >
            Upload CSV
          </button>
          <button
            onClick={() => setAddItemOpen(true)}
            className="topbar-btn btn-primary text-xs flex items-center gap-1.5"
          >
            <PlusIcon size={14} />
            Add Item
          </button>
        </div>
      </div>

      {/* RAG Sync Alert */}
      <div className="alert alert-success">
        ✓ Menu synced to AI agent 4 minutes ago
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {[
          { id: 'All Items', label: `All Items (${items.length})` },
          {
            id: 'Pizzas',
            label: `🍕 Pizzas (${items.filter((i) => i.category === 'Pizzas').length})`,
          },
          {
            id: 'Sides',
            label: `🥗 Sides (${items.filter((i) => i.category === 'Sides').length})`,
          },
          {
            id: 'Drinks',
            label: `🥤 Drinks (${items.filter((i) => i.category === 'Drinks').length})`,
          },
          {
            id: 'Desserts',
            label: `🍰 Desserts (${items.filter((i) => i.category === 'Desserts').length})`,
          },
        ].map((cat) => {
          const isActive =
            activeCategory === cat.id ||
            (cat.id === 'All Items' && activeCategory === 'All Items');
          return (
            <div
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#7c3aed] text-white shadow-md shadow-purple-500/20'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </div>
          );
        })}
      </div>

      {/* Menu Cards Grid */}
      <div className="menu-grid">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`menu-item-card transition-all ${
              !item.available ? 'border-red-200 bg-red-50/50' : 'bg-white'
            }`}
          >
            <span
              className={`item-badge badge ${
                item.available ? 'badge-green' : 'badge-red'
              }`}
            >
              {item.available ? 'Available' : 'Unavailable'}
            </span>

            <div className="menu-item-name">{item.name}</div>
            <div className="menu-item-price">{item.price}</div>
            <div className="menu-item-desc">{item.desc}</div>

            <div className="toggle-wrap pt-2 border-t border-gray-100">
              <span
                style={{
                  fontSize: '12px',
                  color: item.available ? 'var(--muted)' : 'var(--danger)',
                  fontWeight: item.available ? '400' : '600',
                }}
              >
                {item.available ? 'Available' : 'Unavailable'}
              </span>

              {/* Instant Availability Toggle Switch */}
              <div
                className={`toggle ${item.available ? 'on' : ''}`}
                onClick={() => handleToggleAvailability(item.id, item.available)}
                title="Toggle availability for AI voice ordering"
              />
            </div>
          </div>
        ))}

        {/* Add New Item Dashed Card Button */}
        <div
          onClick={() => setAddItemOpen(true)}
          className="menu-item-card border-dashed border-2 border-gray-300 bg-[#f8f7ff] hover:bg-purple-50/50 hover:border-purple-300 flex flex-col items-center justify-center min-h-[140px] cursor-pointer transition-all group"
        >
          <div className="text-3xl text-gray-400 group-hover:text-purple-600 transition-colors mb-2 font-light">
            +
          </div>
          <div className="text-xs text-gray-500 group-hover:text-purple-700 font-medium">
            Add New Item
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Add Menu Item
              </h3>
              <button
                onClick={() => setAddItemOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <XIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="py-4 space-y-4">
              <div className="input-group">
                <div className="input-label">Item Title</div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prosciutto & Fig"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="input-group">
                  <div className="input-label">Price (AUD)</div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24.50"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <div className="input-label">Category</div>
                  <select
                    value={newItemCategory}
                    onChange={(e) =>
                      setNewItemCategory(e.target.value as any)
                    }
                  >
                    <option value="Pizzas">Pizzas</option>
                    <option value="Sides">Sides</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <div className="input-label">Description & Ingredients</div>
                <textarea
                  style={{ height: '70px', resize: 'none' }}
                  placeholder="e.g. San Marzano tomato base, 24-month prosciutto di Parma, black mission figs..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAddItemOpen(false)}
                  className="topbar-btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="topbar-btn btn-primary text-xs"
                >
                  Save & Sync with AI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Website Scraper Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Import Menu from Website
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <XIcon size={16} />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <p className="text-xs text-gray-600">
                TalkByte AI automatically parses dish names, descriptions, sizing, and pricing from your online menu.
              </p>
              <div className="input-group">
                <div className="input-label">Website Menu URL</div>
                <input
                  type="text"
                  placeholder="https://mamaspizzeria.com.au/menu"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="topbar-btn btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  showToast('Web menu crawl queued. 24 items synced.');
                }}
                className="topbar-btn btn-primary text-xs"
              >
                Start Crawl & Ingestion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {isUploadCsvOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Upload Menu CSV</h3>
              <button
                onClick={() => setIsUploadCsvOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <XIcon size={16} />
              </button>
            </div>
            <div className="py-6 border-2 border-dashed border-gray-200 rounded-xl my-4 text-center cursor-pointer hover:border-purple-400">
              <div className="text-3xl mb-1">📄</div>
              <div className="text-xs font-semibold text-gray-700">
                Drag and drop menu.csv here
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                Columns: Name, Category, Price, Description
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsUploadCsvOpen(false)}
                className="topbar-btn btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsUploadCsvOpen(false);
                  showToast('Menu CSV successfully imported and synced with AI agent.');
                }}
                className="topbar-btn btn-primary text-xs"
              >
                Upload & Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MenuTab;
