import React, { useState, useEffect } from 'react';
import { documentsAPI } from '../lib/api';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { FileText, Download, Calendar } from 'lucide-react';
import { formatDateTime } from '../lib/utils';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await documentsAPI.list();
      setDocuments(response.data);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryVariant = (category) => {
    const variants = {
      'bilan': 'info',
      'compte_rendu': 'success',
      'ordonnance': 'warning',
      'document_administratif': 'default',
      'justificatif': 'pending',
      'document_seance': 'active',
      'autre': 'default'
    };
    return variants[category] || 'default';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'bilan': 'Bilan',
      'compte_rendu': 'Compte rendu',
      'ordonnance': 'Ordonnance',
      'document_administratif': 'Document administratif',
      'justificatif': 'Justificatif',
      'document_seance': 'Document de séance',
      'autre': 'Autre'
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in" data-testid="documents-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-outfit mb-2">
          Documents
        </h1>
        <p className="text-foreground-muted">{documents.length} documents</p>
      </div>

      {/* Documents List */}
      {documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} interactive data-testid={`document-${doc.id}`}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-light rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-700 mb-1">{doc.title}</p>
                  <Badge variant={getCategoryVariant(doc.category)} className="mb-2">
                    {getCategoryLabel(doc.category)}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-foreground-muted mb-1">
                    <Calendar className="w-3 h-3" />
                    {formatDateTime(doc.uploaded_at)}
                  </div>
                  <p className="text-xs text-foreground-muted">
                    {doc.file_name}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-foreground-muted">Aucun document</p>
        </Card>
      )}
    </div>
  );
};

export default Documents;
