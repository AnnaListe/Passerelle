import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft, MessageCircle, Phone, Mail, Calendar, FileText,
  Receipt, ChevronRight, Plus, Clock, MapPin, Download, X
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const formatTime = (dt) => {
  try { return format(new Date(dt), "HH'h'mm"); } catch { return ''; }
};

const formatDate = (dt) => {
  try { return format(new Date(dt), "d MMM yyyy", { locale: fr }); } catch { return ''; }
};

const APT_COLORS = {
  'seance': { bg: '#E0F2F0', text: '#2E665E', dot: '#4A9B8F' },
  'bilan': { bg: '#DBEAFE', text: '#1E3A8A', dot: '#6B9FD4' },
  'reunion': { bg: '#F3E8FF', text: '#6B21A8', dot: '#A78BCA' },
  'autre': { bg: '#F5F5F4', text: '#57534E', dot: '#94A3B8' },
};



export default function ParentProfessionalDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pro, setPro] = useState(null);
  const [childId, setChildId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddApt, setShowAddApt] = useState(false);
  const [aptForm, setAptForm] = useState({
    title: '',
    appointment_type: 'seance',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    is_recurring: false,
    day_of_week: 'lundi',
    end_date: '',
  });
const [savingApt, setSavingApt] = useState(false);
  const [activeTab, setActiveTab] = useState('planning');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [aptToDelete, setAptToDelete] = useState(null);
  const [showImprevuModal, setShowImprevuModal] = useState(false);
  const [aptImprevu, setAptImprevu] = useState(null);
  const [imprevuForm, setImprevuForm] = useState({ type: 'report', comment: '' });
  const [savingImprevu, setSavingImprevu] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user, id]);

  const loadData = async () => {
    try {
      // Charger le pro depuis child_professionals
      const { data: proData } = await supabase
        .from('child_professionals')
        .select('*')
        .eq('id', id)
        .single();
      setPro(proData);

      // Charger l'enfant lié
      const { data: link } = await supabase
        .from('parent_child_links')
        .select('child_id')
        .eq('parent_id', user.id)
        .maybeSingle();

      if (link?.child_id) {
        setChildId(link.child_id);

        // Charger les RDV de ce pro pour cet enfant
        if (proData?.professional_id) {
          const { data: apts } = await supabase
            .from('appointments')
            .select('*')
            .eq('child_id', link.child_id)
            .eq('professional_id', proData.professional_id)
            .order('start_datetime', { ascending: false })
            .limit(10);
          setAppointments(apts || []);
        } else {
          // Pro non inscrit sur Passerelle — chercher par child_id et created_by parent
          const { data: apts } = await supabase
            .from('appointments')
            .select('*')
            .eq('child_id', link.child_id)
            .eq('created_by', 'parent')
            .order('start_datetime', { ascending: false })
            .limit(10);
          setAppointments(apts || []);
        }

        
        // Charger les RDV de ce pro pour cet enfant
        if (proData?.professional_id) {
          const { data: apts } = await supabase
            .from('appointments')
            .select('*')
            .eq('child_id', link.child_id)
            .eq('professional_id', proData.professional_id)
            .order('start_datetime', { ascending: false })
            .limit(10);
          setAppointments(apts || []);

          // Factures
          const { data: invs } = await supabase
            .from('invoices')
            .select('*')
            .eq('child_id', link.child_id)
            .eq('professional_id', proData.professional_id)
            .order('created_at', { ascending: false });
          setInvoices(invs || []);

          // Contrats
          const { data: cons } = await supabase
            .from('contracts')
            .select('*')
            .eq('child_id', link.child_id)
            .eq('professional_id', proData.professional_id)
            .order('created_at', { ascending: false });
          setContracts(cons || []);
        } else {
          // Pro non inscrit sur Passerelle
          const { data: apts } = await supabase
            .from('appointments')
            .select('*')
            .eq('child_id', link.child_id)
            .eq('created_by', 'parent')
            .order('start_datetime', { ascending: false })
            .limit(10);
          setAppointments(apts || []);
        }

        // Documents
        const { data: docs } = await supabase
          .from('documents')
          .select('*')
          .eq('child_id', link.child_id)
          .order('created_at', { ascending: false });
        setDocuments(docs || []);
      }
    } catch (error) {
      console.error('Error loading pro detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAppointment = async () => {
    console.log('addAppointment called', { childId, aptForm, pro });
    if (!aptForm.date || !aptForm.start_time || !aptForm.end_time || !aptForm.title) return;
    setSavingApt(true);
    try {
      if (aptForm.is_recurring) {
        const dayMap = { lundi:1, mardi:2, mercredi:3, jeudi:4, vendredi:5, samedi:6, dimanche:0 };
        const targetDay = dayMap[aptForm.day_of_week];
        const startDate = new Date(aptForm.date);
        const endDate = aptForm.end_date ? new Date(aptForm.end_date) : new Date(startDate.getFullYear(), startDate.getMonth() + 3, startDate.getDate());
        const recurringId = crypto.randomUUID();
        const aptList = [];
        const current = new Date(startDate);
        let daysToAdd = (targetDay - current.getDay() + 7) % 7;
        current.setDate(current.getDate() + daysToAdd);
        while (current <= endDate) {
          const dateStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}-${String(current.getDate()).padStart(2,'0')}`;
          aptList.push({
            child_id: childId,
            professional_id: pro.professional_id || null,
            title: aptForm.title,
            appointment_type: aptForm.appointment_type,
            start_datetime: `${dateStr}T${aptForm.start_time}:00`,
            end_datetime: `${dateStr}T${aptForm.end_time}:00`,
            location: aptForm.location || null,
            recurring_id: recurringId,
            is_recurring: true,
            status: 'confirme',
            created_by: 'parent',
          });
          current.setDate(current.getDate() + 7);
        }
        await supabase.from('appointments').insert(aptList);
      } else {
        await supabase.from('appointments').insert({
          child_id: childId,
          professional_id: pro.professional_id || null,
          title: aptForm.title,
          appointment_type: aptForm.appointment_type,
          start_datetime: `${aptForm.date}T${aptForm.start_time}:00`,
          end_datetime: `${aptForm.date}T${aptForm.end_time}:00`,
          location: aptForm.location || null,
          is_recurring: false,
          status: 'confirme',
          created_by: 'parent',
        });
      }
      setShowAddApt(false);
      setAptForm({ title: '', appointment_type: 'seance', date: '', start_time: '', end_time: '', location: '', is_recurring: false, day_of_week: 'lundi', end_date: '' });
      loadData();
    } catch (error) {
      console.error('Error adding appointment:', error);
    } finally {
      setSavingApt(false);
    }
  };

  const handleMessage = async () => {
    try {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('parent_id', user.id)
        .eq('child_id', childId)
        .eq('pro_name', pro.professional_name)
        .maybeSingle();

      if (existingConv) {
        navigate(`/parent/messages/${existingConv.id}?from=pro&proId=${id}&proName=${encodeURIComponent(pro.professional_name)}`);
      } else {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            parent_id: user.id,
            child_id: childId,
            pro_name: pro.professional_name,
            last_message_at: new Date().toISOString(),
          })
          .select()
          .single();
        navigate(`/parent/messages/${newConv.id}?from=pro&proId=${id}&proName=${encodeURIComponent(pro.professional_name)}`);
      }
    } catch (error) {
      console.error('Error navigating to messages:', error);
      navigate('/parent/messages');
    }
  };

  if (loading) return (
    <div className="p-5 space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-stone-100 rounded-3xl animate-pulse" />)}
    </div>
  );

  if (!pro) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-slate-400 font-body">Professionnel introuvable</p>
    </div>
  );

  const upcomingApts = appointments.filter(a => new Date(a.start_datetime) >= new Date());
  const pastApts = appointments.filter(a => new Date(a.start_datetime) < new Date());

  const TABS = [
    { key: 'planning', label: 'Planning', count: appointments.length },
    { key: 'documents', label: 'Docs', count: documents.length },
    { key: 'factures', label: 'Factures', count: invoices.length },
  ];

  const deleteAppointment = async (aptId) => {
    await supabase.from('appointments').delete().eq('id', aptId);
    setShowDeleteModal(false);
    setAptToDelete(null);
    loadData();
  };

  const deleteSeries = async (recurringId) => {
    await supabase.from('appointments').delete().eq('recurring_id', recurringId);
    setShowDeleteModal(false);
    setAptToDelete(null);
    loadData();
  };

  const handleImprevu = async () => {
    if (!imprevuForm.comment.trim()) return;
    setSavingImprevu(true);
    try {
      await supabase.from('appointment_requests').insert({
        appointment_id: aptImprevu.id,
        child_id: childId,
        requested_by: 'parent',
        request_type: imprevuForm.type,
        comment: imprevuForm.comment,
        status: 'en_attente',
      });
      setShowImprevuModal(false);
      setAptImprevu(null);
      setImprevuForm({ type: 'report', comment: '' });
      alert('Votre demande a été envoyée au professionnel.');
    } catch (error) {
      console.error('Error sending request:', error);
    } finally {
      setSavingImprevu(false);
    }
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 font-body text-sm mb-4">
          <ArrowLeft size={16} /> Retour
        </button>
     

        {/* Carte pro */}
        <div className="passerelle-card text-center py-6 mb-4"
          style={{ background: 'linear-gradient(135deg, #E0F2F0 0%, white 60%)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-heading font-bold text-2xl mx-auto mb-3 shadow-sage"
            style={{ backgroundColor: '#4A9B8F' }}>
            {pro.professional_name?.[0]}
          </div>
          <h1 className="font-heading font-bold text-xl text-slate-800">{pro.professional_name}</h1>
          <p className="text-sm font-body mt-1" style={{ color: '#4A9B8F' }}>{pro.profession}</p>
          {pro.is_on_passerelle && (
            <span className="inline-block mt-2 text-[10px] font-heading font-semibold px-2.5 py-1 rounded-full bg-sage-100 text-sage-700">
              ✓ Sur Passerelle
            </span>
          )}
          {!pro.is_on_passerelle && (
            <span className="inline-block mt-2 text-[10px] font-heading font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-slate-500">
              Non inscrit sur Passerelle
            </span>
          )}
        </div>

        {/* Boutons actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={handleMessage}
            className="h-11 rounded-2xl font-heading font-semibold text-sm flex items-center justify-center gap-2"
            style={{ backgroundColor: '#4A9B8F', color: 'white' }}>
            <MessageCircle size={16} />
            Message
          </button>
          {pro.phone && (
            <a href={`tel:${pro.phone}`}
              className="h-11 rounded-2xl font-heading font-semibold text-sm flex items-center justify-center gap-2 bg-stone-100 text-slate-700">
              <Phone size={16} />
              Appeler
            </a>
          )}
          {!pro.phone && pro.email && (
            <a href={`mailto:${pro.email}`}
              className="h-11 rounded-2xl font-heading font-semibold text-sm flex items-center justify-center gap-2 bg-stone-100 text-slate-700">
              <Mail size={16} />
              Email
            </a>
          )}
        </div>

        {/* Contact */}
        {(pro.phone || pro.email) && (
          <div className="passerelle-card !p-4 space-y-2 mb-4">
            {pro.phone && (
              <a href={`tel:${pro.phone}`} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sage-50 flex items-center justify-center flex-shrink-0">
                  <Phone size={14} className="text-sage-600" />
                </div>
                <p className="text-sm font-heading font-semibold text-slate-700">{pro.phone}</p>
              </a>
            )}
            {pro.email && (
              <a href={`mailto:${pro.email}`} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sage-50 flex items-center justify-center flex-shrink-0">
                  <Mail size={14} className="text-sage-600" />
                </div>
                <p className="text-sm font-heading font-semibold text-slate-700">{pro.email}</p>
              </a>
            )}
          </div>
        )}

        {/* Notes */}
        {pro.notes && (
          <div className="passerelle-card !p-4 bg-stone-50 mb-4">
            <p className="text-sm text-slate-600 font-body leading-relaxed">{pro.notes}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-5 mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-heading font-semibold border transition-all ${
              activeTab === tab.key
                ? 'text-white border-transparent'
                : 'bg-white text-slate-500 border-stone-200'
            }`}
            style={activeTab === tab.key ? { backgroundColor: '#4A9B8F' } : {}}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Contenu des tabs */}
      <div className="px-5">

       {/* Planning */}
        {activeTab === 'planning' && (
          <div className="space-y-4">
            <button onClick={() => setShowAddApt(true)}
              className="w-full h-11 rounded-2xl font-heading font-semibold text-sm flex items-center justify-center gap-2 mb-2"
              style={{ backgroundColor: '#4A9B8F', color: 'white' }}>
              <Plus size={16} /> Ajouter un rendez-vous
            </button>

            {/* Prochains RDV */}
            {upcomingApts.length > 0 && (
              <div>
                <p className="text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-3">À venir</p>
                <div className="space-y-2">
                  {upcomingApts.map(apt => {
                    const colors = APT_COLORS[apt.appointment_type] || APT_COLORS['autre'];
                    return (
                      <div key={apt.id} className="rounded-2xl p-4 flex items-start gap-3"
                        style={{ backgroundColor: colors.bg }}>
                        <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: colors.dot }} />
                        <div className="flex-1">
                          <p className="font-heading font-semibold text-sm" style={{ color: colors.text }}>{apt.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-xs text-slate-500 font-body">
                              <Calendar size={11} />
                              {formatDate(apt.start_datetime)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 font-body">
                              <Clock size={11} />
                              {formatTime(apt.start_datetime)} – {formatTime(apt.end_datetime)}
                            </div>
                          </div>
                          {apt.location && (
                            <div className="flex items-center gap-1 text-xs text-slate-400 font-body mt-0.5">
                              <MapPin size={11} />
                              {apt.location}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button onClick={() => { setAptImprevu(apt); setShowImprevuModal(true); }}
                            className="text-xs font-heading font-semibold px-2 py-1 rounded-lg bg-orange-50 text-orange-400 border border-orange-100">
                            Imprevu
                          </button>
                          <button onClick={() => { setAptToDelete(apt); setShowDeleteModal(true); }}
                            className="text-slate-300 hover:text-red-400 text-center">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* RDV passés */}
            {pastApts.length > 0 && (
              <div>
                <p className="text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-3">Passés</p>
                <div className="space-y-2">
                  {pastApts.map(apt => {
                    const colors = APT_COLORS[apt.appointment_type] || APT_COLORS['autre'];
                    return (
                      <div key={apt.id} className="rounded-2xl p-4 flex items-start gap-3 opacity-60"
                        style={{ backgroundColor: colors.bg }}>
                        <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: colors.dot }} />
                        <div className="flex-1">
                          <p className="font-heading font-semibold text-sm" style={{ color: colors.text }}>{apt.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-xs text-slate-500 font-body">
                              <Calendar size={11} />
                              {formatDate(apt.start_datetime)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 font-body">
                              <Clock size={11} />
                              {formatTime(apt.start_datetime)} – {formatTime(apt.end_datetime)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            

            {appointments.length === 0 && (
              <div className="text-center py-12">
                <Calendar size={28} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-400 font-body text-sm">Aucun rendez-vous avec ce professionnel</p>
              </div>
            )}
          </div>
        )}

        {/* Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-3">
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={28} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-400 font-body text-sm">Aucun document partagé</p>
              </div>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className="passerelle-card flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sage-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-sage-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-sm text-slate-800 truncate">{doc.title}</p>
                    <p className="text-xs text-slate-400 font-body">{formatDate(doc.created_at)}</p>
                  </div>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noreferrer"
                      className="w-8 h-8 rounded-xl bg-sage-50 flex items-center justify-center text-sage-600 flex-shrink-0">
                      <Download size={14} />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Factures */}
        {activeTab === 'factures' && (
          <div className="space-y-3">
            {/* Contrats actifs */}
            {contracts.filter(c => c.active).length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-2">Contrat actif</p>
                {contracts.filter(c => c.active).map(contract => (
                  <div key={contract.id} className="passerelle-card !p-4 bg-sage-50 border border-sage-100">
                    <p className="font-heading font-semibold text-sm text-slate-700">{contract.label || 'Contrat'}</p>
                    <p className="text-xs text-slate-400 font-body mt-1">
                      {contract.billing_mode === 'par_seance' ? `${contract.session_price}€/séance` : `${contract.hourly_rate}€/h`}
                      {contract.sessions_per_month && ` · ${contract.sessions_per_month} séances/mois`}
                    </p>
                    <p className="text-xs text-slate-400 font-body">Depuis le {formatDate(contract.start_date)}</p>
                  </div>
                ))}
              </div>
            )}

            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <Receipt size={28} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-400 font-body text-sm">Aucune facture de ce professionnel</p>
              </div>
            ) : (
              invoices.map(inv => {
                const statusColors = {
                  'payee': { bg: '#E0F2F0', text: '#2E665E', label: 'Payée' },
                  'en_attente_paiement': { bg: '#FEF3C7', text: '#92400E', label: 'En attente' },
                  'brouillon': { bg: '#F5F5F4', text: '#57534E', label: 'Brouillon' },
                };
                const status = statusColors[inv.status] || statusColors['brouillon'];
                return (
                  <div key={inv.id} onClick={() => navigate(`/parent/factures/${inv.id}`)}
                    className="passerelle-card cursor-pointer flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: status.bg }}>
                      <Receipt size={18} style={{ color: status.text }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-sm text-slate-800">{inv.invoice_number || 'Facture'}</p>
                      <p className="text-xs text-slate-400 font-body">{formatDate(inv.created_at)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-heading font-bold text-sm text-slate-800">{inv.amount_total?.toFixed(2)} €</p>
                      <span className="text-[11px] font-heading font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: status.bg, color: status.text }}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {showImprevuModal && aptImprevu && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] bg-white rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-slate-800">Imprevu</h3>
              <button onClick={() => setShowImprevuModal(false)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-500 font-body mb-4">{aptImprevu.title} — {formatDate(aptImprevu.start_datetime)}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-2">Type de demande</label>
                <div className="flex gap-2">
                  <button onClick={() => setImprevuForm(p => ({...p, type: 'report'}))}
                    className={`flex-1 h-11 rounded-2xl font-heading font-semibold text-sm border-2 transition-all ${imprevuForm.type === 'report' ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-stone-200 text-slate-500'}`}>
                    Report
                  </button>
                  <button onClick={() => setImprevuForm(p => ({...p, type: 'annulation'}))}
                    className={`flex-1 h-11 rounded-2xl font-heading font-semibold text-sm border-2 transition-all ${imprevuForm.type === 'annulation' ? 'border-red-400 bg-red-50 text-red-600' : 'border-stone-200 text-slate-500'}`}>
                    Annulation
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Commentaire *</label>
                <textarea value={imprevuForm.comment} onChange={e => setImprevuForm(p => ({...p, comment: e.target.value}))}
                  placeholder="Expliquez la raison de votre demande..."
                  rows={3} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowImprevuModal(false)}
                className="flex-1 h-11 bg-stone-100 text-slate-600 rounded-2xl font-heading font-semibold text-sm">
                Annuler
              </button>
              <button onClick={handleImprevu} disabled={savingImprevu || !imprevuForm.comment.trim()}
                className="flex-1 h-11 rounded-2xl font-heading font-semibold text-sm disabled:opacity-40"
                style={{ backgroundColor: '#E8967A', color: 'white' }}>
                {savingImprevu ? '...' : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}    

      {showDeleteModal && aptToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[380px] bg-white rounded-3xl p-6">
            <h3 className="font-heading font-bold text-lg text-slate-800 mb-2">Supprimer ce RDV ?</h3>
            <p className="text-sm text-slate-500 font-body mb-5">{aptToDelete.title}</p>
            <div className="space-y-2">
              <button onClick={() => deleteAppointment(aptToDelete.id)}
                className="w-full h-11 bg-red-50 text-red-500 rounded-2xl font-heading font-semibold text-sm border border-red-100">
                Supprimer ce RDV uniquement
              </button>
              {aptToDelete.is_recurring && (
                <button onClick={() => deleteSeries(aptToDelete.recurring_id)}
                  className="w-full h-11 bg-red-500 text-white rounded-2xl font-heading font-semibold text-sm">
                  Supprimer toute la série
                </button>
              )}
              <button onClick={() => { setShowDeleteModal(false); setAptToDelete(null); }}
                className="w-full h-11 bg-stone-100 text-slate-600 rounded-2xl font-heading font-semibold text-sm">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddApt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[480px] bg-white rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-bold text-lg text-slate-800">Nouveau rendez-vous</h3>
              <button onClick={() => setShowAddApt(false)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Titre *</label>
                <input type="text" value={aptForm.title} onChange={e => setAptForm(p => ({...p, title: e.target.value}))}
                  placeholder="Ex: Séance orthophonie" className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" />
              </div>
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Type</label>
                <select value={aptForm.appointment_type} onChange={e => setAptForm(p => ({...p, appointment_type: e.target.value}))}
                  className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body">
                  <option value="seance">Séance</option>
                  <option value="bilan">Bilan</option>
                  <option value="reunion">Réunion</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="flex items-center gap-3 py-2">
                <input type="checkbox" id="recurring" checked={aptForm.is_recurring}
                  onChange={e => setAptForm(p => ({...p, is_recurring: e.target.checked}))}
                  className="w-4 h-4 rounded" />
                <label htmlFor="recurring" className="text-sm font-heading font-semibold text-slate-600">Rendez-vous récurrent</label>
              </div>
              {aptForm.is_recurring ? (
                <>
                  <div>
                    <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Jour de la semaine</label>
                    <select value={aptForm.day_of_week} onChange={e => setAptForm(p => ({...p, day_of_week: e.target.value}))}
                      className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body">
                      {['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'].map(d => (
                        <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Début récurrence</label>
                      <input type="date" value={aptForm.date} onChange={e => setAptForm(p => ({...p, date: e.target.value}))}
                        className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" />
                    </div>
                    <div>
                      <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Fin récurrence</label>
                      <input type="date" value={aptForm.end_date} onChange={e => setAptForm(p => ({...p, end_date: e.target.value}))}
                        className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Date *</label>
                  <input type="date" value={aptForm.date} onChange={e => setAptForm(p => ({...p, date: e.target.value}))}
                    className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Heure début *</label>
                  <input type="time" value={aptForm.start_time} onChange={e => setAptForm(p => ({...p, start_time: e.target.value}))}
                    className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" />
                </div>
                <div>
                  <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Heure fin *</label>
                  <input type="time" value={aptForm.end_time} onChange={e => setAptForm(p => ({...p, end_time: e.target.value}))}
                    className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Lieu</label>
                <input type="text" value={aptForm.location} onChange={e => setAptForm(p => ({...p, location: e.target.value}))}
                  placeholder="Ex: Cabinet rue de la Paix" className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddApt(false)}
                className="flex-1 h-11 bg-stone-100 text-slate-600 rounded-2xl font-heading font-semibold text-sm">
                Annuler
              </button>
              <button onClick={addAppointment} disabled={savingApt || !aptForm.title || !aptForm.date || !aptForm.start_time || !aptForm.end_time}
                className="flex-1 h-11 rounded-2xl font-heading font-semibold text-sm disabled:opacity-40"
                style={{ backgroundColor: '#4A9B8F', color: 'white' }}>
                {savingApt ? '...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}