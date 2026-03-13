import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Children from './pages/Children';
import ChildDetail from './pages/ChildDetail';
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
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="children" element={<Children />} />
            <Route path="children/:childId" element={<ChildDetail />} />
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
