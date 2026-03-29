import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { FileText, Upload, Plus, X, Download, Users } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CATEGORIES = [
  { key: 'tous', label: 'Tous' },
  { key: 'bilan', label: 'Bilans' },
  { key: 'compte_rendu', label: 'Comptes rendus' },
  { key: 'ordonnance', label: 'Ordonnances' },
  { key: 'administratif', label: 'Administratif' },
  { key: 'mdph', label: 'MDPH' },
  { key: 'autre', label: 'Autre' },
];

const CATEGORY_COLORS = {
  bilan: { bg: '#E0F2F0', text: '#2E665E' },
  compte_rendu: { bg: '#DBEAFE', text: '#1E3A8A' },
  ordonnance: { bg: '#FEF3C7', text: '#92400E' },
  administratif: { bg: '#F3E8FF', text: '#6B21A8' },
  mdph: { bg: '#FEE2D4', text: '#9A3412' },
  attestation_presence: { bg: '#E0F2F0', text: '#2E665E' },
  autre: { bg: '#F5F5F4', text: '#57534E' },
};

export default function ParentDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [category, setCategory] = useState('tous');
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [childId, setChildId] = useState(null);
  const [uploadData, setUploadData] = useState({ title: '', category: 'autre', file: null });
  const [uploading, setUploading] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [docForAccess, setDocForAccess] = useState(null);
  const [linkedPros, setLinkedPros] = useState([]);
  const [selectedPros, setSelectedPros] = useState([]);
  const [savingAccess, setSavingAccess] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [docAccess, setDocAccess] = useState({});
  const fileRef = useRef(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const { data: link } = await supabase.from('parent_child_links').select('child_id').eq('parent_id', user.id).maybeSingle();
      if (link?.child_id) {
        setChildId(link.child_id);
        const { data: docs } = await supabase.from('documents').select('*').eq('child_id', link.child_id).order('created_at', { ascending: false });
        setDocuments(docs || []);

        const { data: pros } = await supabase.from('child_professionals').select('*').eq('child_id', link.child_id);
        setLinkedPros(pros || []);

        if (docs?.length > 0) {
          const { data: access } = await supabase.from('document_access').select('*').in('document_id', docs.map(d => d.id));
          const accessMap = {};
          (access || []).forEach(a => {
            if (!accessMap[a.document_id]) accessMap[a.document_id] = [];
            accessMap[a.document_id].push(a.professional_id || a.professional_name);
          });
          setDocAccess(accessMap);
        }
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadData.title || !uploadData.file) return;
    setUploading(true);
    try {
      const ext = uploadData.file.name.split('.').pop();
      const fileName = `doc-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, uploadData.file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
      await supabase.from('documents').insert({
        child_id: childId,
        title: uploadData.title,
        type: uploadData.category,
        category: uploadData.category,
        file_url: urlData.publicUrl,
        file_name: uploadData.file.name,
        created_at: new Date().toISOString(),
      });
      setShowUpload(false);
      setUploadData({ title: '', category: 'autre', file: null });
      loadData();
    } catch (error) {
      console.error('Error uploading:', error);
    } finally {
      setUploading(false);
    }
  };

  const saveAccess = async () => {
    if (!docForAccess) return;
    setSavingAccess(true);
    try {
      await supabase.from('document_access').delete().eq('document_id', docForAccess.id);
      if (selectedPros.length > 0) {
        await supabase.from('document_access').insert(
          selectedPros.map(proId => {
            const pro = linkedPros.find(p => p.id === proId);
            return {
              document_id: docForAccess.id,
              professional_id: pro?.professional_id || null,
              professional_name: pro?.professional_name,
              granted_by: user.id,
            };
          })
        );
      }
      setShowAccessModal(false);
      setDocForAccess(null);
      setSelectedPros([]);
      loadData();
    } catch (error) {
      console.error('Error saving access:', error);
    } finally {
      setSavingAccess(false);
    }
  };

  const filteredDocs = category === 'tous' ? documents : documents.filter(d => d.category === category || d.type === category);

  if (loading) return (
    <div className="p-5 space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-stone-100 rounded-3xl animate-pulse" />)}
    </div>
  );

  const deleteDocument = async (doc) => {
    if (!window.confirm(`Supprimer "${doc.title}" ?`)) return;
    setDeletingDoc(doc.id);
    try {
      await supabase.from('documents').delete().eq('id', doc.id);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setDeletingDoc(null);
    }
  };

  return (
    <div className="px-5 pt-5 pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="text-sm text-slate-400 font-body mt-0.5">{filteredDocs.length} document{filteredDocs.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full font-heading font-semibold text-sm"
          style={{ backgroundColor: '#4A9B8F', color: 'white' }}>
          <Plus size={15} /> Déposer
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setCategory(cat.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-heading font-semibold border ${category === cat.key ? 'text-white border-transparent' : 'bg-white text-slate-500 border-stone-200'}`}
            style={category === cat.key ? { backgroundColor: '#4A9B8F' } : {}}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Documents */}
      {filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-3xl bg-stone-100 flex items-center justify-center mb-4">
            <FileText size={28} className="text-slate-300" />
          </div>
          <p className="font-heading font-semibold text-slate-500">Aucun document</p>
          <p className="text-sm text-slate-400 font-body mt-1">Déposez vos documents importants ici</p>
          <button onClick={() => setShowUpload(true)} className="mt-4 px-5 py-2.5 rounded-full font-heading font-semibold text-sm"
            style={{ backgroundColor: '#4A9B8F', color: 'white' }}>
            Déposer un document
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map(doc => {
            const colors = CATEGORY_COLORS[doc.category || doc.type] || CATEGORY_COLORS['autre'];
            const date = doc.created_at ? format(new Date(doc.created_at), 'd MMM yyyy', { locale: fr }) : '';
            const accessCount = (docAccess[doc.id] || []).length;
            return (
              <div key={doc.id} className="passerelle-card flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.bg }}>
                  <FileText size={20} style={{ color: colors.text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-sm text-slate-800 leading-tight">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[11px] font-heading font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.bg, color: colors.text }}>
                      {doc.category || doc.type || 'autre'}
                    </span>
                    <span className="text-xs text-slate-400 font-body">{date}</span>
                    {accessCount > 0 && (
                      <span className="text-[11px] font-heading font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
                        {accessCount} pro{accessCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noreferrer"
                      className="w-9 h-9 rounded-xl bg-sage-50 flex items-center justify-center text-sage-600">
                      <Download size={16} />
                    </a>
                  )}
                    <button
                    onClick={() => {
                      setDocForAccess(doc);
                      const existing = docAccess[doc.id] || [];
                      setSelectedPros(linkedPros.filter(p => existing.includes(p.professional_id || p.professional_name)).map(p => p.id));
                      setShowAccessModal(true);
                    }}
                    className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500"
                    title="Gérer les accès">
                    <Users size={14} />
                  </button>
                  <button
                    onClick={() => deleteDocument(doc)}
                    disabled={deletingDoc === doc.id}
                    className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-400"
                    title="Supprimer">
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal accès */}
      {showAccessModal && docForAccess && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[480px] bg-white rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-slate-800">Autoriser l'accès</h3>
              <button onClick={() => setShowAccessModal(false)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-500 font-body mb-4 truncate">{docForAccess.title}</p>
            {linkedPros.length === 0 ? (
              <p className="text-sm text-slate-400 font-body text-center py-4">Aucun professionnel dans l'équipe</p>
            ) : (
              <div className="space-y-2 mb-5">
                {linkedPros.map(pro => (
                  <button key={pro.id}
                    onClick={() => setSelectedPros(prev =>
                      prev.includes(pro.id) ? prev.filter(id => id !== pro.id) : [...prev, pro.id]
                    )}
                    className={`w-full p-3 rounded-2xl border-2 text-left flex items-center gap-3 transition-all ${selectedPros.includes(pro.id) ? 'border-sage-400 bg-sage-50' : 'border-stone-200 bg-white'}`}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-heading font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: '#4A9B8F' }}>
                      {pro.professional_name?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-heading font-semibold text-sm text-slate-700">{pro.professional_name}</p>
                      <p className="text-xs text-slate-400 font-body">{pro.profession}</p>
                    </div>
                    {selectedPros.includes(pro.id) && (
                      <div className="w-5 h-5 rounded-full bg-sage-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowAccessModal(false)}
                className="flex-1 h-11 bg-stone-100 text-slate-600 rounded-2xl font-heading font-semibold text-sm">
                Annuler
              </button>
              <button onClick={saveAccess} disabled={savingAccess}
                className="flex-1 h-11 rounded-2xl font-heading font-semibold text-sm disabled:opacity-40"
                style={{ backgroundColor: '#4A9B8F', color: 'white' }}>
                {savingAccess ? '...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal upload */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[480px] bg-white rounded-3xl p-6 overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-bold text-lg text-slate-800">Déposer un document</h3>
              <button onClick={() => setShowUpload(false)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1.5">Titre *</label>
                <input type="text" value={uploadData.title} onChange={e => setUploadData(p => ({ ...p, title: e.target.value }))}
                  placeholder="Ex : Bilan orthophonique mars 2026"
                  className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" />
              </div>
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1.5">Catégorie</label>
                <select value={uploadData.category} onChange={e => setUploadData(p => ({ ...p, category: e.target.value }))}
                  className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body">
                  {CATEGORIES.filter(c => c.key !== 'tous').map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1.5">Fichier *</label>
                <input ref={fileRef} type="file" className="hidden" onChange={e => setUploadData(p => ({ ...p, file: e.target.files[0] }))} />
                {uploadData.file ? (
                  <div className="flex items-center gap-2 p-3 bg-sage-50 rounded-xl border border-sage-200">
                    <FileText size={16} className="text-sage-600" />
                    <span className="text-sm font-body text-sage-700 flex-1 truncate">{uploadData.file.name}</span>
                    <button onClick={() => setUploadData(p => ({ ...p, file: null }))}><X size={14} className="text-slate-400" /></button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center gap-2 text-slate-400">
                    <Upload size={20} />
                    <span className="text-sm font-heading font-semibold">Sélectionner un fichier</span>
                  </button>
                )}
              </div>
            </div>
            <button onClick={handleUpload} disabled={uploading || !uploadData.title || !uploadData.file}
              className="w-full mt-5 h-12 rounded-2xl font-heading font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#4A9B8F', color: 'white' }}>
              {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={16} />}
              Déposer le document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
