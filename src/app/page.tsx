import { redirect } from 'next/navigation';
import { auth } from '@/lib/firebase';
import Dashboard from '@/components/Dashboard';

export default async function Home() {
  const session = await auth.currentUser;
  
  if (!session) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <Dashboard />
    </main>
  );
}
