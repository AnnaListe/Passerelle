import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar } from '../components/ui/avatar';
import { User, Mail, Phone, Briefcase, LogOut, Settings } from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 animate-in" data-testid="profile-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-outfit mb-2">
          Mon profil
        </h1>
        <p className="text-foreground-muted">Vos informations professionnelles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-6 mb-6">
                <Avatar 
                  src={user?.avatar_url} 
                  firstName={user?.first_name} 
                  lastName={user?.last_name}
                  size="xl"
                  className="w-24 h-24 text-2xl"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-800 mb-1">
                    {user?.first_name} {user?.last_name}
                  </h2>
                  <p className="text-foreground-muted mb-4">{user?.profession}</p>
                  {user?.specialty && (
                    <p className="text-sm text-slate-600">
                      Spécialité: {user?.specialty}
                    </p>
                  )}
                </div>
              </div>

              {user?.description && (
                <div className="mb-6 p-4 bg-background-subtle rounded-xl">
                  <p className="text-sm text-slate-700">{user.description}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-background-subtle rounded-lg">
                  <Mail className="w-5 h-5 text-foreground-muted" />
                  <div>
                    <p className="text-xs text-foreground-muted">Email</p>
                    <p className="text-sm font-medium text-slate-700">{user?.email}</p>
                  </div>
                </div>

                {user?.phone && (
                  <div className="flex items-center gap-3 p-3 bg-background-subtle rounded-lg">
                    <Phone className="w-5 h-5 text-foreground-muted" />
                    <div>
                      <p className="text-xs text-foreground-muted">Téléphone</p>
                      <p className="text-sm font-medium text-slate-700">{user.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-background-subtle rounded-lg">
                  <Briefcase className="w-5 h-5 text-foreground-muted" />
                  <div>
                    <p className="text-xs text-foreground-muted">Profession</p>
                    <p className="text-sm font-medium text-slate-700">{user?.profession}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/profile/settings">
                <Button variant="secondary" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurer mon compte
                </Button>
              </Link>
              <Button 
                variant="danger"
                className="w-full justify-start"
                onClick={logout}
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary-light to-white border-primary/20">
            <CardContent className="pt-6">
              <User className="w-12 h-12 text-primary mb-3" />
              <p className="text-sm text-slate-700">
                Votre compte professionnel est actif sur Passerelle
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
