import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import ParentLayout from './components/layout/ParentLayout';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';

// Pages Pro
import Dashboard from './pages/Dashboard';
import Children from './pages/Children';
import ChildDetail from './pages/ChildDetail';
import ChildForm from './pages/ChildForm';
import ChildPlanning from './pages/ChildPlanning';
import Planning from './pages/Planning';
import Messages from './pages/Messages';
import ConversationDetail from './pages/ConversationDetail';
import Documents from './pages/Documents';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Contracts from './pages/Contracts';
import Quotes from './pages/Quotes';
import QuoteDetail from './pages/QuoteDetail';
import QuoteForm from './pages/QuoteForm';
import Profile from './pages/Profile';
import ProfileSettings from './pages/ProfileSettings';

// Pages Parent
import ParentDashboard from './pages/parent/ParentDashboard';
import ParentChildProfile from './pages/parent/ParentChildProfile';
import ParentPlanning from './pages/parent/ParentPlanning';
import ParentMessages from './pages/parent/ParentMessages';
import ParentConversation from './pages/parent/ParentConversation';
import ParentDocuments from './pages/parent/ParentDocuments';
import ParentInvoices from './pages/parent/ParentInvoices';
import ParentInvoiceDetail from './pages/parent/ParentInvoiceDetail';
import ParentMood from './pages/parent/ParentMood';
import ParentProfessionals from './pages/parent/ParentProfessionals';
import ParentProfessionalDetail from './pages/parent/ParentProfessionalDetail';
import ParentProfile from './pages/parent/ParentProfile';

import './App.css';

// Redirection intelligente selon le type d'utilisateur
const SmartRedirect = () => {
  const { userType, loading } = useAuth();
  
  if (loading || !userType) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  
  if (userType === 'parent') return <Navigate to="/parent/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/accueil" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />

          {/* Redirection intelligente */}
          <Route path="/redirect" element={<ProtectedRoute><SmartRedirect /></ProtectedRoute>} />

          {/* Univers Pro */}
          <Route
            path="/"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="children" element={<Children />} />
            <Route path="children/new" element={<ChildForm />} />
            <Route path="children/:childId" element={<ChildDetail />} />
            <Route path="children/:childId/edit" element={<ChildForm />} />
            <Route path="children/:childId/planning" element={<ChildPlanning />} />
            <Route path="planning" element={<Planning />} />
            <Route path="messages" element={<Messages />} />
            <Route path="messages/parent/:conversationId" element={<ConversationDetail />} />
            <Route path="messages/professional/:conversationId" element={<ConversationDetail />} />
            <Route path="documents" element={<Documents />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:invoiceId" element={<InvoiceDetail />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="contracts/:childId" element={<Contracts />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="quotes/new" element={<QuoteForm />} />
            <Route path="quotes/:quoteId" element={<QuoteDetail />} />
            <Route path="quotes/:quoteId/edit" element={<QuoteForm />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/settings" element={<ProfileSettings />} />
          </Route>

          {/* Univers Parent */}
          <Route
            path="/parent"
            element={<ProtectedRoute><ParentLayout /></ProtectedRoute>}
          >
            <Route index element={<Navigate to="/parent/dashboard" replace />} />
            <Route path="dashboard" element={<ParentDashboard />} />
            <Route path="enfant" element={<ParentChildProfile />} /> 
            <Route path="planning" element={<ParentPlanning />} />
            <Route path="messages" element={<ParentMessages />} /> 
            <Route path="messages/:id" element={<ParentConversation />} /> 
            <Route path="documents" element={<ParentDocuments />} />
            <Route path="factures" element={<ParentInvoices />} /> 
            <Route path="factures/:id" element={<ParentInvoiceDetail />} /> 
            <Route path="mood" element={<ParentMood />} /> 
            <Route path="professionnels" element={<ParentProfessionals />} /> 
            <Route path="profil" element={<ParentProfile />} /> 
            <Route path="professionnels/:id" element={<ParentProfessionalDetail />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
