'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

interface BankTransaction {
  date: string;
  description: string;
  amount: number;
  matched: boolean;
  matchId?: string;
}

interface AppTransaction {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  description: string;
}

export default function Bookkeeping() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [appTransactions, setAppTransactions] = useState<AppTransaction[]>([]);
  const { isAdmin } = useAuth();
  const router = useRouter();

  if (!isAdmin) {
    router.push('/');
    return null;
  }

  const fetchAppTransactions = async () => {
    const snapshot = await getDocs(collection(db, 'transactions'));
    const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as AppTransaction[];
    setAppTransactions(data);
    return data;
  };

  const parseCSV = (csv: string) => {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = values[i]?.trim(); });
      return obj;
    });
  };

  const matchTransactions = (bankTxs: BankTransaction[], appTxs: AppTransaction[]) => {
    return bankTxs.map(bankTx => {
      const match = appTxs.find(appTx => {
        // Match by date (ignore time), amount, and description/vendor
        const sameDate = format(new Date(bankTx.date), 'yyyy-MM-dd') === format(new Date(appTx.date), 'yyyy-MM-dd');
        const sameAmount = Math.abs(Number(bankTx.amount) - Number(appTx.amount)) < 0.01;
        const descMatch = (bankTx.description || '').toLowerCase().includes((appTx.vendor || '').toLowerCase()) || (appTx.vendor || '').toLowerCase().includes((bankTx.description || '').toLowerCase());
        return sameDate && sameAmount && descMatch;
      });
      return match ? { ...bankTx, matched: true, matchId: match.id } : { ...bankTx, matched: false };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    setLoading(true);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      const bankTxs: BankTransaction[] = parsed.map((row: any) => ({
        date: row.date || row["transaction date"] || '',
        description: row.description || row.vendor || row["transaction description"] || '',
        amount: parseFloat(row.amount || row["transaction amount"] || '0'),
        matched: false,
      }));
      const appTxs = await fetchAppTransactions();
      const matched = matchTransactions(bankTxs, appTxs);
      setTransactions(matched);
      toast.success('Bank statement uploaded and parsed');
    } catch (error) {
      toast.error('Failed to process bank statement');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToApp = async (tx: BankTransaction) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        date: tx.date,
        vendor: tx.description,
        description: tx.description,
        amount: tx.amount,
        category: 'Uncategorized',
        property: '',
        unit: '',
        cardUsed: '',
        createdAt: new Date(),
        deleted: false,
      });
      toast.success('Transaction added to app');
      // Refresh app transactions and re-match
      const appTxs = await fetchAppTransactions();
      setTransactions(matchTransactions(transactions, appTxs));
    } catch (e) {
      toast.error('Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Bookkeeping</h1>
      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload Bank Statement</h2>
        <form onSubmit={handleUpload}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !file}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Upload Statement'}
          </button>
        </form>
      </div>
      {/* Transactions Table */}
      {transactions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold">Transaction Comparison</h2>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
              Highlighted rows indicate transactions that need attention. You can add unmatched transactions directly to the app.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((transaction, index) => (
                  <tr
                    key={index}
                    className={!transaction.matched ? 'bg-yellow-50 dark:bg-yellow-900' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {transaction.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      ${transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.matched
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {transaction.matched ? 'Matched' : 'Unmatched'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!transaction.matched && (
                        <button
                          onClick={() => handleAddToApp(transaction)}
                          className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                          disabled={loading}
                        >
                          Add to App
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 