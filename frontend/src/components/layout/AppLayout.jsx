import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export const AppLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
