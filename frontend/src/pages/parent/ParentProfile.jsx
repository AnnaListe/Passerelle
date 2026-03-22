import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LogOut, Edit3, Save, X } from 'lucide-react';

export default function ParentProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [parent, setParent] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from('parents').select('*').eq('id', user.id).maybeSingle();
    if (data) { setParent(data); setForm(data); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from('parents').update({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        relationship_to_child: form.relationship_to_child,
      }).eq('id', user.id);
      setParent(prev => ({ ...prev, ...form }));
      setEditing(false);
      setMessage('Profil mis à jour !');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/accueil');
  };

  const src = editing ? form : parent;

  return (
    <div className="px-5 pt-5 pb-6 space-y-4">
      {/* Avatar */}
      <div className="passerelle-card text-center py-8" style={{ background: 'linear-gradient(135deg, #E0F2F0 0%, white 60%)' }}>
        <div className="w-20 h-20 rounded-3xl bg-sage-500 flex items-center justify-center text-white font-heading font-bold text-2xl mx-auto mb-4 shadow-sage">
          {parent?.first_name?.[0]}{parent?.last_name?.[0]}
        </div>
        <h1 className="font-heading font-bold text-xl text-slate-800">{parent?.first_name} {parent?.last_name}</h1>
        <p className="text-sm text-slate-400 font-body mt-1">{user?.email}</p>
      </div>

      {message && (
        <div className="p-3 bg-sage-50 border border-sage-200 rounded-2xl text-sm text-sage-700 font-heading font-semibold text-center">
          ✓ {message}
        </div>
      )}

      {/* Infos */}
      <div className="passerelle-card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-heading font-bold uppercase tracking-widest text-slate-400">Mes informations</p>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-sage-600 font-heading font-semibold text-sm">
              <Edit3 size={13} /> Modifier
            </button>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-slate-400 text-sm font-heading font-semibold">
                <X size={13} /> Annuler
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-sage-600 font-heading font-semibold text-sm">
                {saving ? <div className="w-3 h-3 border border-sage-600 border-t-transparent rounded-full animate-spin" /> : <Save size={13} />}
                Sauvegarder
              </button>
            </div>
          )}
        </div>

        {[
          { key: 'first_name', label: 'Prénom' },
          { key: 'last_name', label: 'Nom' },
          { key: 'phone', label: 'Téléphone' },
          { key: 'relationship_to_child', label: 'Lien avec l\'enfant', placeholder: 'Ex: Maman, Papa, Tuteur...' },
        ].map(({ key, label, placeholder }) => (
          <div key={key} className="py-3 border-b border-stone-50 last:border-0">
            <p className="text-xs text-slate-400 font-body mb-1">{label}</p>
            {editing ? (
              <input type="text" value={form[key] || ''} onChange={e => setForm(p => ({...p, [key]: e.target.value}))}
                placeholder={placeholder}
                className="w-full h-9 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" />
            ) : (
              <p className="text-sm font-heading font-semibold text-slate-700">
                {src?.[key] || <span className="text-slate-300 italic font-body font-normal">Non renseigné</span>}
              </p>
            )}
          </div>
        ))}

        {/* Email readonly */}
        <div className="py-3">
          <p className="text-xs text-slate-400 font-body mb-1">Email</p>
          <p className="text-sm font-heading font-semibold text-slate-700">{user?.email}</p>
        </div>
      </div>

      {/* Déconnexion */}
      <button onClick={handleLogout}
        className="w-full h-12 border-2 border-red-100 text-red-400 rounded-2xl font-heading font-semibold flex items-center justify-center gap-2 hover:bg-red-50">
        <LogOut size={16} />
        Se déconnecter
      </button>
    </div>
  );
}
