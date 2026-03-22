import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, MessageCircle, FileText, User } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/parent/dashboard', icon: Home, label: 'Accueil' },
  { path: '/parent/planning', icon: Calendar, label: 'Planning' },
  { path: '/parent/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/parent/documents', icon: FileText, label: 'Documents' },
  { path: '/parent/profil', icon: User, label: 'Profil' },
];

const ParentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-md mx-auto min-h-screen bg-stone-50 relative overflow-x-hidden shadow-2xl">
        {/* Content */}
        <div className="pb-20">
          <Outlet />
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-t border-stone-100 h-20 pb-4 flex items-center justify-around z-50">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 ${
                  isActive ? 'text-sage-600' : 'text-slate-400'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-sage-100' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={`text-[10px] font-heading font-semibold ${isActive ? 'text-sage-600' : 'text-slate-400'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default ParentLayout;
