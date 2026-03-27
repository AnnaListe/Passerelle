import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, Search, X, Users, Phone, Mail, CheckCircle, UserPlus } from 'lucide-react';

const PROFESSIONS = [
  'Orthophoniste', 'Psychomotricien(ne)', 'Ergothérapeute',
  'Psychologue / Neuropsychologue', 'Éducateur(rice) spécialisé(e)',
  'Éducateur(rice) de jeunes enfants', 'Assistant(e) de service social',
  'Infirmier(ère)', 'Médecin', 'Kinésithérapeute', 'ABA Thérapeute',
  'AVS / AESH', 'Ostéopathe', 'Diététicien(ne)', 'Orthoptiste',
  'Sophrologie / Relaxation', 'Art-thérapeute', 'Autre',
];

const PROFESSION_TO_MEDICAL = {
  'Orthophoniste': 'orthophonist',
  'Psychomotricien(ne)': 'psychomotor',
  'Ergothérapeute': 'occupational_therapist',
  'Psychologue / Neuropsychologue': 'psychologist',
  'Kinésithérapeute': 'kinesiotherapist',
};

export default function ParentProfessionals() {
  const { user } = useAuth();
  const [childId, setChildId] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [mode, setMode] = useState(null); // 'search' ou 'manual'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manualForm, setManualForm] = useState({
    professional_name: '',
    profession: '',
    phone: '',
    email: '',
    notes: '',
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const { data: link } = await supabase.from('parent_child_links').select('child_id').eq('parent_id', user.id).maybeSingle();
      if (link?.child_id) {
        setChildId(link.child_id);
        const { data: pros } = await supabase.from('child_professionals').select('*').eq('child_id', link.child_id).order('created_at');
        setProfessionals(pros || []);
      }
    } catch (error) {
      console.error('Error loading professionals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data } = await supabase.from('professional_profiles')
        .select('id, first_name, last_name, profession, specialty, structure_city')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,profession.ilike.%${searchQuery}%`)
        .limit(10);
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearching(false);
    }
  };

  const addProFromPasserelle = async (pro) => {
    if (!childId) return;
    setSaving(true);
    try {
      await supabase.from('child_professionals').insert({
        child_id: childId,
        professional_id: pro.id,
        professional_name: `${pro.first_name} ${pro.last_name}`,
        profession: pro.profession,
        is_on_passerelle: true,
        access_mode: 'complet',
      });
  // Sync avec fiche médicale
  const medicalKey = PROFESSION_TO_MEDICAL[manualForm.profession];
  if (medicalKey) {
    const { data: existing } = await supabase.from('child_medical_profile')
      .select('id').eq('child_id', childId).maybeSingle();
    if (existing) {
      await supabase.from('child_medical_profile').update({
        [`${medicalKey}_active`]: true,
      }).eq('child_id', childId);
    } else {
      await supabase.from('child_medical_profile').insert({
        child_id: childId,
        [`${medicalKey}_active`]: true,
      });
    }
  }

      setShowAdd(false);
      setMode(null);
      setSearchQuery('');
      setSearchResults([]);
      loadData();
    } catch (error) {
      console.error('Error adding pro:', error);
    } finally {
      setSaving(false);
    }
  };

  const addManualPro = async () => {
    if (!manualForm.professional_name || !manualForm.profession) return;
    setSaving(true);
    try {
      await supabase.from('child_professionals').insert({
        child_id: childId,
        professional_name: manualForm.professional_name,
        profession: manualForm.profession,
        phone: manualForm.phone || null,
        email: manualForm.email || null,
        notes: manualForm.notes || null,
        is_on_passerelle: false,
        access_mode: 'lecteur',
      });
      setShowAdd(false);
      setMode(null);
      setManualForm({ professional_name: '', profession: '', phone: '', email: '', notes: '' });
      loadData();
    } catch (error) {
      console.error('Error adding manual pro:', error);
    } finally {
      setSaving(false);
    }
  };
    
  const removePro = async (id) => {
    if (!window.confirm('Retirer ce professionnel ?')) return;
    await supabase.from('child_professionals').delete().eq('id', id);
    loadData();
  };

  if (loading) return (
    <div className="p-5 space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-stone-100 rounded-3xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="px-5 pt-5 pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">L'équipe</h1>
          <p className="text-sm text-slate-400 font-body mt-0.5">{professionals.length} professionnel{professionals.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setShowAdd(true); setMode(null); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full font-heading font-semibold text-sm"
          style={{ backgroundColor: '#4A9B8F', color: 'white' }}>
          <Plus size={15} /> Ajouter
        </button>
      </div>

      {/* Liste des pros */}
      {professionals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-3xl bg-stone-100 flex items-center justify-center mb-4">
            <Users size={28} className="text-slate-300" />
          </div>
          <p className="font-heading font-semibold text-slate-500">Aucun professionnel</p>
          <p className="text-sm text-slate-400 font-body mt-1 mb-4">Ajoutez les professionnels qui suivent votre enfant</p>
          <button onClick={() => { setShowAdd(true); setMode(null); }}
            className="px-5 py-2.5 rounded-full font-heading font-semibold text-sm"
            style={{ backgroundColor: '#4A9B8F', color: 'white' }}>
            Ajouter un professionnel
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {professionals.map(pro => (
            <div key={pro.id} className="passerelle-card">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-heading font-bold text-base flex-shrink-0"
                  style={{ backgroundColor: '#4A9B8F' }}>
                  {pro.professional_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-semibold text-slate-800">{pro.professional_name}</h3>
                    {pro.is_on_passerelle && (
                      <span className="flex items-center gap-1 text-[10px] font-heading font-semibold px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">
                        <CheckCircle size={10} /> Passerelle
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-body text-slate-500 mt-0.5">{pro.profession}</p>
                  {pro.phone && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-body mt-1">
                      <Phone size={11} /> {pro.phone}
                    </div>
                  )}
                  {pro.email && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-body mt-0.5">
                      <Mail size={11} /> {pro.email}
                    </div>
                  )}
                  {!pro.is_on_passerelle && (
                    <span className="text-[10px] font-heading font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-slate-500 mt-1 inline-block">
                      Non inscrit sur Passerelle
                    </span>
                  )}
                </div>
                <button onClick={() => removePro(pro.id)} className="text-slate-300 hover:text-red-400 flex-shrink-0">
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ajout */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[480px] bg-white rounded-3xl p-6">
            {!mode ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-heading font-bold text-lg text-slate-800">Ajouter un professionnel</h3>
                  <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                    <X size={16} className="text-slate-500" />
                  </button>
                </div>
                <div className="space-y-3">
                  <button onClick={() => setMode('search')}
                    className="w-full p-4 rounded-2xl border-2 border-stone-200 hover:border-sage-300 text-left transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sage-50 flex items-center justify-center flex-shrink-0">
                        <Search size={18} className="text-sage-600" />
                      </div>
                      <div>
                        <p className="font-heading font-semibold text-slate-700">Rechercher sur Passerelle</p>
                        <p className="text-xs text-slate-400 font-body mt-0.5">Le pro a déjà un compte Passerelle</p>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => setMode('manual')}
                    className="w-full p-4 rounded-2xl border-2 border-stone-200 hover:border-sage-300 text-left transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <UserPlus size={18} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="font-heading font-semibold text-slate-700">Ajouter manuellement</p>
                        <p className="text-xs text-slate-400 font-body mt-0.5">Le pro n'est pas encore sur Passerelle</p>
                      </div>
                    </div>
                  </button>
                </div>
              </>
            ) : mode === 'search' ? (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <button onClick={() => setMode(null)} className="text-slate-400"><X size={18} /></button>
                  <h3 className="font-heading font-bold text-lg text-slate-800">Rechercher sur Passerelle</h3>
                </div>
                <div className="flex gap-2 mb-4">
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Nom ou profession..."
                    className="flex-1 h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" />
                  <button onClick={handleSearch} disabled={searching}
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#4A9B8F', color: 'white' }}>
                    {searching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={16} />}
                  </button>
                </div>
                {searchResults.length === 0 && searchQuery && !searching && (
                  <p className="text-sm text-slate-400 font-body text-center py-4">Aucun résultat — essayez un autre nom</p>
                )}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map(pro => (
                    <div key={pro.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-heading font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: '#4A9B8F' }}>
                        {pro.first_name?.[0]}{pro.last_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-semibold text-sm text-slate-700">{pro.first_name} {pro.last_name}</p>
                        <p className="text-xs text-slate-400 font-body">{pro.profession} {pro.structure_city ? `· ${pro.structure_city}` : ''}</p>
                      </div>
                      <button onClick={() => addProFromPasserelle(pro)} disabled={saving}
                        className="px-3 py-1.5 rounded-full text-xs font-heading font-semibold"
                        style={{ backgroundColor: '#4A9B8F', color: 'white' }}>
                        Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <button onClick={() => setMode(null)} className="text-slate-400"><X size={18} /></button>
                  <h3 className="font-heading font-bold text-lg text-slate-800">Ajout manuel</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Nom complet *</label>
                    <input type="text" value={manualForm.professional_name} onChange={e => setManualForm(p => ({...p, professional_name: e.target.value}))}
                      placeholder="Dr. Marie Dupont" className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Profession *</label>
                    <select value={manualForm.profession} onChange={e => setManualForm(p => ({...p, profession: e.target.value}))}
                      className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body">
                      <option value="">Sélectionner...</option>
                      {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Téléphone</label>
                    <input type="tel" value={manualForm.phone} onChange={e => setManualForm(p => ({...p, phone: e.target.value}))}
                      placeholder="06 12 34 56 78" className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Email</label>
                    <input type="email" value={manualForm.email} onChange={e => setManualForm(p => ({...p, email: e.target.value}))}
                      placeholder="pro@exemple.fr" className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Notes (optionnel)</label>
                    <textarea value={manualForm.notes} onChange={e => setManualForm(p => ({...p, notes: e.target.value}))}
                      placeholder="Ex: cabinet rue de la Paix, séances le mardi"
                      rows={2} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body resize-none" />
                  </div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-body mt-3">
                  💡 Ce professionnel recevra un accès en mode lecteur. Vous pourrez ajuster ses permissions plus tard.
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setMode(null)}
                    className="flex-1 h-11 bg-stone-100 text-slate-600 rounded-2xl font-heading font-semibold text-sm">
                    Annuler
                  </button>
                  <button onClick={addManualPro} disabled={saving || !manualForm.professional_name || !manualForm.profession}
                    className="flex-1 h-11 rounded-2xl font-heading font-semibold text-sm disabled:opacity-40"
                    style={{ backgroundColor: '#4A9B8F', color: 'white' }}>
                    {saving ? '...' : 'Ajouter'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
