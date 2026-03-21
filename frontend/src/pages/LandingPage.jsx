import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, Calendar, FileText, MessageCircle, Heart, Shield, Zap } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm font-outfit">P</span>
            </div>
            <span className="text-xl font-bold text-slate-800 font-outfit">Passerelle</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors font-outfit"
            >
              Connexion
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all duration-200 shadow-sm hover:shadow-md font-outfit"
            >
              Commencer
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-60 -left-20 w-72 h-72 bg-blue-50 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-2xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/8 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-8 font-outfit border border-primary/15">
            <Heart className="w-4 h-4" />
            Coordination pluridisciplinaire pour l'enfant autiste
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 leading-tight mb-6 font-outfit tracking-tight">
            Un lien fort entre
            <span className="block text-primary">familles et professionnels</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto mb-12 font-outfit">
            Passerelle connecte les familles, les professionnels libéraux et les centres spécialisés autour de chaque enfant accompagné.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 px-8 py-4 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-dark transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-base font-outfit"
            >
              Créer un compte gratuit
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-8 py-4 bg-white text-slate-700 font-semibold rounded-2xl border border-slate-200 hover:border-primary/30 hover:bg-primary/3 transition-all duration-200 text-base font-outfit"
            >
              Se connecter
            </button>
          </div>
        </div>

        {/* Hero visual */}
        <div className="max-w-5xl mx-auto mt-20 relative">
          <div className="bg-gradient-to-br from-slate-50 to-primary/5 rounded-3xl p-8 border border-slate-100 shadow-xl">
            <div className="grid grid-cols-3 gap-4">
              {/* Pro card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <p className="font-semibold text-slate-800 text-sm font-outfit mb-1">Professionnel</p>
                <p className="text-xs text-slate-400 font-outfit">Gérez vos enfants suivis, plannings et factures</p>
              </div>
              {/* Parent card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-primary/20 ring-1 ring-primary/10">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-3">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-slate-800 text-sm font-outfit mb-1">Parent</p>
                <p className="text-xs text-slate-400 font-outfit">Suivez le parcours de votre enfant au quotidien</p>
              </div>
              {/* Centre card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <p className="font-semibold text-slate-800 text-sm font-outfit mb-1">Centre / IME</p>
                <p className="text-xs text-slate-400 font-outfit">Coordonnez votre équipe pluridisciplinaire</p>
              </div>
            </div>

            {/* Connecting line */}
            <div className="flex items-center justify-center gap-3 mt-6 py-4 bg-white/60 rounded-2xl">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-800 font-outfit mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-slate-500 font-outfit">Une plateforme pensée pour simplifier la coordination au quotidien</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Calendar, color: 'text-primary bg-primary/10', title: 'Planning partagé', desc: 'Visualisez et coordonnez les rendez-vous de tous les intervenants en un seul endroit.' },
              { icon: MessageCircle, color: 'text-blue-500 bg-blue-50', title: 'Messagerie intégrée', desc: 'Échangez directement avec les professionnels et les familles de manière sécurisée.' },
              { icon: FileText, color: 'text-purple-500 bg-purple-50', title: 'Documents centralisés', desc: 'Bilans, comptes rendus, ordonnances — tous les documents accessibles au bon endroit.' },
              { icon: Users, color: 'text-emerald-500 bg-emerald-50', title: 'Fiche enfant complète', desc: 'Un dossier partagé avec les informations essentielles pour une prise en charge cohérente.' },
              { icon: Shield, color: 'text-orange-500 bg-orange-50', title: 'Données protégées', desc: 'Vos données sont chiffrées et hébergées en France. La vie privée est notre priorité.' },
              { icon: Zap, color: 'text-rose-500 bg-rose-50', title: 'Factures & devis', desc: 'Générez et suivez vos devis et factures directement depuis la plateforme.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-primary/20 hover:shadow-md transition-all duration-200">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2 font-outfit">{title}</h3>
                <p className="text-sm text-slate-500 font-outfit leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-12 text-white shadow-xl">
            <h2 className="text-3xl font-bold font-outfit mb-4">Prêt à rejoindre Passerelle ?</h2>
            <p className="text-white/80 font-outfit mb-8">Créez votre compte gratuitement et commencez à coordonner le suivi dès aujourd'hui.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-all duration-200 font-outfit"
              >
                Créer un compte
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200 font-outfit"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs font-outfit">P</span>
            </div>
            <span className="text-slate-600 font-outfit text-sm">Passerelle © 2026</span>
          </div>
          <p className="text-xs text-slate-400 font-outfit">
            Plateforme de coordination pour l'accompagnement des enfants autistes
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
