import { useState, useEffect } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Transaction {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  property: string;
}

const categoryColors = [
  '#36A2EB', // Utilities
  '#FF6384', // Repairs
  '#4BC0C0', // Property Management
  '#FFCE56', // Supplies
  '#9966FF', // Other
];

const Dashboard = () => {
  const [totalSpend, setTotalSpend] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      setTransactions(data);
      setRecentTransactions(data.slice(0, 5));
      setTotalSpend(
        data
          .filter(t => {
            const now = new Date();
            const tDate = new Date(t.date);
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
          })
          .reduce((sum, t) => sum + t.amount, 0)
      );
    } catch (e) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions by date range for the pie chart
  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    const start = dateRange.start ? new Date(dateRange.start) : null;
    const end = dateRange.end ? new Date(dateRange.end) : null;
    return (
      (!start || tDate >= start) &&
      (!end || tDate <= end)
    );
  });

  // Calculate spend by category
  const categoryTotals: { [category: string]: number } = {};
  filteredTransactions.forEach(t => {
    if (!categoryTotals[t.category]) categoryTotals[t.category] = 0;
    categoryTotals[t.category] += t.amount;
  });
  const pieLabels = Object.keys(categoryTotals);
  const pieData = Object.values(categoryTotals);

  const spendByCategoryData = {
    labels: pieLabels,
    datasets: [
      {
        data: pieData,
        backgroundColor: categoryColors.slice(0, pieLabels.length),
      },
    ],
  };

  const monthlySpendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Monthly Spend',
        data: [12000, 19000, 15000, 25000, 22000, 30000],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Total Spend This Month */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Total Spend This Month</h2>
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">${totalSpend.toLocaleString()}</p>
      </div>

      {/* Running Cost by Property */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {['Blue Haven', 'Fountain Commons', 'Brick Haven'].map((property) => (
          <div key={property} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">{property}</h3>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">$0</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Spend Trend</h3>
          <Line data={monthlySpendData} />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Spend by Category</h3>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                className="rounded bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                className="rounded bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs"
              />
            </div>
          </div>
          <div className="h-64">
            <Pie data={spendByCategoryData} />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recentTransactions.map((transaction, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {format(new Date(transaction.date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {transaction.vendor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {transaction.property}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    ${transaction.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 