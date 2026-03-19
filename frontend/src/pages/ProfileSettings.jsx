import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';
import { Avatar } from '../components/ui/avatar';
import { User, Save, ArrowLeft, Building, CreditCard, Clock, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const AccordionSection = ({ title, icon: Icon, iconBg, isOpen, onToggle, children }) => (
  <Card className="overflow-hidden">
    <button type="button" onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-background-subtle/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 ${iconBg} rounded-lg`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      </div>
      {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
    </button>
    {isOpen && <CardContent className="border-t border-slate-100 pt-6">{children}</CardContent>}
  </Card>
);

const ProfileSettings = () => {
  const { user, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [openSections, setOpenSections] = useState({ identity: true, structure: false, legal: false, bank: false, horaires: false, media: false });

  const defaultHoraires = DAYS.reduce((acc, day) => ({ ...acc, [day]: { open: false, start: '09:00', end: '18:00' } }), {});

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', profession: '', specialty: '', phone: '', description: '',
    raison_sociale: '', forme_juridique: '', structure_name: '', structure_address: '',
    structure_postal_code: '', structure_city: '', structure_phone: '', structure_email: '',
    siret: '', siren: '', rcs: '', capital_social: '', tva_intracommunautaire: '', code_ape: '',
    banque: '', code_banque: '', numero_compte: '', iban: '', swift_bic: '', code_nan: '', ics: '',
    horaires: defaultHoraires,
    avatar_url: '', signature_url: '', logo_url: '',
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('professional_profiles').select('*').eq('id', user.id).maybeSingle();
    if (data) {
      setFormData(prev => ({
        ...prev,
        ...data,
        horaires: data.horaires || defaultHoraires,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const { error } = await supabase.from('professional_profiles').upsert({
        id: user.id,
        ...formData,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setMessage('Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file, field) => {
    if (!file) return;
    const ext = file.name.split('.').pop();
    const fileName = `${field}-${user.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatar').upload(fileName, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from('avatar').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, [field]: urlData.publicUrl }));
    }
  };

  const toggleSection = (s) => setOpenSections(prev => ({ ...prev, [s]: !prev[s] }));

  const updateHoraire = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      horaires: { ...prev.horaires, [day]: { ...prev.horaires[day], [field]: value } }
    }));
  };

  const f = (field) => ({
    value: formData[field] || '',
    onChange: (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))
  });

  return (
    <div className="space-y-6 animate-in pb-24" data-testid="profile-settings">
      <Link to="/profile">
        <Button variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" />Retour au profil</Button>
      </Link>

      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-outfit mb-2">Configuration du compte</h1>
        <p className="text-foreground-muted">Gérez vos informations professionnelles et légales</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.includes('succès') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* SECTION 1 - Identité */}
        <AccordionSection title="Identité professionnelle" icon={User} iconBg="bg-primary-light text-primary" isOpen={openSections.identity} onToggle={() => toggleSection('identity')}>
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <Avatar src={formData.avatar_url} firstName={formData.first_name} lastName={formData.last_name} size="xl" className="w-24 h-24 text-2xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Prénom *</Label><Input {...f('first_name')} required /></div>
              <div><Label>Nom *</Label><Input {...f('last_name')} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Profession *</Label><Input {...f('profession')} required /></div>
              <div><Label>Spécialité</Label><Input {...f('specialty')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Téléphone</Label><Input type="tel" {...f('phone')} /></div>
              <div><Label>Email</Label><Input type="email" value={user?.email || ''} disabled className="bg-background-subtle" /></div>
            </div>
            <div>
              <Label>Présentation</Label>
              <textarea value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} className="w-full bg-input border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-slate-700 outline-none min-h-[100px]" placeholder="Présentez votre parcours..." />
            </div>
          </div>
        </AccordionSection>

        {/* SECTION 2 - Structure */}
        <AccordionSection title="Informations de la structure" icon={Building} iconBg="bg-blue-50 text-blue-600" isOpen={openSections.structure} onToggle={() => toggleSection('structure')}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Raison sociale</Label><Input {...f('raison_sociale')} /></div>
              <div><Label>Forme juridique</Label><Input {...f('forme_juridique')} placeholder="Ex: Auto-entrepreneur, SASU..." /></div>
            </div>
            <div><Label>Nom de la structure</Label><Input {...f('structure_name')} /></div>
            <div><Label>Adresse</Label><Input {...f('structure_address')} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Code postal</Label><Input {...f('structure_postal_code')} /></div>
              <div><Label>Ville</Label><Input {...f('structure_city')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Téléphone structure</Label><Input type="tel" {...f('structure_phone')} /></div>
              <div><Label>Email structure</Label><Input type="email" {...f('structure_email')} /></div>
            </div>
          </div>
        </AccordionSection>

        {/* SECTION 3 - Légal */}
        <AccordionSection title="Informations légales" icon={Building} iconBg="bg-amber-50 text-amber-600" isOpen={openSections.legal} onToggle={() => toggleSection('legal')}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Numéro SIRET</Label><Input {...f('siret')} /></div>
              <div><Label>Numéro SIREN</Label><Input {...f('siren')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>RCS</Label><Input {...f('rcs')} /></div>
              <div><Label>Capital social</Label><Input {...f('capital_social')} placeholder="Ex: 1000€" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>N° TVA intracommunautaire</Label><Input {...f('tva_intracommunautaire')} /></div>
              <div><Label>Code APE</Label><Input {...f('code_ape')} /></div>
            </div>
          </div>
        </AccordionSection>

        {/* SECTION 4 - Bancaire */}
        <AccordionSection title="Informations bancaires" icon={CreditCard} iconBg="bg-green-50 text-green-600" isOpen={openSections.bank} onToggle={() => toggleSection('bank')}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Banque</Label><Input {...f('banque')} /></div>
              <div><Label>Code banque</Label><Input {...f('code_banque')} /></div>
            </div>
            <div><Label>N° de compte</Label><Input {...f('numero_compte')} /></div>
            <div><Label>IBAN</Label><Input {...f('iban')} placeholder="FR76..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>SWIFT / BIC</Label><Input {...f('swift_bic')} /></div>
              <div><Label>Code NAN</Label><Input {...f('code_nan')} /></div>
            </div>
            <div><Label>Identifiant créancier SEPA (ICS)</Label><Input {...f('ics')} /></div>
          </div>
        </AccordionSection>

        {/* SECTION 5 - Horaires */}
        <AccordionSection title="Horaires d'ouverture" icon={Clock} iconBg="bg-purple-50 text-purple-600" isOpen={openSections.horaires} onToggle={() => toggleSection('horaires')}>
          <div className="space-y-3">
            {DAYS.map(day => (
              <div key={day} className="flex items-center gap-4 p-3 bg-background-subtle rounded-xl">
                <div className="w-24">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.horaires?.[day]?.open || false}
                      onChange={(e) => updateHoraire(day, 'open', e.target.checked)}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span className="text-sm font-medium text-slate-700 capitalize">{day}</span>
                  </label>
                </div>
                {formData.horaires?.[day]?.open && (
                  <div className="flex items-center gap-2 flex-1">
                    <Input type="time" value={formData.horaires[day].start || '09:00'} onChange={(e) => updateHoraire(day, 'start', e.target.value)} className="w-32" />
                    <span className="text-slate-400">—</span>
                    <Input type="time" value={formData.horaires[day].end || '18:00'} onChange={(e) => updateHoraire(day, 'end', e.target.value)} className="w-32" />
                  </div>
                )}
                {!formData.horaires?.[day]?.open && (
                  <span className="text-sm text-foreground-muted italic">Fermé</span>
                )}
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* SECTION 6 - Médias */}
        <AccordionSection title="Logo, signature et avatar" icon={Upload} iconBg="bg-pink-50 text-pink-600" isOpen={openSections.media} onToggle={() => toggleSection('media')}>
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6 p-4 bg-background-subtle rounded-xl">
              <Avatar src={formData.avatar_url} firstName={formData.first_name} lastName={formData.last_name} size="xl" className="w-20 h-20" />
              <div>
                <p className="font-medium text-slate-700 mb-1">Photo de profil</p>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files[0], 'avatar_url')} />
                  <span className="text-sm text-primary underline">Changer la photo</span>
                </label>
              </div>
            </div>

            {/* Logo */}
            <div className="p-4 bg-background-subtle rounded-xl">
              <p className="font-medium text-slate-700 mb-3">Logo de la structure</p>
              {formData.logo_url && <img src={formData.logo_url} alt="Logo" className="h-16 mb-3 object-contain" />}
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-background-subtle">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files[0], 'logo_url')} />
                <Upload className="w-4 h-4" />
                {formData.logo_url ? 'Changer le logo' : 'Uploader un logo'}
              </label>
            </div>

            {/* Signature */}
            <div className="p-4 bg-background-subtle rounded-xl">
              <p className="font-medium text-slate-700 mb-3">Signature</p>
              {formData.signature_url && <img src={formData.signature_url} alt="Signature" className="h-16 mb-3 object-contain border border-slate-200 rounded bg-white p-2" />}
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-background-subtle">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files[0], 'signature_url')} />
                <Upload className="w-4 h-4" />
                {formData.signature_url ? 'Changer la signature' : 'Uploader une signature'}
              </label>
            </div>
          </div>
        </AccordionSection>

        {/* Bouton save fixe */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:pl-72 z-30">
          <div className="max-w-4xl mx-auto flex gap-4">
            <Button type="button" variant="danger" onClick={logout} className="flex-shrink-0">
              Se déconnecter
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer le profil'}
            </Button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default ProfileSettings;
