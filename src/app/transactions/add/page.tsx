'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import ReCAPTCHA from 'react-google-recaptcha';

const schema = yup.object({
  date: yup.date().required('Date is required'),
  vendor: yup.string().required('Vendor is required'),
  description: yup.string().required('Description is required'),
  amount: yup.number().required('Amount is required').positive('Amount must be positive'),
  category: yup.string().required('Category is required'),
  investor: yup.string().required('Investor is required'),
  property: yup.string().required('Property is required'),
  unit: yup.string(),
  cardUsed: yup.string().required('Card used is required'),
});

type FormData = yup.InferType<typeof schema>;

const categories = [
  'Maintenance',
  'Utilities',
  'Insurance',
  'Taxes',
  'Other',
];

const RECAPTCHA_SITE_KEY = 'YOUR_RECAPTCHA_SITE_KEY'; // Replace with your actual site key

const ADMIN_EMAIL = 'jessrafalfernandez@gmail.com';
const WEBHOOK_URL = 'https://hook.us2.make.com/y7mimw79elkvk3dm3x86xu7v373ah4f';

export default function AddTransaction() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
  });
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    if (!captchaValue) {
      toast.error('Please complete the reCAPTCHA.');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        ...data,
        createdAt: new Date(),
      });
      // Webhook logic
      const user = auth.currentUser;
      if (!user || user.email !== ADMIN_EMAIL) {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      toast.success('Transaction added successfully');
      router.push('/transactions');
    } catch (error) {
      toast.error('Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Add Transaction</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              {...register('date')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Vendor</label>
            <input
              type="text"
              {...register('vendor')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.vendor && (
              <p className="mt-1 text-sm text-red-600">{errors.vendor.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              {...register('description')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              step="0.01"
              {...register('amount')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              {...register('category')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Investor</label>
            <input
              type="text"
              {...register('investor')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.investor && (
              <p className="mt-1 text-sm text-red-600">{errors.investor.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Property</label>
            <input
              type="text"
              {...register('property')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.property && (
              <p className="mt-1 text-sm text-red-600">{errors.property.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Unit #</label>
            <input
              type="text"
              {...register('unit')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.unit && (
              <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Card Used</label>
            <input
              type="text"
              {...register('cardUsed')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.cardUsed && (
              <p className="mt-1 text-sm text-red-600">{errors.cardUsed.message}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={RECAPTCHA_SITE_KEY}
            onChange={setCaptchaValue}
          />
        </div>
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
} 