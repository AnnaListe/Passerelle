import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft, MessageCircle, Phone, Mail, Calendar, FileText,
  Receipt, ChevronRight, Plus, Clock, MapPin, Download
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
  const [activeTab, setActiveTab] = useState('planning');

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
    </div>
  );
}
