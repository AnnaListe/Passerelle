import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, MessageCircle, FileText, Receipt, User, FileSignature, ClipboardList } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/avatar';

const navigation = [
  { name: 'Accueil', path: '/dashboard', icon: Home },
  { name: 'Enfants', path: '/children', icon: Users },
  { name: 'Planning', path: '/planning', icon: Calendar },
  { name: 'Messages', path: '/messages', icon: MessageCircle },
  { name: 'Documents', path: '/documents', icon: FileText },
  { name: 'Factures', path: '/invoices', icon: Receipt },
  { name: 'Devis', path: '/quotes', icon: ClipboardList },
  { name: 'Contrats', path: '/contracts', icon: FileSignature },
];

const MobileNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-100 z-50"
      data-testid="mobile-nav"
    >
      <div className="flex justify-around items-center px-2 py-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`nav-${item.name.toLowerCase()}`}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
                isActive ? 'text-primary' : 'text-slate-500 hover:text-primary'
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const DesktopNav = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-100 flex-col z-40">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-2xl font-bold text-primary font-outfit">Passerelle</h1>
        <p className="text-sm text-foreground-muted mt-1">Espace professionnel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`nav-${item.name.toLowerCase()}`}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive 
                  ? 'bg-primary-light text-primary font-medium' 
                  : 'text-slate-600 hover:bg-background-subtle hover:text-primary'
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-100">
        <Link 
          to="/profile"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-background-subtle transition-colors"
          data-testid="nav-profile"
        >
          <Avatar 
            src={user?.avatar_url} 
            firstName={user?.first_name} 
            lastName={user?.last_name}
            size="default"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.profession}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
};

const Navigation = () => {
  return (
    <>
      <DesktopNav />
      <MobileNav />
    </>
  );
};

export default Navigation;
