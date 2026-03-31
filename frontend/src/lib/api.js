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
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('children').select('*').eq('professional_id', user.id).or('archived.is.null,archived.eq.false').order('created_at', { ascending: false });
    if (error) throw error;
    const dataWithAge = (data || []).map(child => ({
      ...child,
      age: child.birth_date ? Math.floor((new Date() - new Date(child.birth_date)) / (365.25 * 24 * 60 * 60 * 1000)) : null
    }));
    return { data: dataWithAge };
  },
  detail: async (childId) => {
    const [childRes, schoolingRes, medicalRes, communicationRes, goalsRes, familyRes, additionalRes, scheduleRes] = await Promise.all([
      supabase.from('children').select('*').eq('id', childId).single(),
      supabase.from('child_schooling').select('*').eq('child_id', childId).maybeSingle(),
      supabase.from('child_medical_profile').select('*').eq('child_id', childId).maybeSingle(),
      supabase.from('child_communication_profile').select('*').eq('child_id', childId).maybeSingle(),
      supabase.from('child_goals').select('*').eq('child_id', childId).maybeSingle(),
      supabase.from('child_family_contacts').select('*').eq('child_id', childId).maybeSingle(),
      supabase.from('child_additional_info').select('*').eq('child_id', childId).maybeSingle(),
      supabase.from('child_weekly_schedule').select('*').eq('child_id', childId),
    ]);
    return {
      data: {
        child: childRes.data,
        schooling: schoolingRes.data,
        weekly_schedule: scheduleRes.data || [],
        medical_profile: medicalRes.data,
        communication_profile: communicationRes.data,
        goals: goalsRes.data,
        additional_info: additionalRes.data,
        family_contacts: familyRes.data,
        professionals: [],
        parent: null,
      }
    };
  },
  create: async (payload) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: child, error } = await supabase.from('children').insert([{
      first_name: payload.first_name,
      last_name: payload.last_name,
      birth_date: payload.birth_date,
      address: payload.address,
      housing_type: payload.housing_type,
      own_bedroom: payload.own_bedroom,
      siblings_count: payload.siblings_count,
      parents_separated: payload.parents_separated,
      photo_url: payload.photo_url || null,
      professional_id: user.id,
    }]).select().single();
    if (error) throw error;
    const childId = child.id;
    await Promise.all([
      supabase.from('child_schooling').insert([{ child_id: childId, ...payload.schooling }]),
      supabase.from('child_medical_profile').insert([{ child_id: childId, ...payload.medical_profile }]),
      supabase.from('child_communication_profile').insert([{ child_id: childId, ...payload.communication_profile }]),
      supabase.from('child_goals').insert([{ child_id: childId, ...payload.goals }]),
      supabase.from('child_family_contacts').insert([{ child_id: childId, ...payload.family_contacts }]),
      supabase.from('child_additional_info').insert([{ child_id: childId, ...payload.additional_info }]),
      payload.weekly_schedule?.length > 0
        ? supabase.from('child_weekly_schedule').insert(
            payload.weekly_schedule.map(s => ({ child_id: childId, day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time, label: s.label, category: s.category, location: s.location || null }))
          )
        : Promise.resolve(),
    ]);
    return { data: { id: childId, ...child } };
  },
  update: async (childId, payload) => {
    await supabase.from('children').update({
      first_name: payload.first_name,
      last_name: payload.last_name,
      birth_date: payload.birth_date,
      address: payload.address,
      housing_type: payload.housing_type,
      own_bedroom: payload.own_bedroom,
      siblings_count: payload.siblings_count,
      parents_separated: payload.parents_separated,
      photo_url: payload.photo_url || null,
    }).eq('id', childId);
    await Promise.all([
      supabase.from('child_schooling').upsert([{ child_id: childId, ...payload.schooling }], { onConflict: 'child_id' }),
      supabase.from('child_medical_profile').upsert([{ child_id: childId, ...payload.medical_profile }], { onConflict: 'child_id' }),
      supabase.from('child_communication_profile').upsert([{ child_id: childId, ...payload.communication_profile }], { onConflict: 'child_id' }),
      supabase.from('child_goals').upsert([{ child_id: childId, ...payload.goals }], { onConflict: 'child_id' }),
      supabase.from('child_family_contacts').upsert([{ child_id: childId, ...payload.family_contacts }], { onConflict: 'child_id' }),
      supabase.from('child_additional_info').upsert([{ child_id: childId, ...payload.additional_info }], { onConflict: 'child_id' }),
    ]);
    if (payload.weekly_schedule) {
      await supabase.from('child_weekly_schedule').delete().eq('child_id', childId);
      if (payload.weekly_schedule.length > 0) {
        await supabase.from('child_weekly_schedule').insert(
          payload.weekly_schedule.map(s => ({ child_id: childId, day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time, label: s.label, category: s.category, location: s.location || null }))
        );
      }
    }
    return { data: { id: childId } };
  },
};

// CONTRACTS
export const contractsAPI = {
  list: async (params) => {
    const { data: { user } } = await supabase.auth.getUser();
    let query = supabase.from('contracts').select('*').eq('professional_id', user.id).order('created_at', { ascending: false });
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
    const { data: { user } } = await supabase.auth.getUser();
    let query = supabase.from('quotes').select('*').eq('professional_id', user.id).order('created_at', { ascending: false });
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
    const quoteNumber = 'DEV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const insertData = {
      child_id: data.child_id,
      billing_mode: data.billing_mode,
      validity_days: data.validity_days || 30,
      description: data.description || null,
      professional_id: user.id,
      quote_number: quoteNumber,
      status: 'brouillon',
      estimated_monthly_amount: data.billing_mode === 'par_seance' 
       ? Math.round((data.session_price || 0) * (data.sessions_per_month || 0) * 100) / 100
       : Math.round((data.hourly_rate || 0) * ((data.session_duration_minutes || 0) / 60) * (data.sessions_per_month || 0) * 100) / 100,
      session_price: data.session_price || null,
      sessions_per_month: data.sessions_per_month || null,
      hourly_rate: data.hourly_rate || null,
      sessions_per_week: data.sessions_per_week || null,
      session_duration_minutes: data.session_duration_minutes || null,
    };
    const response = await supabase.from('quotes').insert([insertData]).select().single();
    if (response.error) throw new Error(response.error.message);
    return { data: response.data };
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
    const { data: { user } } = await supabase.auth.getUser();
    let query = supabase.from('invoices').select('*').eq('professional_id', user.id).order('created_at', { ascending: false });
    if (params?.child_id) query = query.eq('child_id', params.child_id);
    const { data, error } = await query;
    if (error) throw error;
    return { data };
  },
  detail: async (invoiceId) => {
    const { data, error } = await supabase.from('invoices').select('*, invoice_lines(*)').eq('id', invoiceId).single();
    if (error) throw error;
    return { data };
  },
  delete: async (invoiceId) => {
    const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
    if (error) throw error;
    // Supprimer aussi les lignes associées
    await supabase.from('invoice_lines').delete().eq('invoice_id', invoiceId);
    return { data: null };
  },
  updateStatus: async (invoiceId, data) => {
    const { data: result, error } = await supabase.from('invoices').update(data).eq('id', invoiceId).select().single();
    if (error) throw error;
    return { data: result };
  },
  createFromContract: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    const contract = (await supabase.from('contracts').select('*').eq('child_id', data.child_id).eq('active', true).single()).data;
    const appointments = (await supabase.from('appointments').select('*').eq('child_id', data.child_id).gte('start_datetime', data.period_start).lte('start_datetime', data.period_end + 'T23:59:59')).data || [];
    const seances = appointments.filter(a => a.appointment_type === 'seance');

    let total = 0;

    if (contract.billing_mode === 'par_seance') {
      // Prix fixe par séance + dépassements
      total = seances.reduce((sum, apt) => {
        const sessionTotal = contract.session_price;
        const overrun = apt.overrun_amount || 0;
        return sum + sessionTotal + overrun;
      }, 0);
    } else {
      // Tarif horaire : calcul sur durée réelle arrondie au quart d'heure
      total = seances.reduce((sum, apt) => {
        const start = new Date(apt.start_datetime);
        const end = new Date(apt.end_datetime);
        const realMinutes = (end - start) / 60000;
        // Arrondi au quart d'heure le plus proche
        const roundedMinutes = Math.round(realMinutes / 15) * 15;
        const sessionAmount = Math.round(contract.hourly_rate * (roundedMinutes / 60) * 100) / 100;
        const overrun = apt.overrun_amount || 0;
        return sum + sessionAmount + overrun;
      }, 0);
    }

    total = Math.round(total * 100) / 100;

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

    // Créer les lignes de facture
    const lines = [];
    if (contract.billing_mode === 'par_seance') {
      seances.forEach(apt => {
        const aptDate = new Date(apt.start_datetime).toISOString().split('T')[0];
        lines.push({
          invoice_id: result.id,
          appointment_id: apt.id,
          description: apt.title,
          date: aptDate,
          unit_price: contract.session_price,
          amount: contract.session_price,
          is_overrun: false,
        });
        if (apt.overrun_amount) {
          lines.push({
            invoice_id: result.id,
            appointment_id: apt.id,
            description: `Dépassement — ${apt.title}`,
            date: aptDate,
            duration_minutes: apt.overrun_minutes || null,
            unit_price: apt.overrun_amount,
            amount: apt.overrun_amount,
            is_overrun: true,
          });
        }
      });
    } else {
      seances.forEach(apt => {
        const start = new Date(apt.start_datetime);
        const end = new Date(apt.end_datetime);
        const realMinutes = (end - start) / 60000;
        const roundedMinutes = Math.round(realMinutes / 15) * 15;
        const sessionAmount = Math.round(contract.hourly_rate * (roundedMinutes / 60) * 100) / 100;
        const aptDate = start.toISOString().split('T')[0];
        lines.push({
          invoice_id: result.id,
          appointment_id: apt.id,
          description: apt.title,
          date: aptDate,
          duration_minutes: roundedMinutes,
          unit_price: contract.hourly_rate,
          amount: sessionAmount,
          is_overrun: false,
        });
        if (apt.overrun_amount) {
          lines.push({
            invoice_id: result.id,
            appointment_id: apt.id,
            description: `Dépassement — ${apt.title}`,
            date: aptDate,
            duration_minutes: apt.overrun_minutes || null,
            unit_price: apt.overrun_amount,
            amount: apt.overrun_amount,
            is_overrun: true,
          });
        }
      });
    }

    if (lines.length > 0) {
      await supabase.from('invoice_lines').insert(lines);
    }

    return { data: result };
    },
};

// APPOINTMENTS
export const appointmentsAPI = {
  list: async (params) => {
    const { data: { user } } = await supabase.auth.getUser();
    let query = supabase.from('appointments').select('*').eq('professional_id', user.id).order('start_datetime', { ascending: true });
    if (params?.child_id) query = query.eq('child_id', params.child_id);
    if (params?.start_date) query = query.gte('start_datetime', params.start_date);
    if (params?.end_date) query = query.lte('start_datetime', params.end_date);
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
    const { data: { user } } = await supabase.auth.getUser();
    const { data: result, error } = await supabase.from('appointments').insert([{ ...data, professional_id: user.id }]).select().single();
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

export const dashboardAPI = {
  stats: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const [childrenRes, appointmentsRes, invoicesRes] = await Promise.all([
      supabase.from('children').select('*').eq('professional_id', user.id).limit(5),
      supabase.from('appointments').select('*').eq('professional_id', user.id).gte('start_datetime', new Date().toISOString()).order('start_datetime').limit(5),
      supabase.from('invoices').select('*').eq('professional_id', user.id).order('created_at', { ascending: false }).limit(5),
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