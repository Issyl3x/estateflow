import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  PlusCircleIcon,
  DocumentTextIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Add Transaction', href: '/transactions/add', icon: PlusCircleIcon },
  { name: 'View Transactions', href: '/transactions', icon: DocumentTextIcon },
  { name: 'Upload Receipt', href: '/receipts/upload', icon: DocumentArrowUpIcon },
  { name: 'Deleted Items', href: '/deleted', icon: TrashIcon },
  { name: 'Export Data', href: '/export', icon: ArrowDownTrayIcon },
  { name: 'Investors', href: '/investors', icon: UserGroupIcon },
  { name: 'Properties', href: '/properties', icon: BuildingOfficeIcon },
  { name: 'Cards', href: '/cards', icon: CreditCardIcon },
  { name: 'Bookkeeping', href: '/bookkeeping', icon: BookOpenIcon, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white w-64">
      <div className="flex items-center justify-center h-16 px-4 bg-gray-900">
        <h1 className="text-xl font-bold">EstateFlow</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="mr-3 h-6 w-6" aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 