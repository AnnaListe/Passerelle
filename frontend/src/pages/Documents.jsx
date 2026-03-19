import React, { useState, useEffect, useRef } from 'react';
import { documentsAPI, childrenAPI } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';
import { Avatar } from '../components/ui/avatar';
import { FileText, Download, Calendar, Plus, X, Printer, ClipboardList, Trash2 } from 'lucide-react';
import { formatDateTime } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAttestation, setShowAttestation] = useState(false);
  const [showAttestationPreview, setShowAttestationPreview] = useState(false);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedApts, setSelectedApts] = useState([]);
  const [attestationData, setAttestationData] = useState({
    start_date: '',
    end_date: '',
    lieu: '',
    date_attestation: new Date().toISOString().split('T')[0],
    note: '',
  });
  const printRef = useRef(null);

  useEffect(() => {
    loadData();
    loadProfile();
  }, []);

  const loadData = async () => {
    try {
      const [docsRes, childrenRes] = await Promise.all([
        documentsAPI.list().catch(() => ({ data: [] })),
        childrenAPI.list()
      ]);
      setDocuments(docsRes.data || []);
      setChildren(childrenRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    const { data } = await supabase.from('professional_profiles').select('*').eq('id', user.id).maybeSingle();
    if (data) setProfile(data);
  };

  const loadAppointmentsForPeriod = async (childId, startDate, endDate) => {
    if (!childId || !startDate || !endDate) return;
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('child_id', childId)
      .gte('start_datetime', new Date(startDate).toISOString())
      .lte('start_datetime', new Date(endDate + 'T23:59:59').toISOString())
      .order('start_datetime', { ascending: true });
    setAppointments(data || []);
    setSelectedApts((data || []).map(a => a.id));
  };

  const getCategoryVariant = (category) => {
    const variants = { 'bilan': 'info', 'compte_rendu': 'success', 'ordonnance': 'warning', 'document_administratif': 'default', 'justificatif': 'pending', 'document_seance': 'active', 'autre': 'default' };
    return variants[category] || 'default';
  };

  const getCategoryLabel = (category) => {
    const labels = { 'bilan': 'Bilan', 'compte_rendu': 'Compte rendu', 'ordonnance': 'Ordonnance', 'document_administratif': 'Document administratif', 'justificatif': 'Justificatif', 'document_seance': 'Document de séance', 'autre': 'Autre' };
    return labels[category] || category;
  };

  const formatDateFr = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTimeFr = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const handlePrint = () => {
  const printContent = printRef.current.innerHTML;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html><head><title>Attestation de présence</title>
    <style>body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #333; padding: 40px; }</style>
    </head><body>${printContent}</body></html>
  `);
  printWindow.document.close();
  printWindow.print();
};

const handleSaveAttestation = async () => {
  try {
    await supabase.from('documents').insert({
      child_id: selectedChild.id,
      type: 'attestation_presence',
      title: `Attestation de présence — ${selectedChild.first_name} ${selectedChild.last_name} — ${new Date(attestationData.date_attestation).toLocaleDateString('fr-FR')}`,
      content: {
        profile,
        parentInfo,
        attestationData,
        appointments: selectedAptObjects,
        child: selectedChild,
      },
      created_at: new Date().toISOString(),
    });
    setShowAttestationPreview(false);
    setShowAttestation(false);
    await loadData();
    alert('Attestation enregistrée !');
  } catch (error) {
    console.error('Error saving attestation:', error);
    alert('Erreur lors de l\'enregistrement');
  }
};

  const getDocumentsByChild = () => {
    const grouped = {};
    children.forEach(child => {
      grouped[child.id] = { child, documents: documents.filter(doc => doc.child_id === child.id) };
    });
    return grouped;
  };

  const documentsByChild = getDocumentsByChild();
  const selectedAptObjects = appointments.filter(a => selectedApts.includes(a.id));
  const child = selectedChild;
  const parent1 = null; // sera chargé depuis child_family_contacts

  // Données pour l'attestation
  const [parentInfo, setParentInfo] = useState({ name: '', address: '', city: '' });

  const loadParentInfo = async (childId) => {
    const { data } = await supabase.from('child_family_contacts').select('*').eq('child_id', childId).maybeSingle();
    if (data) {
      setParentInfo({
        name: data.parent1_name || '',
        address: '',
        city: attestationData.lieu || '',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Vue liste enfants
  if (!selectedChild) {
    return (
      <div className="space-y-6 animate-in" data-testid="documents-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-outfit mb-2">Documents</h1>
            <p className="text-foreground-muted">Organisés par enfant</p>
          </div>
        </div>

        <div className="space-y-4">
          {children.map((child) => {
            const childDocs = documentsByChild[child.id]?.documents || [];
            return (
              <Card key={child.id} interactive onClick={() => setSelectedChild(child)} data-testid={`child-documents-${child.id}`}>
                <div className="flex items-start gap-4">
                  <Avatar src={child.photo_url} firstName={child.first_name} lastName={child.last_name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-1">{child.first_name} {child.last_name}</h3>
                        <p className="text-sm text-foreground-muted">{child.age} ans</p>
                      </div>
                      <Badge variant="info">{childDocs.length} document{childDocs.length > 1 ? 's' : ''}</Badge>
                    </div>
                    {childDocs.length > 0 ? (
                      <div className="space-y-2">
                        {childDocs.slice(0, 3).map((doc) => (
                          <div key={doc.id} className="flex items-center gap-3 p-2 bg-background-subtle rounded-lg text-sm">
                            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="flex-1 truncate font-medium text-slate-700">{doc.title}</span>
                            <Badge variant={getCategoryVariant(doc.category)} className="text-xs">{getCategoryLabel(doc.category)}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-foreground-muted italic">Aucun document</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {children.length === 0 && (
          <Card className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-foreground-muted">Aucun enfant</p>
          </Card>
        )}
      </div>
    );
  }

  // Vue documents enfant
  const childDocs = documentsByChild[selectedChild.id]?.documents || [];

  return (
    <div className="space-y-6 animate-in" data-testid="child-documents-detail">
      <Button variant="ghost" onClick={() => setSelectedChild(null)}>← Retour à la liste</Button>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={selectedChild.photo_url} firstName={selectedChild.first_name} lastName={selectedChild.last_name} size="xl" />
          <div>
            <h1 className="text-3xl font-bold text-slate-800 font-outfit mb-1">Documents de {selectedChild.first_name}</h1>
            <p className="text-foreground-muted">{childDocs.length} document{childDocs.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setShowAttestation(true); loadParentInfo(selectedChild.id); }}>
            <ClipboardList className="w-4 h-4 mr-2" />
            Attestation de présence
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un document
          </Button>
        </div>
      </div>

      {childDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {childDocs.map((doc) => (
            <Card key={doc.id} interactive onClick={() => {
              if (doc.type === 'attestation_presence' && doc.content) {
                setProfile(doc.content.profile);
                setParentInfo(doc.content.parentInfo);
                setAttestationData(doc.content.attestationData);
                setSelectedApts(doc.content.appointments.map(a => a.id));
                setAppointments(doc.content.appointments);
                setShowAttestationPreview(true);
              }
            }}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-light rounded-lg flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-700 mb-2">{doc.title}</p>
                  <Badge variant={getCategoryVariant(doc.category)} className="mb-2">{getCategoryLabel(doc.category)}</Badge>
                </div>
              </div>
            <div className="flex justify-end mt-3 pt-3 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Supprimer ce document ?')) {
                      supabase.from('documents').delete().eq('id', doc.id).then(() => loadData());
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-foreground-muted mb-4">Aucun document pour {selectedChild.first_name}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => { setShowAttestation(true); loadParentInfo(selectedChild.id); }}>
              <ClipboardList className="w-4 h-4 mr-2" />
              Générer une attestation
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter le premier document
            </Button>
          </div>
        </Card>
      )}

      {/* Modal configuration attestation */}
      {showAttestation && !showAttestationPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="max-w-lg w-full my-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Attestation de présence</CardTitle>
                <button onClick={() => setShowAttestation(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date de début *</Label>
                  <Input type="date" value={attestationData.start_date} onChange={(e) => { setAttestationData({...attestationData, start_date: e.target.value}); if (attestationData.end_date) loadAppointmentsForPeriod(selectedChild.id, e.target.value, attestationData.end_date); }} required />
                </div>
                <div>
                  <Label>Date de fin *</Label>
                  <Input type="date" value={attestationData.end_date} onChange={(e) => { setAttestationData({...attestationData, end_date: e.target.value}); if (attestationData.start_date) loadAppointmentsForPeriod(selectedChild.id, attestationData.start_date, e.target.value); }} required />
                </div>
              </div>

              {appointments.length > 0 && (
                <div>
                  <Label>Séances à inclure ({selectedApts.length}/{appointments.length} sélectionnées)</Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {appointments.map(apt => (
                      <label key={apt.id} className="flex items-center gap-3 p-2 bg-background-subtle rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedApts.includes(apt.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedApts([...selectedApts, apt.id]);
                            else setSelectedApts(selectedApts.filter(id => id !== apt.id));
                          }}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="text-sm text-slate-700">
                          {formatDateFr(apt.start_datetime)} — {formatTimeFr(apt.start_datetime)} à {formatTimeFr(apt.end_datetime)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {attestationData.start_date && attestationData.end_date && appointments.length === 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                  Aucune séance trouvée sur cette période.
                </div>
              )}

              <div>
                <Label>Nom du parent *</Label>
                <Input value={parentInfo.name} onChange={(e) => setParentInfo({...parentInfo, name: e.target.value})} placeholder="Ex: Madame Sophie Martin" />
              </div>

              <div>
                <Label>Fait à (ville) *</Label>
                <Input value={attestationData.lieu} onChange={(e) => setAttestationData({...attestationData, lieu: e.target.value})} placeholder="Ex: Metz" />
              </div>

              <div>
                <Label>Date de l'attestation</Label>
                <Input type="date" value={attestationData.date_attestation} onChange={(e) => setAttestationData({...attestationData, date_attestation: e.target.value})} />
              </div>

              <div>
                <Label>Note complémentaire (optionnel)</Label>
                <textarea value={attestationData.note} onChange={(e) => setAttestationData({...attestationData, note: e.target.value})} className="w-full bg-input border-transparent focus:bg-white focus:border-primary rounded-xl px-4 py-3 text-slate-700 outline-none min-h-[60px]" placeholder="Ex: La présence du parent était nécessaire..." />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAttestation(false)}>Annuler</Button>
                <Button
                  className="flex-1"
                  disabled={!attestationData.lieu || !parentInfo.name}
                  onClick={() => setShowAttestationPreview(true)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Aperçu & Imprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Aperçu attestation */}
      {showAttestationPreview && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto p-4">
          <div className="w-full max-w-2xl mx-auto my-8">
            {/* Boutons actions */}
            <div className="flex flex-wrap gap-3 mb-4 no-print" style={{position: 'relative', zIndex: 9999}}>
              <Button variant="outline" onClick={() => { setShowAttestationPreview(false); setShowAttestation(true); }} className="bg-white text-slate-700">
                ← Modifier
              </Button>
              <Button onClick={handlePrint} className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Imprimer / PDF
              </Button>
              <Button variant="secondary" onClick={handleSaveAttestation}>
                Enregistrer
              </Button>
              <Button variant="outline" className="bg-white text-slate-700" onClick={() => alert('Envoi au parent disponible quand l\'univers Parent sera actif')}>
                📧 Envoyer au parent
              </Button>
              <button onClick={() => { setShowAttestationPreview(false); setShowAttestation(false); }} className="p-2 text-white hover:text-white/70">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document attestation */}
            <div ref={printRef} className="bg-white p-10 rounded-xl shadow-xl print-area" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', lineHeight: '1.6', color: '#333' }}>

              {/* En-tête pro */}
              <div className="mb-8" style={{ borderBottom: '2px solid #333', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    {profile?.logo_url && <img src={profile.logo_url} alt="Logo" style={{ height: '50px', marginBottom: '8px' }} />}
                    <p style={{ fontWeight: 'bold', fontSize: '14px' }}>{profile?.structure_name || profile?.raison_sociale || `${profile?.first_name} ${profile?.last_name}`}</p>
                    <p>{profile?.profession}</p>
                    {profile?.structure_address && <p>{profile.structure_address}</p>}
                    {profile?.structure_postal_code && <p>{profile.structure_postal_code} {profile.structure_city}</p>}
                    {profile?.siret && <p>SIRET : {profile.siret}</p>}
                    {profile?.structure_email && <p>Email : {profile.structure_email}</p>}
                    {profile?.structure_phone && <p>Tél : {profile.structure_phone}</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p>Date : {new Date(attestationData.date_attestation).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>

              {/* Destinataire */}
              <div style={{ marginBottom: '24px' }}>
                <p><strong>Client :</strong> {parentInfo.name}</p>
              </div>

              {/* Titre */}
              <div style={{ textAlign: 'center', margin: '24px 0' }}>
                <p style={{ fontSize: '16px', fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  ATTESTATION DE PRÉSENCE
                </p>
              </div>

              {/* Corps */}
              <div style={{ marginBottom: '24px', lineHeight: '1.8' }}>
                <p>
                  Je soussigné(e) <strong>{profile?.first_name} {profile?.last_name}</strong>, {profile?.profession}{profile?.specialty ? `, ${profile.specialty}` : ''}, atteste être intervenu(e) auprès de :
                </p>
                <p style={{ margin: '12px 0' }}>
                  <strong>{parentInfo.name}</strong>, parent de l'enfant <strong>{selectedChild?.first_name} {selectedChild?.last_name}</strong>
                </p>

                {/* Liste des séances */}
                <div style={{ margin: '16px 0' }}>
                  {selectedAptObjects.map((apt, i) => (
                    <p key={apt.id} style={{ margin: '4px 0' }}>
                      * {formatDateFr(apt.start_datetime)}, de {formatTimeFr(apt.start_datetime)} à {formatTimeFr(apt.end_datetime)}
                      {apt.location ? ` — ${apt.location}` : ''}
                    </p>
                  ))}
                </div>

                {attestationData.note && (
                  <p style={{ margin: '12px 0' }}>{attestationData.note}</p>
                )}

                <p style={{ marginTop: '16px' }}>
                  Cette attestation est délivrée à la demande de l'intéressé(e) pour faire valoir ce que de droit.
                </p>
              </div>

              {/* Signature */}
              <div style={{ marginTop: '40px' }}>
                <p>Fait à {attestationData.lieu}, le {new Date(attestationData.date_attestation).toLocaleDateString('fr-FR')}.</p>
                <div style={{ marginTop: '24px' }}>
                  <p><strong>{profile?.first_name} {profile?.last_name}</strong></p>
                  <p>{profile?.profession}{profile?.specialty ? ` — ${profile.specialty}` : ''}</p>
                  {profile?.signature_url && (
                    <img src={profile.signature_url} alt="Signature" style={{ height: '60px', marginTop: '8px' }} />
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CSS impression */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .print-area { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Documents;
