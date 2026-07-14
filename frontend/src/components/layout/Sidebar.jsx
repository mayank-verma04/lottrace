import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, PlusCircle, GitBranch,
  MapPin, Box, Upload, FileText, AlertTriangle, Shield, Settings, LogOut, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { logoutApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { queryClient } from '@/lib/queryClient';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: '*' },
  { label: 'Lots', path: '/lots', icon: Package, permission: 'lots.read' },
  { label: 'Events', path: '/events', icon: Activity, permission: 'events.read' },
  { label: 'Record Event', path: '/events/record', icon: PlusCircle, permission: 'events.create' },
  { label: 'Trace', path: '/trace', icon: GitBranch, permission: 'trace.read' },
  { label: 'Locations', path: '/locations', icon: MapPin, permission: 'locations.read' },
  { label: 'Products', path: '/products', icon: Box, permission: 'products.read' },
  { label: 'Imports', path: '/imports', icon: Upload, permission: 'imports.read' },
  { label: 'Reports', path: '/reports/compliance-gaps', icon: FileText, permission: 'reports.read' },
  { label: 'Recall', path: '/recall', icon: AlertTriangle, permission: 'recall.read' },
  { label: 'Audit Log', path: '/audit', icon: Shield, permission: 'audit.read' },
  { label: 'Settings', path: '/settings', icon: Settings, permission: 'settings.read' },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      // ignore error — clear local state regardless
    } finally {
      clearAuth();
      queryClient.clear();
      navigate('/login');
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-brand-600">LotTrace</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          if (!can(item.permission) && item.permission !== '*') return null;

          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex w-full items-center px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};
