import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { profileAPI } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';
import { Avatar } from '../components/ui/avatar';
import { User, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfileSettings = () => {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    profession: user?.profession || '',
    specialty: user?.specialty || '',
    phone: user?.phone || '',
    description: user?.description || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      await profileAPI.update(formData);
      
      // Update localStorage
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('professional', JSON.stringify(updatedUser));
      
      setMessage('Profil mis à jour avec succès');
      setEditing(false);
      
      // Refresh page to update context
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      profession: user?.profession || '',
      specialty: user?.specialty || '',
      phone: user?.phone || '',
      description: user?.description || ''
    });
    setEditing(false);
    setMessage('');
  };

  return (
    <div className="space-y-6 animate-in" data-testid="profile-settings">
      {/* Back Button */}
      <Link to="/profile">
        <Button variant="ghost">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au profil
        </Button>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-outfit mb-2">
          Configuration du compte
        </h1>
        <p className="text-foreground-muted">Modifier vos informations professionnelles</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${
          message.includes('succès') 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Informations professionnelles</CardTitle>
                {!editing && (
                  <Button onClick={() => setEditing(true)} data-testid="edit-profile-button">
                    Modifier
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Avatar */}
                <div className="flex justify-center mb-6">
                  <Avatar 
                    src={user?.avatar_url} 
                    firstName={formData.first_name} 
                    lastName={formData.last_name}
                    size="xl"
                    className="w-24 h-24 text-2xl"
                  />
                </div>

                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Prénom *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      disabled={!editing}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      disabled={!editing}
                      required
                    />
                  </div>
                </div>

                {/* Profession & Specialty */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="profession">Profession *</Label>
                    <Input
                      id="profession"
                      value={formData.profession}
                      onChange={(e) => setFormData({...formData, profession: e.target.value})}
                      disabled={!editing}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialty">Spécialité</Label>
                    <Input
                      id="specialty"
                      value={formData.specialty}
                      onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                      disabled={!editing}
                    />
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!editing}
                    placeholder="06 12 34 56 78"
                  />
                </div>

                {/* Email (readonly) */}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email}
                    disabled
                    className="bg-background-subtle"
                  />
                  <p className="text-xs text-foreground-muted mt-1">
                    L'email ne peut pas être modifié
                  </p>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Présentation</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    disabled={!editing}
                    className="w-full bg-input border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-slate-700 outline-none min-h-[120px] disabled:bg-background-subtle disabled:text-foreground-muted"
                    placeholder="Présentez votre parcours, vos approches, vos spécialités..."
                  />
                </div>

                {editing && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="flex-1"
                      data-testid="save-profile-button"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Security */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sécurité du compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Changer le mot de passe
              </Button>
              <Button 
                variant="danger" 
                className="w-full justify-start"
                onClick={logout}
              >
                Se déconnecter
              </Button>
            </CardContent>
          </Card>

          {/* Help */}
          <Card className="bg-gradient-to-br from-primary-light to-white border-primary/20">
            <CardContent className="pt-6">
              <User className="w-12 h-12 text-primary mb-3" />
              <p className="text-sm text-slate-700 mb-3">
                Besoin d'aide pour configurer votre compte ?
              </p>
              <Button variant="secondary" size="sm" className="w-full">
                Centre d'aide
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
