import React, { useState, useEffect } from 'react';
import { documentsAPI, childrenAPI } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar } from '../components/ui/avatar';
import { FileText, Download, Calendar, Plus, Filter } from 'lucide-react';
import { formatDateTime } from '../lib/utils';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docsRes, childrenRes] = await Promise.all([
        documentsAPI.list(),
        childrenAPI.list()
      ]);
      setDocuments(docsRes.data);
      setChildren(childrenRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
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

  const getDocumentsByChild = () => {
    const grouped = {};
    children.forEach(child => {
      grouped[child.id] = {
        child,
        documents: documents.filter(doc => doc.child_id === child.id)
      };
    });
    return grouped;
  };

  const documentsByChild = getDocumentsByChild();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // View by child (default)
  if (!selectedChild) {
    return (
      <div className="space-y-6 animate-in" data-testid="documents-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-outfit mb-2">
            Documents
          </h1>
          <p className="text-foreground-muted">Organisés par enfant</p>
        </div>

        {/* Children cards with documents */}
        <div className="space-y-4">
          {children.map((child) => {
            const childDocs = documentsByChild[child.id]?.documents || [];
            return (
              <Card 
                key={child.id} 
                interactive
                onClick={() => setSelectedChild(child)}
                data-testid={`child-documents-${child.id}`}
              >
                <div className="flex items-start gap-4">
                  <Avatar 
                    src={child.photo_url} 
                    firstName={child.first_name} 
                    lastName={child.last_name}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-1">
                          {child.first_name} {child.last_name}
                        </h3>
                        <p className="text-sm text-foreground-muted">{child.age} ans</p>
                      </div>
                      <Badge variant="info">
                        {childDocs.length} document{childDocs.length > 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {/* Preview of recent documents */}
                    {childDocs.length > 0 ? (
                      <div className="space-y-2">
                        {childDocs.slice(0, 3).map((doc) => (
                          <div 
                            key={doc.id}
                            className="flex items-center gap-3 p-2 bg-background-subtle rounded-lg text-sm"
                          >
                            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="flex-1 truncate font-medium text-slate-700">{doc.title}</span>
                            <Badge variant={getCategoryVariant(doc.category)} className="text-xs">
                              {getCategoryLabel(doc.category)}
                            </Badge>
                          </div>
                        ))}
                        {childDocs.length > 3 && (
                          <p className="text-xs text-foreground-muted pl-2">
                            + {childDocs.length - 3} autre{childDocs.length - 3 > 1 ? 's' : ''} document{childDocs.length - 3 > 1 ? 's' : ''}
                          </p>
                        )}
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

  // View documents for selected child
  const childDocs = documentsByChild[selectedChild.id]?.documents || [];

  return (
    <div className="space-y-6 animate-in" data-testid="child-documents-detail">
      {/* Back button */}
      <Button 
        variant="ghost" 
        onClick={() => setSelectedChild(null)}
        data-testid="back-to-children"
      >
        ← Retour à la liste
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar 
            src={selectedChild.photo_url} 
            firstName={selectedChild.first_name} 
            lastName={selectedChild.last_name}
            size="xl"
          />
          <div>
            <h1 className="text-3xl font-bold text-slate-800 font-outfit mb-1">
              Documents de {selectedChild.first_name}
            </h1>
            <p className="text-foreground-muted">{childDocs.length} document{childDocs.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button data-testid="add-document-button">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un document
        </Button>
      </div>

      {/* Documents list */}
      {childDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {childDocs.map((doc) => (
            <Card key={doc.id} interactive data-testid={`document-${doc.id}`}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-light rounded-lg flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-700 mb-2 line-clamp-2">{doc.title}</p>
                  <Badge variant={getCategoryVariant(doc.category)} className="mb-2">
                    {getCategoryLabel(doc.category)}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-foreground-muted mb-1">
                    <Calendar className="w-3 h-3" />
                    {formatDateTime(doc.uploaded_at)}
                  </div>
                  <p className="text-xs text-foreground-muted truncate">
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
          <p className="text-foreground-muted mb-4">Aucun document pour {selectedChild.first_name}</p>
          <Button data-testid="add-first-document">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter le premier document
          </Button>
        </Card>
      )}
    </div>
  );
};

export default Documents;
