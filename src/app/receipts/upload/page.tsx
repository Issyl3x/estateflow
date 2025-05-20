'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function UploadReceipt() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string>('');
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCsvData(e.target.value);
  };

  const handleOcrUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);
    try {
      // Here you would implement the OCR logic
      // For now, we'll just simulate a successful upload
      toast.success('Receipt uploaded successfully');
      router.push('/transactions');
    } catch (error) {
      toast.error('Failed to process receipt');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvData.trim()) {
      toast.error('Please enter CSV data');
      return;
    }

    setLoading(true);
    try {
      const rows = csvData.split('\n').map(row => row.split(','));
      const headers = rows[0];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === headers.length) {
          const transaction = {
            property: row[0],
            date: row[1],
            vendor: row[2],
            description: row[3],
            amount: parseFloat(row[4]),
            category: row[5],
            unit: row[6],
            cardUsed: row[7],
            createdAt: new Date(),
          };
          
          await addDoc(collection(db, 'transactions'), transaction);
        }
      }
      
      toast.success('CSV imported successfully');
      router.push('/transactions');
    } catch (error) {
      toast.error('Failed to import CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Upload Receipt</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OCR Upload */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Receipt Image/PDF</h2>
          <form onSubmit={handleOcrUpload}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
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
              {loading ? 'Processing...' : 'Upload Receipt'}
            </button>
          </form>
        </div>

        {/* CSV Import */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Import CSV</h2>
          <form onSubmit={handleCsvImport}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste CSV Data
              </label>
              <textarea
                value={csvData}
                onChange={handleCsvChange}
                rows={10}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Property,Date,Vendor,Description,Amount,Category,Unit,Card"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !csvData.trim()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import CSV'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 