'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  property: string;
}

export default function DeletedItems() {
  const [deletedTransactions, setDeletedTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchDeletedTransactions();
  }, []);

  const fetchDeletedTransactions = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'transactions'), where('deleted', '==', true));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Transaction[];
      setDeletedTransactions(data);
    } catch (e) {
      toast.error('Failed to fetch deleted transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'transactions', id), { deleted: false });
      toast.success('Transaction restored');
      fetchDeletedTransactions();
    } catch (e) {
      toast.error('Failed to restore transaction');
    }
  };

  const handleDeleteForever = async (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to permanently delete this transaction? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
      toast.success('Transaction permanently deleted');
      fetchDeletedTransactions();
    } catch (e) {
      toast.error('Failed to delete transaction');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Deleted Items</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Deleted Transactions</h2>
        <p className="text-sm text-gray-400 mb-4">View and restore transactions that have been deleted.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : deletedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">No deleted transactions</td>
                </tr>
              ) : (
                deletedTransactions.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{format(new Date(t.date), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{t.vendor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">${t.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{t.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{t.property}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isAdmin ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRestore(t.id)}
                            className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handleDeleteForever(t.id)}
                            className="px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
                          >
                            Delete Forever
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Admin only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 