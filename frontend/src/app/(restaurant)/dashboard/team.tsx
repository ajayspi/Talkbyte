'use client';
import { useState } from 'react';

export default function TeamTab() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [invited, setInvited] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInvited(true);
    setTimeout(() => {
      setInvited(false);
      setEmail('');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Invite Team Member</h3>
        <form onSubmit={handleInvite} className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="manager@restaurant.com"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="staff">Staff (Read Only)</option>
              <option value="manager">Manager (Edit Menu & Orders)</option>
              <option value="owner">Owner (Full Access)</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            Send Invite
          </button>
        </form>
        {invited && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
             <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            Invitation sent to {email}!
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Active Members</h3>
        </div>
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">John Rossi</div>
                <div className="text-gray-500 text-xs">john@mamaspizzeria.com</div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Owner</span>
              </td>
              <td className="px-6 py-4">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span>Active</span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-gray-400 hover:text-gray-600">Edit</button>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">Maria Garcia</div>
                <div className="text-gray-500 text-xs">maria@mamaspizzeria.com</div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Manager</span>
              </td>
              <td className="px-6 py-4">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span>Active</span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-gray-400 hover:text-gray-600">Edit</button>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">Front Desk</div>
                <div className="text-gray-500 text-xs">frontdesk@mamaspizzeria.com</div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Staff</span>
              </td>
              <td className="px-6 py-4">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>Invited</span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-gray-400 hover:text-red-600">Revoke</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
