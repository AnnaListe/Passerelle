import { supabase } from './supabase';

// AUTH
export const authAPI = {
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { data: { token: data.session.access_token, professional: data.user } };
  },
  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return { data: user };
  },
};

// CHILDREN
export const childrenAPI = {
  list: async () => {
    const { data, error } = await supabase.from('children').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return { data };
  },
  detail: async (childId) => {
    const { data, error } = await supabase.from('children').select('*').eq('id', childId).single();
    if (error) throw error;
    return { data: { child: data, schooling: null, weekly_schedule: [], medical_profile: null, communication_profile: null, goals: null, additional_info: null, family_contacts: null, professionals: [], parent: null } };
  },
  create: async (data) => {
    const { data: result, error } = await supabase.from('children').insert([data]).select().single();
    if (error) throw error;
    return { data: result };
  },
  update: async (childId, data) => {
    const { data: result, error } = await supabase.from('children').update(data).eq('id', childId).select().single();
    if (error) throw error;
    return { data: result };
  },
};

// CONTRACTS
export const contractsAPI = {
  list: async (params) => {
    let query = supabase.from('contracts').select('*').order('created_at', { ascending: false });
    if (params?.child_id) query = query.eq('child_id', params.child_id);
    const { data, error } = await query;
    if (error) throw error;
    return { data };
  },
  detail: async (contractId) => {
    const { data, error } = await supabase.from('contracts').select('*').eq('id', contractId).single();
    if (error) throw error;
    return { data };
  },
  create: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: result, error } = await supabase.from('contracts').insert([{ ...data, professional_id: user.id }]).select().single();
    if (error) throw error;
    return { data: result };
  },
  update: async (contractId, data) => {
    const { data: result, error } = await supabase.from('contracts').update(data).eq('id', contractId).select().single();
    if (error) throw error;
    return { data: result };
  },
};

// QUOTES
export const quotesAPI = {
  list: async (params) => {
    let query = supabase.from('quotes').select('*').order('created_at', { ascending: false });
    if (params?.child_id) query = query.eq('child_id', params.child_id);
    const { data, error } = await query;
    if (error) throw error;
    return { data };
  },
  detail: async (quoteId) => {
    const { data, error } = await supabase.from('quotes').select('*').eq('id', quoteId).single();
    if (error) throw error;
    return { data };
  },
  create: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    const quoteNumber = 'DEV-' + Date.now();
    const { data: result, error } = await supabase.from('quotes').insert([{ ...data, professional_id: user.id, quote_number: quoteNumber }]).select().single();
    if (error) throw error;
    return { data: result };
  },
  update: async (quoteId, data) => {
    const { data: result, error } = await supabase.from('quotes').update(data).eq('id', quoteId).select().single();
    if (error) throw error;
    return { data: result };
  },
  updateStatus: async (quoteId, status) => {
    const { data: result, error } = await supabase.from('quotes').update({ status }).eq('id', quoteId).select().single();
    if (error) throw error;
    return { data: result };
  },
  convertToContract: async (quoteId, data) => {
    const quote = (await supabase.from('quotes').select('*').eq('id', quoteId).single()).data;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: result, error } = await supabase.from('contracts').insert([{
      child_id: quote.child_id,
      professional_id: user.id,
      billing_mode: quote.billing_mode,
      session_price: quote.session_price,
      hourly_rate: quote.hourly_rate,
      sessions_per_week: quote.sessions_per_week,
      sessions_per_month: quote.sessions_per_month,
      session_duration_minutes: quote.session_duration_minutes,
      start_date: data.start_date || new Date().toISOString().split('T')[0],
      active: true,
    }]).select().single();
    if (error) throw error;
    await supabase.from('quotes').update({ status: 'accepte', converted_to_contract_id: result.id }).eq('id', quoteId);
    return { data: result };
  },
};

// INVOICES
export const invoicesAPI = {
  list: async (params) => {
    let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (params?.child_id) query = query.eq('child_id', params.child_id);
    const { data, error } = await query;
    if (error) throw error;
    return { data };
  },
  detail: async (invoiceId) => {
    const { data, error } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();
    if (error) throw error;
    return { data };
  },
  updateStatus: async (invoiceId, data) => {
    const { data: result, error } = await supabase.from('invoices').update(data).eq('id', invoiceId).select().single();
    if (error) throw error;
    return { data: result };
  },
  createFromContract: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    const contract = (await supabase.from('contracts').select('*').eq('child_id', data.child_id).eq('active', true).single()).data;
    const appointments = (await supabase.from('appointments').select('*').eq('child_id', data.child_id).gte('start_datetime', data.period_start).lte('start_datetime', data.period_end)).data || [];
    const sessionCount = appointments.filter(a => a.appointment_type === 'seance').length;
    let total = 0;
    if (contract.billing_mode === 'par_seance') {
      total = Math.round(contract.session_price * sessionCount * 100) / 100;
    } else {
      const hours = contract.session_duration_minutes / 60;
      total = Math.round(contract.hourly_rate * hours * sessionCount * 100) / 100;
    }
    const invoiceNumber = 'FAC-' + Date.now();
    const { data: result, error } = await supabase.from('invoices').insert([{
      child_id: data.child_id,
      professional_id: user.id,
      invoice_number: invoiceNumber,
      issue_date: new Date().toISOString().split('T')[0],
      amount_total: total,
      amount_paid: 0,
      status: 'brouillon',
    }]).select().single();
    if (error) throw error;
    return { data: result };
  },
};

// APPOINTMENTS
export const appointmentsAPI = {
  list: async (params) => {
    let query = supabase.from('appointments').select('*').order('start_datetime', { ascending: true });
    if (params?.child_id) query = query.eq('child_id', params.child_id);
    const { data, error } = await query;
    if (error) throw error;
    return { data };
  },
  listByChild: async (childId, params) => {
    let query = supabase.from('appointments').select('*').eq('child_id', childId).order('start_datetime', { ascending: true });
    if (params?.start_date) query = query.gte('start_datetime', params.start_date);
    if (params?.end_date) query = query.lte('start_datetime', params.end_date);
    const { data, error } = await query;
    if (error) throw error;
    return { data };
  },
  create: async (data) => {
    const { data: result, error } = await supabase.from('appointments').insert([data]).select().single();
    if (error) throw error;
    return { data: result };
  },
  update: async (appointmentId, data) => {
    const { data: result, error } = await supabase.from('appointments').update(data).eq('id', appointmentId).select().single();
    if (error) throw error;
    return { data: result };
  },
  delete: async (appointmentId) => {
    const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);
    if (error) throw error;
    return { data: null };
  },
};

// MESSAGES
export const conversationsAPI = {
  list: async () => {
    const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return { data };
  },
  messages: async (conversationId) => {
    const { data, error } = await supabase.from('messages').select('*').eq('child_id', conversationId).order('created_at', { ascending: true });
    if (error) throw error;
    return { data };
  },
  sendMessage: async (conversationId, content) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: result, error } = await supabase.from('messages').insert([{ child_id: conversationId, sender_id: user.id, sender_type: 'professional', content }]).select().single();
    if (error) throw error;
    return { data: result };
  },
};

export const professionalConversationsAPI = {
  list: async () => ({ data: [] }),
  messages: async () => ({ data: [] }),
};

// DOCUMENTS
export const documentsAPI = {
  list: async (params) => {
    let query = supabase.from('documents').select('*').order('uploaded_at', { ascending: false });
    if (params?.child_id) query = query.eq('child_id', params.child_id);
    const { data, error } = await query;
    if (error) throw error;
    return { data };
  },
};

// DASHBOARD
export const dashboardAPI = {
  stats: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const [childrenRes, appointmentsRes, invoicesRes] = await Promise.all([
      supabase.from('children').select('*').limit(5),
      supabase.from('appointments').select('*').gte('start_datetime', new Date().toISOString()).order('start_datetime').limit(5),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(5),
    ]);
    return {
      data: {
        recent_children: childrenRes.data || [],
        upcoming_appointments: appointmentsRes.data || [],
        recent_invoices: invoicesRes.data || [],
        recent_messages: [],
        recent_documents: [],
        pending_invoices_count: (invoicesRes.data || []).filter(i => i.status === 'en_attente_paiement').length,
        overdue_invoices_count: (invoicesRes.data || []).filter(i => i.status === 'impayee').length,
      }
    };
  },
};

// SCHOOL HOLIDAYS
export const schoolHolidaysAPI = {
  list: async () => ({ data: [] }),
};

// PROFILE
export const profileAPI = {
  update: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: result, error } = await supabase.from('professionals').update(data).eq('id', user.id).select().single();
    if (error) throw error;
    return { data: result };
  },
};

export default supabase;