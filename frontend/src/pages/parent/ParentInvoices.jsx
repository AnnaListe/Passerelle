import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Receipt, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_CONFIG = {
  'payee': { label: 'Payée', bg: '#E0F2F0', text: '#2E665E' },
  'en_attente_paiement': { label: 'En attente', bg: '#FEF3C7', text: '#92400E' },
  'partiellement_payee': { label: 'Partielle', bg: '#DBEAFE', text: '#1E3A8A' },
  'brouillon': { label: 'Brouillon', bg: '#F5F5F4', text: '#57534E' },
  'envoye': { label: 'Reçue', bg: '#DBEAFE', text: '#1E3A8A' },
};

export default function ParentInvoices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const { data: link } = await supabase.from('parent_child_links').select('child_id').eq('parent_id', user.id).maybeSingle();
      if (link?.child_id) {
        const { data: invs } = await supabase.from('invoices').select('*').eq('child_id', link.child_id).order('created_at', { ascending: false });
        setInvoices(invs || []);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const total = invoices.reduce((sum, inv) => sum + (inv.amount_total || 0), 0);
  const unpaid = invoices.filter(i => i.status !== 'payee').reduce((sum, inv) => sum + (inv.amount_total || 0), 0);

  if (loading) return (
    <div className="p-5 space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-stone-100 rounded-3xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="px-5 pt-5 pb-6">
      <div className="mb-5">
        <h1 className="page-title">Factures</h1>
        <p className="text-sm text-slate-400 font-body mt-0.5">{invoices.length} facture{invoices.length > 1 ? 's' : ''}</p>
      </div>

      {invoices.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="passerelle-card !p-4">
            <p className="text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">Total</p>
            <p className="font-heading font-bold text-2xl text-slate-800">{total.toFixed(2)} <span className="text-base text-slate-400">€</span></p>
          </div>
          <div className="passerelle-card !p-4" style={{ backgroundColor: unpaid > 0 ? '#FEF3C7' : '#E0F2F0' }}>
            <p className="text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-1">En attente</p>
            <p className="font-heading font-bold text-2xl" style={{ color: unpaid > 0 ? '#92400E' : '#2E665E' }}>
              {unpaid.toFixed(2)} <span className="text-base opacity-60">€</span>
            </p>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-3xl bg-stone-100 flex items-center justify-center mb-4">
            <Receipt size={28} className="text-slate-300" />
          </div>
          <p className="font-heading font-semibold text-slate-500">Aucune facture</p>
          <p className="text-sm text-slate-400 font-body mt-1">Les factures de vos professionnels apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => {
            const statusCfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG['brouillon'];
            const date = inv.created_at ? format(new Date(inv.created_at), 'd MMM yyyy', { locale: fr }) : '';
            return (
              <div
                key={inv.id}
                onClick={() => navigate(`/parent/factures/${inv.id}`)}
                className="passerelle-card cursor-pointer flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: statusCfg.bg }}>
                  <Receipt size={20} style={{ color: statusCfg.text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-sm text-slate-800">{inv.invoice_number || 'Facture'}</p>
                  <p className="text-xs text-slate-400 font-body mt-0.5">{date}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p className="font-heading font-bold text-base text-slate-800">{inv.amount_total?.toFixed(2)} €</p>
                  <span className="text-[11px] font-heading font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: statusCfg.bg, color: statusCfg.text }}>
                    {statusCfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
