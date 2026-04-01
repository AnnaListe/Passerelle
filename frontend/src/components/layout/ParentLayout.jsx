import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, MessageCircle, FileText, User, Heart, Bell } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const NAV_ITEMS = [
  { path: '/parent/dashboard', icon: Home, label: 'Accueil' },
  { path: '/parent/enfant', icon: Heart, label: 'Mon enfant' },
  { path: '/parent/planning', icon: Calendar, label: 'Planning' },
  { path: '/parent/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/parent/profil', icon: User, label: 'Profil' },
];

const ParentLayout = () => {
  const navigate = useNavigate();
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

  const handleAcceptLiaison = async (notif) => {
    try {
      const notifData = JSON.parse(notif.data || '{}');
      
      // Mettre à jour professional_id sur l'enfant
      await supabase.from('children')
        .update({ professional_id: notifData.professional_id })
        .eq('id', notifData.child_id);

      // Créer le lien parent-enfant si pas déjà fait
      await supabase.from('parent_child_links').upsert({
        parent_id: user.id,
        child_id: notifData.child_id,
      });

      // Récupérer les infos du pro
      const { data: proProfile } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('id', notifData.professional_id)
        .maybeSingle();

      // Ajouter le pro dans child_professionals
      await supabase.from('child_professionals').upsert({
        child_id: notifData.child_id,
        professional_id: notifData.professional_id,
        professional_name: proProfile ? `${proProfile.first_name} ${proProfile.last_name}` : '',
        profession: proProfile?.profession || '',
        phone: proProfile?.phone || '',
        email: proProfile?.structure_email || '',
        is_on_passerelle: true,
        access_mode: 'full',
      });

      // Marquer la notification comme lue
      await supabase.from('notifications')
        .update({ read: true })
        .eq('id', notif.id);

      await loadNotifications();
      setShowNotifications(false);
    } catch (error) {
      console.error('Erreur acceptation liaison:', error);
    }
  };

  const handleRefuseLiaison = async (notif) => {
    await supabase.from('notifications')
      .update({ read: true })
      .eq('id', notif.id);
    await loadNotifications();
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-md mx-auto min-h-screen bg-stone-50 relative overflow-x-hidden shadow-2xl">
        {/* Header avec cloche */}
        <div className="sticky top-0 z-40 bg-stone-50/80 backdrop-blur-xl border-b border-stone-100 px-5 py-3 flex items-center justify-between">
          <span className="font-heading font-bold text-slate-800 text-lg">Passerelle</span>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl bg-white shadow-card"
          >
            <Bell size={20} className="text-slate-600" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
        </div>

        {/* Panel notifications */}
        {showNotifications && (
          <div className="absolute top-16 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden">
            <div className="p-4 border-b border-stone-100">
              <p className="font-heading font-bold text-slate-800">Notifications</p>
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Aucune notification</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {notifications.map(notif => (
                  <div key={notif.id} className="p-4">
                    <p className="font-heading font-semibold text-sm text-slate-700 mb-1">{notif.title}</p>
                    <p className="text-xs text-slate-500 font-body mb-3">{notif.message}</p>
                    {notif.type === 'liaison_demande' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptLiaison(notif)}
                          style={{backgroundColor: '#16a34a', color: 'white', padding: '8px', borderRadius: '12px', fontWeight: '600', fontSize: '12px', border: 'none', cursor: 'pointer', flex: 1}}
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => handleRefuseLiaison(notif)}
                          className="flex-1 py-2 bg-slate-100 text-slate-600 text-xs font-heading font-semibold rounded-xl"
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
        )}

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
