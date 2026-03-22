import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Edit3, Save, X, ChevronDown, ChevronUp, Camera } from 'lucide-react';

const DAYS_FR = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const SCHOOLING_TYPES = [
  { value: 'ordinaire', label: 'Classe ordinaire' },
  { value: 'ordinaire avec AVS', label: 'Classe ordinaire avec AVS/AESH' },
  { value: 'ULIS', label: 'ULIS' },
  { value: 'UEMA', label: 'UEMA' },
  { value: 'UEEA', label: 'UEEA' },
  { value: 'IME', label: 'IME / Institution' },
  { value: 'autre', label: 'Autre' },
];

const TextField = ({ label, value, editValue, editing, onChange, multiline }) => (
  <div className="py-2.5 border-b border-stone-50 last:border-0">
    <p className="text-xs text-slate-400 font-body mb-1">{label}</p>
    {editing ? (
      multiline ? (
        <textarea value={editValue || ''} onChange={e => onChange(e.target.value)} rows={3}
          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body resize-none" />
      ) : (
        <input type="text" value={editValue || ''} onChange={e => onChange(e.target.value)}
          className="w-full h-9 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" />
      )
    ) : (
      <p className="text-sm text-slate-700 font-body">{value || <span className="text-slate-300 italic">Non renseigné</span>}</p>
    )}
  </div>
);

const ToggleField = ({ label, value, editValue, editing, onChange }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-stone-50 last:border-0">
    <span className="text-sm text-slate-600 font-body">{label}</span>
    {editing ? (
      <select value={editValue === undefined ? 'false' : editValue?.toString()} onChange={e => onChange(e.target.value === 'true')}
        className="h-8 px-3 bg-stone-50 border border-stone-200 rounded-lg text-sm font-body">
        <option value="true">Oui</option>
        <option value="false">Non</option>
      </select>
    ) : (
      <span className={`text-xs font-heading font-semibold px-2.5 py-1 rounded-full ${value ? 'bg-sage-100 text-sage-700' : 'bg-stone-100 text-slate-500'}`}>
        {value ? 'Oui' : 'Non'}
      </span>
    )}
  </div>
);

const Section = ({ title, icon, children, defaultOpen = false, editable = true, editing, onEdit, onSave, onCancel, saving }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="passerelle-card">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <h3 className="font-heading font-semibold text-slate-700 text-base">{title}</h3>
        </div>
        {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>
      {open && (
        <div className="mt-4 border-t border-stone-50 pt-2">
          {editable && (
            <div className="flex justify-end mb-3">
              {!editing ? (
                <button onClick={onEdit} className="flex items-center gap-1 text-sage-600 font-heading font-semibold text-sm">
                  <Edit3 size={13} /> Modifier
                </button>
              ) : (
                <div className="flex gap-3">
                  <button onClick={onCancel} className="flex items-center gap-1 text-slate-400 text-sm font-heading font-semibold">
                    <X size={13} /> Annuler
                  </button>
                  <button onClick={onSave} disabled={saving} className="flex items-center gap-1 text-sage-600 font-heading font-semibold text-sm">
                    {saving ? <div className="w-3 h-3 border border-sage-600 border-t-transparent rounded-full animate-spin" /> : <Save size={13} />}
                    Sauvegarder
                  </button>
                </div>
              )}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default function ParentChildProfile() {
  const { user } = useAuth();
  const [child, setChild] = useState(null);
  const [childId, setChildId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Données éditables par section
  const [general, setGeneral] = useState({});
  const [generalEdit, setGeneralEdit] = useState({});
  const [editingGeneral, setEditingGeneral] = useState(false);

  const [schooling, setSchooling] = useState({});
  const [schoolingEdit, setSchoolingEdit] = useState({});
  const [editingSchooling, setEditingSchooling] = useState(false);

  const [medical, setMedical] = useState({});
  const [medicalEdit, setMedicalEdit] = useState({});
  const [editingMedical, setEditingMedical] = useState(false);

  const [communication, setCommunication] = useState({});
  const [communicationEdit, setCommunicationEdit] = useState({});
  const [editingCommunication, setEditingCommunication] = useState(false);

  const [family, setFamily] = useState({});
  const [familyEdit, setFamilyEdit] = useState({});
  const [editingFamily, setEditingFamily] = useState(false);

  const [additionalInfo, setAdditionalInfo] = useState({});
  const [additionalInfoEdit, setAdditionalInfoEdit] = useState({});
  const [editingAdditionalInfo, setEditingAdditionalInfo] = useState(false);

  const [weeklySchedule, setWeeklySchedule] = useState([]);

  const [showCreateChild, setShowCreateChild] = useState(false);
  const [newChild, setNewChild] = useState({ first_name: '', last_name: '', birth_date: '' });
  const [creatingChild, setCreatingChild] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const { data: link } = await supabase.from('parent_child_links').select('child_id').eq('parent_id', user.id).maybeSingle();
      if (!link?.child_id) { setLoading(false); return; }
      setChildId(link.child_id);

      const [childRes, schoolRes, medRes, commRes, familyRes, addRes, schedRes] = await Promise.all([
        supabase.from('children').select('*').eq('id', link.child_id).single(),
        supabase.from('child_schooling').select('*').eq('child_id', link.child_id).maybeSingle(),
        supabase.from('child_medical_profile').select('*').eq('child_id', link.child_id).maybeSingle(),
        supabase.from('child_communication_profile').select('*').eq('child_id', link.child_id).maybeSingle(),
        supabase.from('child_family_contacts').select('*').eq('child_id', link.child_id).maybeSingle(),
        supabase.from('child_additional_info').select('*').eq('child_id', link.child_id).maybeSingle(),
        supabase.from('child_weekly_schedule').select('*').eq('child_id', link.child_id).order('day_of_week'),
      ]);

      setChild(childRes.data);
      setGeneral(childRes.data || {});
      setSchooling(schoolRes.data || {});
      setMedical(medRes.data || {});
      setCommunication(commRes.data || {});
      if (familyRes.data?.parent1_name) {
        setFamily(familyRes.data);
      } else {
        const { data: parentProfile } = await supabase.from('parents').select('*').eq('id', user.id).maybeSingle();
        setFamily({
          ...(familyRes.data || {}),
          parent1_name: parentProfile ? `${parentProfile.first_name} ${parentProfile.last_name}` : '',
          parent1_phone: parentProfile?.phone || '',
          parent1_email: parentProfile?.email || '',
        });
      }
      setAdditionalInfo(addRes.data || {});
      setWeeklySchedule(schedRes.data || []);
    } catch (error) {
      console.error('Error loading child profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAge = (birthDate) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const saveSection = async (section, data, table, setData, setEditing) => {
    setSaving(true);
    try {
      if (section === 'general') {
        await supabase.from('children').update(data).eq('id', childId);
        setChild(prev => ({ ...prev, ...data }));
        setData(prev => ({ ...prev, ...data }));
      } else {
        const existing = await supabase.from(table).select('id').eq('child_id', childId).maybeSingle();
        if (existing.data) {
          await supabase.from(table).update(data).eq('child_id', childId);
        } else {
          await supabase.from(table).insert({ child_id: childId, ...data });
        }
        setData(data);
      }
      setEditing(false);
      setMessage('Enregistré !');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop();
    const fileName = `child-${childId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatar').upload(fileName, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from('avatar').getPublicUrl(fileName);
      await supabase.from('children').update({ photo_url: urlData.publicUrl }).eq('id', childId);
      setChild(prev => ({ ...prev, photo_url: urlData.publicUrl }));
    }
  };

  const createChild = async () => {
    if (!newChild.first_name || !newChild.last_name || !newChild.birth_date) return;
    setCreatingChild(true);
    try {
      const { data: child, error } = await supabase.from('children').insert({
        first_name: newChild.first_name,
        last_name: newChild.last_name,
        birth_date: newChild.birth_date,
      }).select().single();
      if (error) throw error;

      await supabase.from('parent_child_links').insert({
        parent_id: user.id,
        child_id: child.id,
        relationship: 'parent',
      });

      setChildId(child.id);
      setChild(child);
      setGeneral(child);
      setShowCreateChild(false);
      loadData();
    } catch (error) {
      console.error('Error creating child:', error);
    } finally {
      setCreatingChild(false);
    }
  };

  if (loading) return (
    <div className="p-5 space-y-4">
      {[1,2,3,4].map(i => <div key={i} className="h-20 bg-stone-100 rounded-3xl animate-pulse" />)}
    </div>
  );

  if (!childId) return (
    <div className="px-5 pt-5 pb-6">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="font-heading font-semibold text-slate-500 mb-2">Aucun enfant lié</p>
        <p className="text-sm text-slate-400 font-body mb-6">Créez le dossier de votre enfant ou attendez l'invitation d'un professionnel.</p>
        <button onClick={() => setShowCreateChild(true)}
          className="px-6 py-3 bg-sage-500 text-white rounded-full font-heading font-semibold text-sm shadow-sage">
          Créer le dossier de mon enfant
        </button>
      </div>

      {showCreateChild && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="w-full max-w-[480px] bg-white rounded-3xl p-6">
      <h3 className="font-heading font-bold text-lg text-slate-800 mb-4">Dossier de mon enfant</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Prénom *</label>
          <input type="text" value={newChild.first_name} onChange={e => setNewChild(p => ({...p, first_name: e.target.value}))}
            className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" placeholder="Prénom de l'enfant" />
        </div>
        <div>
          <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Nom *</label>
          <input type="text" value={newChild.last_name} onChange={e => setNewChild(p => ({...p, last_name: e.target.value}))}
            className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" placeholder="Nom de l'enfant" />
        </div>
        <div>
          <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Date de naissance *</label>
          <input type="date" value={newChild.birth_date} onChange={e => setNewChild(p => ({...p, birth_date: e.target.value}))}
            className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" />
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={() => setShowCreateChild(false)}
          className="flex-1 h-11 bg-stone-100 text-slate-600 rounded-2xl font-heading font-semibold text-sm">
          Annuler
        </button>
        <button onClick={createChild} disabled={creatingChild || !newChild.first_name || !newChild.last_name || !newChild.birth_date}
          className="flex-1 h-11 bg-sage-500 text-white rounded-2xl font-heading font-semibold text-sm shadow-sage disabled:opacity-40">
          {creatingChild ? '...' : 'Créer le dossier'}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );

    

  return (
    <div className="px-5 pt-5 pb-6 space-y-4">
      {/* Header enfant */}
      <div className="passerelle-card text-center py-6" style={{ background: 'linear-gradient(135deg, #E0F2F0 0%, white 60%)' }}>
        <div className="relative inline-block mb-3">
          {child?.photo_url ? (
            <img src={child.photo_url} alt={child.first_name} className="w-20 h-20 rounded-3xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-sage-500 flex items-center justify-center text-white font-heading font-bold text-2xl mx-auto shadow-sage">
              {child?.first_name?.[0]}
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer border border-stone-100">
            <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e.target.files[0])} />
            <Camera size={12} className="text-slate-500" />
          </label>
        </div>
        <h1 className="font-heading font-bold text-xl text-slate-800">{child?.first_name} {child?.last_name}</h1>
        {child?.birth_date && <p className="text-sm text-slate-400 font-body mt-1">{getAge(child.birth_date)} ans · TSA</p>}
      </div>

      {message && (
        <div className="p-3 bg-sage-50 border border-sage-200 rounded-2xl text-sm text-sage-700 font-heading font-semibold text-center">
          ✓ {message}
        </div>
      )}

      {/* Section 1 — Infos générales */}
      <Section title="Informations générales" icon="👤" defaultOpen
        editing={editingGeneral} onEdit={() => { setGeneralEdit({...general}); setEditingGeneral(true); }}
        onSave={() => saveSection('general', generalEdit, 'children', setGeneral, setEditingGeneral)}
        onCancel={() => setEditingGeneral(false)} saving={saving}>
        <TextField label="Prénom" value={general.first_name} editValue={generalEdit.first_name} editing={editingGeneral} onChange={v => setGeneralEdit(p => ({...p, first_name: v}))} />
        <TextField label="Nom" value={general.last_name} editValue={generalEdit.last_name} editing={editingGeneral} onChange={v => setGeneralEdit(p => ({...p, last_name: v}))} />
        <TextField label="Date de naissance" value={general.birth_date} editValue={generalEdit.birth_date} editing={editingGeneral} onChange={v => setGeneralEdit(p => ({...p, birth_date: v}))} />
        <TextField label="Adresse" value={general.address} editValue={generalEdit.address} editing={editingGeneral} onChange={v => setGeneralEdit(p => ({...p, address: v}))} />
        <div className="py-2.5 border-b border-stone-50">
          <p className="text-xs text-slate-400 font-body mb-1">Type de logement</p>
          {editingGeneral ? (
            <select value={generalEdit.housing_type || 'maison'} onChange={e => setGeneralEdit(p => ({...p, housing_type: e.target.value}))}
              className="w-full h-9 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body">
              <option value="maison">Maison</option>
              <option value="appartement">Appartement</option>
            </select>
          ) : (
            <p className="text-sm text-slate-700 font-body capitalize">{general.housing_type || <span className="text-slate-300 italic">Non renseigné</span>}</p>
          )}
        </div>
        <ToggleField label="Chambre individuelle" value={general.own_bedroom} editValue={generalEdit.own_bedroom} editing={editingGeneral} onChange={v => setGeneralEdit(p => ({...p, own_bedroom: v}))} />
        <TextField label="Nombre de frères/sœurs" value={general.siblings_count?.toString()} editValue={generalEdit.siblings_count?.toString()} editing={editingGeneral} onChange={v => setGeneralEdit(p => ({...p, siblings_count: parseInt(v) || 0}))} />
        <ToggleField label="Parents séparés" value={general.parents_separated} editValue={generalEdit.parents_separated} editing={editingGeneral} onChange={v => setGeneralEdit(p => ({...p, parents_separated: v}))} />
      </Section>

      {/* Section 2 — Scolarité */}
      <Section title="Situation scolaire" icon="🏫"
        editing={editingSchooling} onEdit={() => { setSchoolingEdit({...schooling}); setEditingSchooling(true); }}
        onSave={() => saveSection('schooling', schoolingEdit, 'child_schooling', setSchooling, setEditingSchooling)}
        onCancel={() => setEditingSchooling(false)} saving={saving}>
        <ToggleField label="Scolarisé ou en institution" value={schooling.is_schooled_or_institution} editValue={schoolingEdit.is_schooled_or_institution} editing={editingSchooling} onChange={v => setSchoolingEdit(p => ({...p, is_schooled_or_institution: v}))} />
        <TextField label="Nom de l'établissement" value={schooling.school_name || schooling.institution_name} editValue={schoolingEdit.school_name} editing={editingSchooling} onChange={v => setSchoolingEdit(p => ({...p, school_name: v}))} />
        <div className="py-2.5 border-b border-stone-50">
          <p className="text-xs text-slate-400 font-body mb-1">Type de scolarisation</p>
          {editingSchooling ? (
            <select value={schoolingEdit.schooling_type || ''} onChange={e => setSchoolingEdit(p => ({...p, schooling_type: e.target.value}))}
              className="w-full h-9 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body">
              {SCHOOLING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          ) : (
            <p className="text-sm text-slate-700 font-body">{schooling.schooling_type || <span className="text-slate-300 italic">Non renseigné</span>}</p>
          )}
        </div>
        <TextField label="Description / notes" value={schooling.schooling_description} editValue={schoolingEdit.schooling_description} editing={editingSchooling} onChange={v => setSchoolingEdit(p => ({...p, schooling_description: v}))} multiline />
      </Section>

      {/* Section 2bis — Médical */}
      <Section title="Suivi médical & paramédical" icon="💊"
        editing={editingMedical} onEdit={() => { setMedicalEdit({...medical}); setEditingMedical(true); }}
        onSave={() => saveSection('medical', medicalEdit, 'child_medical_profile', setMedical, setEditingMedical)}
        onCancel={() => setEditingMedical(false)} saving={saving}>
        <ToggleField label="Traitement en cours" value={medical.treatment_active} editValue={medicalEdit.treatment_active} editing={editingMedical} onChange={v => setMedicalEdit(p => ({...p, treatment_active: v}))} />
        {medical.treatment_active && (
          <TextField label="Détail du traitement" value={medical.treatment_details} editValue={medicalEdit.treatment_details} editing={editingMedical} onChange={v => setMedicalEdit(p => ({...p, treatment_details: v}))} multiline />
        )}
        {[
          { key: 'orthophonist', label: 'Orthophoniste' },
          { key: 'psychologist', label: 'Psychologue / Neuropsychologue' },
          { key: 'psychomotor', label: 'Psychomotricien(ne)' },
          { key: 'occupational_therapist', label: 'Ergothérapeute' },
          { key: 'sessad', label: 'SESSAD' },
        ].map(({ key, label }) => (
          <div key={key}>
            <ToggleField label={label} value={medical[`${key}_active`]} editValue={medicalEdit[`${key}_active`]} editing={editingMedical} onChange={v => setMedicalEdit(p => ({...p, [`${key}_active`]: v}))} />
            {medical[`${key}_active`] && (
              <TextField label="Fréquence" value={medical[`${key}_frequency`]} editValue={medicalEdit[`${key}_frequency`]} editing={editingMedical} onChange={v => setMedicalEdit(p => ({...p, [`${key}_frequency`]: v}))} />
            )}
          </div>
        ))}
        <TextField label="Autres professionnels" value={medical.other_professionals} editValue={medicalEdit.other_professionals} editing={editingMedical} onChange={v => setMedicalEdit(p => ({...p, other_professionals: v}))} multiline />
      </Section>

      {/* Section 3 — Communication */}
      <Section title="Communication & profil" icon="💬"
        editing={editingCommunication} onEdit={() => { setCommunicationEdit({...communication}); setEditingCommunication(true); }}
        onSave={() => saveSection('communication', communicationEdit, 'child_communication_profile', setCommunication, setEditingCommunication)}
        onCancel={() => setEditingCommunication(false)} saving={saving}>
        <div className="py-2.5 border-b border-stone-50">
          <p className="text-xs text-slate-400 font-body mb-2">Mode de communication</p>
          {editingCommunication ? (
            <div className="flex gap-2 flex-wrap">
              {['verbal', 'non_verbal', 'alternatif'].map(opt => (
                <button key={opt} onClick={() => setCommunicationEdit(p => ({...p, communication_type: opt}))}
                  className={`px-3 py-1.5 rounded-full text-xs font-heading font-semibold border ${communicationEdit.communication_type === opt ? 'bg-sage-600 text-white border-sage-600' : 'bg-white text-slate-600 border-stone-200'}`}>
                  {opt === 'verbal' ? 'Verbal' : opt === 'non_verbal' ? 'Non verbal' : 'Alternatif'}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-sm font-heading font-semibold px-3 py-1 bg-sage-50 text-sage-700 rounded-full">
              {communication.communication_type === 'verbal' ? 'Verbal' : communication.communication_type === 'non_verbal' ? 'Non verbal' : communication.communication_type ? 'Communication alternative' : <span className="text-slate-300 italic font-body font-normal">Non renseigné</span>}
            </span>
          )}
        </div>
        <TextField label="Moyen de communication alternatif" value={communication.alternative_communication_details} editValue={communicationEdit.alternative_communication_details} editing={editingCommunication} onChange={v => setCommunicationEdit(p => ({...p, alternative_communication_details: v}))} />
        <TextField label="Niveau de compréhension" value={communication.comprehension_level} editValue={communicationEdit.comprehension_level} editing={editingCommunication} onChange={v => setCommunicationEdit(p => ({...p, comprehension_level: v}))} multiline />
      </Section>

      {/* Section 5 — Famille */}
      <Section title="Famille & contacts" icon="👨‍👩‍👦"
        editing={editingFamily} onEdit={() => { setFamilyEdit({...family}); setEditingFamily(true); }}
        onSave={() => saveSection('family', familyEdit, 'child_family_contacts', setFamily, setEditingFamily)}
        onCancel={() => setEditingFamily(false)} saving={saving}>
        <p className="text-xs font-heading font-semibold text-slate-500 mt-2 mb-2">Parent 1</p>
        <TextField label="Nom complet" value={family.parent1_name} editValue={familyEdit.parent1_name} editing={editingFamily} onChange={v => setFamilyEdit(p => ({...p, parent1_name: v}))} />
        <TextField label="Téléphone" value={family.parent1_phone} editValue={familyEdit.parent1_phone} editing={editingFamily} onChange={v => setFamilyEdit(p => ({...p, parent1_phone: v}))} />
        <TextField label="Email" value={family.parent1_email} editValue={familyEdit.parent1_email} editing={editingFamily} onChange={v => setFamilyEdit(p => ({...p, parent1_email: v}))} />
        <p className="text-xs font-heading font-semibold text-slate-500 mt-4 mb-2">Parent 2</p>
        <TextField label="Nom complet" value={family.parent2_name} editValue={familyEdit.parent2_name} editing={editingFamily} onChange={v => setFamilyEdit(p => ({...p, parent2_name: v}))} />
        <TextField label="Téléphone" value={family.parent2_phone} editValue={familyEdit.parent2_phone} editing={editingFamily} onChange={v => setFamilyEdit(p => ({...p, parent2_phone: v}))} />
        <TextField label="Email" value={family.parent2_email} editValue={familyEdit.parent2_email} editing={editingFamily} onChange={v => setFamilyEdit(p => ({...p, parent2_email: v}))} />
      </Section>

      {/* Section 6 — Infos complémentaires */}
      <Section title="Informations complémentaires" icon="📝"
        editing={editingAdditionalInfo} onEdit={() => { setAdditionalInfoEdit({...additionalInfo}); setEditingAdditionalInfo(true); }}
        onSave={() => saveSection('additional', additionalInfoEdit, 'child_additional_info', setAdditionalInfo, setEditingAdditionalInfo)}
        onCancel={() => setEditingAdditionalInfo(false)} saving={saving}>
        <TextField label="Intérêts & centres d'intérêt" value={additionalInfo.interests} editValue={additionalInfoEdit.interests} editing={editingAdditionalInfo} onChange={v => setAdditionalInfoEdit(p => ({...p, interests: v}))} multiline />
        <TextField label="Passions" value={additionalInfo.passions} editValue={additionalInfoEdit.passions} editing={editingAdditionalInfo} onChange={v => setAdditionalInfoEdit(p => ({...p, passions: v}))} multiline />
        <TextField label="Personnage préféré" value={additionalInfo.favorite_character} editValue={additionalInfoEdit.favorite_character} editing={editingAdditionalInfo} onChange={v => setAdditionalInfoEdit(p => ({...p, favorite_character: v}))} />
        <TextField label="Alimentation / allergies" value={additionalInfo.allergies} editValue={additionalInfoEdit.allergies} editing={editingAdditionalInfo} onChange={v => setAdditionalInfoEdit(p => ({...p, allergies: v}))} multiline />
        <TextField label="Habitudes / rituels" value={additionalInfo.habits} editValue={additionalInfoEdit.habits} editing={editingAdditionalInfo} onChange={v => setAdditionalInfoEdit(p => ({...p, habits: v}))} multiline />
        <TextField label="Notes libres" value={additionalInfo.free_notes} editValue={additionalInfoEdit.free_notes} editing={editingAdditionalInfo} onChange={v => setAdditionalInfoEdit(p => ({...p, free_notes: v}))} multiline />
      </Section>

      <div className="h-4" />
    </div>
  );
}
