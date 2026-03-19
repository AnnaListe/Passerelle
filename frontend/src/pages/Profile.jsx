import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar } from '../components/ui/avatar';
import { User, Mail, Phone, Briefcase, LogOut, Settings, Building } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Profile = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from('professional_profiles').select('*').eq('id', user.id).maybeSingle();
    if (data) setProfile(data);
  };

  const p = profile || {};

  return (
    <div className="space-y-6 animate-in" data-testid="profile-page">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-outfit mb-2">Mon profil</h1>
        <p className="text-foreground-muted">Vos informations professionnelles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-6 mb-6">
                <Avatar src={p.avatar_url} firstName={p.first_name} lastName={p.last_name} size="xl" className="w-24 h-24 text-2xl" />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-800 mb-1">
                    {p.first_name || '—'} {p.last_name || ''}
                  </h2>
                  <p className="text-foreground-muted">{p.profession || 'Profession non renseignée'}</p>
                  {p.specialty && <p className="text-sm text-slate-600 mt-1">Spécialité : {p.specialty}</p>}
                </div>
              </div>

              {p.description && (
                <div className="mb-6 p-4 bg-background-subtle rounded-xl">
                  <p className="text-sm text-slate-700">{p.description}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-background-subtle rounded-lg">
                  <Mail className="w-5 h-5 text-foreground-muted" />
                  <div>
                    <p className="text-xs text-foreground-muted">Email</p>
                    <p className="text-sm font-medium text-slate-700">{user?.email}</p>
                  </div>
                </div>
                {p.phone && (
                  <div className="flex items-center gap-3 p-3 bg-background-subtle rounded-lg">
                    <Phone className="w-5 h-5 text-foreground-muted" />
                    <div>
                      <p className="text-xs text-foreground-muted">Téléphone</p>
                      <p className="text-sm font-medium text-slate-700">{p.phone}</p>
                    </div>
                  </div>
                )}
                {p.profession && (
                  <div className="flex items-center gap-3 p-3 bg-background-subtle rounded-lg">
                    <Briefcase className="w-5 h-5 text-foreground-muted" />
                    <div>
                      <p className="text-xs text-foreground-muted">Profession</p>
                      <p className="text-sm font-medium text-slate-700">{p.profession}</p>
                    </div>
                  </div>
                )}
                {p.structure_name && (
                  <div className="flex items-center gap-3 p-3 bg-background-subtle rounded-lg">
                    <Building className="w-5 h-5 text-foreground-muted" />
                    <div>
                      <p className="text-xs text-foreground-muted">Structure</p>
                      <p className="text-sm font-medium text-slate-700">{p.structure_name}</p>
                      {p.structure_city && <p className="text-xs text-foreground-muted">{p.structure_city}</p>}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Link to="/profile/settings">
                <Button variant="secondary" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurer mon compte
                </Button>
              </Link>
              <Button variant="danger" className="w-full justify-start" onClick={logout} data-testid="logout-button">
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </Button>
            </CardContent>
          </Card>

          {!profile && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-700 mb-3">Votre profil n'est pas encore configuré.</p>
                <Link to="/profile/settings">
                  <Button size="sm" className="w-full">Configurer maintenant</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;