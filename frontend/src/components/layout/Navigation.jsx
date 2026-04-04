import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, MessageCircle, FileText, Receipt, User, FileSignature, ClipboardList, Bell } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/avatar';
import { supabase } from '../../lib/supabase';

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

const NotificationPanel = ({ notifications, onAcceptRdv, onRefuseRdv, onClose }) => (
  <div className="fixed top-20 left-72 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
      <p className="font-semibold text-slate-800">Notifications</p>
      <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">Fermer</button>
    </div>
    {notifications.length === 0 ? (
      <p className="text-sm text-slate-400 text-center py-6">Aucune notification</p>
    ) : (
      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        {notifications.map(notif => (
          <div key={notif.id} className="p-4">
            <p className="font-semibold text-sm text-slate-700 mb-1">{notif.title}</p>
            <p className="text-xs text-slate-500 mb-3">{notif.message}</p>
            {notif.type === 'rdv_demande' && (
              <div className="flex gap-2">
                <button
                  onClick={() => onAcceptRdv(notif)}
                  className="flex-1 py-2 text-white text-xs font-semibold rounded-xl"
                  style={{ backgroundColor: '#4A9B8F' }}
                >
                  Accepter
                </button>
                <button
                  onClick={() => onRefuseRdv(notif)}
                  className="flex-1 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl"
                >
                  Refuser
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

const MobileNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false });
    setNotifications(data || []);
  };

  const handleAcceptRdv = async (notif) => {
    try {
      const notifData = JSON.parse(notif.data || '{}');
      await supabase.from('appointments').insert({
        child_id: notifData.child_id,
        professional_id: user.id,
        title: notifData.title,
        appointment_type: 'seance',
        start_datetime: notifData.start_datetime,
        end_datetime: notifData.end_datetime,
        location: notifData.location || null,
        notes: notifData.notes || null,
      });
      await supabase.from('notifications').update({ read: true }).eq('id', notif.id);
      await loadNotifications();
      setShowNotifications(false);
    } catch (error) {
      console.error('Erreur acceptation RDV:', error);
    }
  };

  const handleRefuseRdv = async (notif) => {
    await supabase.from('notifications').update({ read: true }).eq('id', notif.id);
    await loadNotifications();
  };

  return (
    <div className="md:hidden">
      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          onAcceptRdv={handleAcceptRdv}
          onRefuseRdv={handleRefuseRdv}
          onClose={() => setShowNotifications(false)}
        />
      )}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-100 z-50"
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
    </div>
  );
};

const DesktopNav = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false });
    setNotifications(data || []);
  };

  const handleAcceptRdv = async (notif) => {
    try {
      const notifData = JSON.parse(notif.data || '{}');
      await supabase.from('appointments').insert({
        child_id: notifData.child_id,
        professional_id: user.id,
        title: notifData.title,
        appointment_type: 'seance',
        start_datetime: notifData.start_datetime,
        end_datetime: notifData.end_datetime,
        location: notifData.location || null,
        notes: notifData.notes || null,
      });
      await supabase.from('notifications').update({ read: true }).eq('id', notif.id);
      await loadNotifications();
      setShowNotifications(false);
    } catch (error) {
      console.error('Erreur acceptation RDV:', error);
    }
  };

  const handleRefuseRdv = async (notif) => {
    await supabase.from('notifications').update({ read: true }).eq('id', notif.id);
    await loadNotifications();
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-100 flex-col z-40">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary font-outfit">Passerelle</h1>
          <p className="text-sm text-foreground-muted mt-1">Espace professionnel</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl bg-background-subtle hover:bg-primary-light transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationPanel
              notifications={notifications}
              onAcceptRdv={handleAcceptRdv}
              onRefuseRdv={handleRefuseRdv}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>
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
