import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ScanLine, Clock, Keyboard } from 'lucide-react';
import ScanPage from '@/pages/ScanPage';

const SCAN_NAV = [
  { label: 'Scan',    path: '/scan',     icon: ScanLine },
  { label: 'History', path: '/history',  icon: Clock },
  { label: 'Manual',  path: '/manual',   icon: Keyboard },
];

function BottomNav() {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-16 pb-safe">
      {SCAN_NAV.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname.startsWith(item.path) || (item.path === '/scan' && location.pathname === '/');
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full min-h-[44px] ${
              isActive ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <Icon className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
          <h1 className="font-bold text-xl tracking-tight text-blue-600">LotTrace</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
            Online
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<ScanPage />} />
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/history" element={<div className="p-4 text-center text-muted-foreground mt-10">History feature coming soon</div>} />
            <Route path="/manual" element={<div className="p-4 text-center text-muted-foreground mt-10">Manual entry coming soon</div>} />
          </Routes>
        </main>
        
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
