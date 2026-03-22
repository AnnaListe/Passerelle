import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Receipt, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_CONFIG = {
  'payee': { label: 'Payée', bg: '#E0F2F0', text: '#2E665E', Icon: CheckCircle },
  'en_attente_paiement': { label: 'En attente de règlement', bg: '#FEF3C7', text: '#92400E', Icon: Clock },
  'partiellement_payee': { label: 'Partiellement payée', bg: '#DBEAFE', text: '#1E3A8A', Icon: Receipt },
  'brouillon': { label: 'Brouillon', bg: '#F5F5F4', text: '#57534E', Icon: Receipt },
  'envoye': { label: 'Reçue', bg: '#DBEAFE', text: '#1E3A8A', Icon: Receipt },
};

export default function ParentInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('invoices').select('*').eq('id', id).single()
      .then(({ data }) => setInvoice(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="p-5 space-y-4">
      <div className="h-40 bg-stone-100 rounded-3xl animate-pulse" />
      <div className="h-32 bg-stone-100 rounded-3xl animate-pulse" />
    </div>
  );

  if (!invoice) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-slate-400 font-body">Facture introuvable</p>
    </div>
  );

  const statusCfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG['brouillon'];
  const StatusIcon = statusCfg.Icon;
  const date = invoice.created_at ? format(new Date(invoice.created_at), 'd MMMM yyyy', { locale: fr }) : '';

  return (
    <div className="px-5 pt-5 pb-6 space-y-4">
      <button onClick={() => navigate('/parent/factures')} className="flex items-center gap-2 text-slate-500 font-body text-sm">
        <ArrowLeft size={16} /> Retour
      </button>

      {/* Header */}
      <div className="passerelle-card text-center py-7" style={{ background: `linear-gradient(135deg, ${statusCfg.bg} 0%, white 70%)` }}>
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: statusCfg.bg }}>
          <StatusIcon size={28} style={{ color: statusCfg.text }} />
        </div>
        <p className="font-heading font-bold text-4xl text-slate-800 mb-1">
          {invoice.amount_total?.toFixed(2)} <span className="text-2xl text-slate-400">€</span>
        </p>
        <span className="inline-block text-sm font-heading font-semibold px-4 py-1.5 rounded-full mt-2" style={{ backgroundColor: statusCfg.bg, color: statusCfg.text }}>
          {statusCfg.label}
        </span>
      </div>

      {/* Détails */}
      <div className="passerelle-card">
        <p className="text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-4">Détails</p>
        <div className="space-y-3">
          {[
            { label: 'Numéro', value: invoice.invoice_number || '—' },
            { label: 'Date', value: date },
            { label: 'Montant payé', value: `${invoice.amount_paid?.toFixed(2) || '0.00'} €` },
            { label: 'Reste à payer', value: `${invoice.amount_remaining?.toFixed(2) || invoice.amount_total?.toFixed(2) || '0.00'} €` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2.5 border-b border-stone-50 last:border-0">
              <span className="text-xs text-slate-400 font-body">{label}</span>
              <span className="text-sm font-heading font-semibold text-slate-700">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {invoice.notes && (
        <div className="passerelle-card bg-sage-50 border border-sage-100">
          <p className="text-sm text-sage-700 font-body leading-relaxed">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
