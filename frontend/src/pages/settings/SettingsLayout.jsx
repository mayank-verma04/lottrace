import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Building2, Users } from 'lucide-react';

const SETTINGS_NAV = [
  { label: 'Organization Profile', path: '/settings', icon: Building2 },
  { label: 'Users & Roles', path: '/settings/users', icon: Users },
];

export default function SettingsLayout() {
  const location = useLocation();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Settings Main Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      {/* Clean Underline Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {SETTINGS_NAV.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground',
                  'group inline-flex items-center border-b-2 py-2 px-1 text-sm font-medium whitespace-nowrap transition-colors'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                    '-ml-0.5 mr-2 h-4 w-4 transition-colors'
                  )}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      <div className="pt-2">
        <Outlet />
      </div>
    </div>
  );
}
