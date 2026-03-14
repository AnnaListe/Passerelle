# Passerelle PRO - Product Requirements Document

## Original Problem Statement
Finaliser le module Devis (Quotes.jsx) pour l'univers PRO avec :
- Liste des devis avec filtres et statistiques
- Formulaire de création de devis
- Détail d'un devis
- Bouton pour convertir en contrat
- Edition d'un devis existant
- Duplication d'un devis

## Architecture
- **Frontend**: React.js avec Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT tokens

## User Personas
1. **Professionnel de santé** (éducateur spécialisé, orthophoniste, etc.)
   - Gère plusieurs enfants suivis
   - Crée et gère des devis pour les parents
   - Suit le cycle de vie: Brouillon -> Envoyé -> Accepté/Refusé -> Contrat

## Core Requirements

### Module Devis - COMPLETE
- [x] Liste des devis avec statistiques (Total, Brouillons, Envoyés, Acceptés, Refusés)
- [x] Filtres par statut
- [x] Formulaire de création (`/quotes/new`)
  - Sélection enfant via liste déroulante
  - Mode de facturation (à la séance / tarif horaire)
  - Prix par séance ou tarif horaire
  - Nombre de séances par mois
  - Durée par séance (mode horaire)
  - Description/notes
  - Durée de validité (30 jours par défaut)
- [x] Détail d'un devis (`/quotes/:quoteId`)
- [x] Edition d'un devis (`/quotes/:quoteId/edit`) - uniquement brouillons
- [x] Duplication de devis (`/quotes/new?duplicate=:quoteId`)
- [x] Changement de statut (Envoyer, Accepter, Refuser)
- [x] Conversion en contrat (devis accepté -> contrat actif)
- [x] Accès depuis fiche enfant (bouton "Nouveau devis")
- [x] Menu navigation "Devis" ajouté

## What's Been Implemented

### 2026-03-13
- **QuoteForm.jsx**: Nouveau composant pour création/édition de devis
- **QuoteDetail.jsx**: Ajout boutons Modifier et Dupliquer
- **ChildDetail.jsx**: Ajout bouton "Nouveau devis"
- **Navigation.jsx**: Ajout menu "Devis"
- **App.js**: Routes `/quotes`, `/quotes/new`, `/quotes/:quoteId`, `/quotes/:quoteId/edit`
- **api.js**: Fonctions `update()` et paramètres pour API
- **server.py**: 
  - Endpoint PUT `/api/quotes/{id}` pour édition
  - Fix import uuid
  - Fix sérialisation MongoDB pour création et conversion

## API Endpoints - Module Devis
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/quotes | Liste des devis |
| GET | /api/quotes/:id | Détail d'un devis |
| POST | /api/quotes | Créer un devis |
| PUT | /api/quotes/:id | Modifier un devis (brouillon) |
| PATCH | /api/quotes/:id/status | Changer le statut |
| POST | /api/quotes/:id/convert-to-contract | Convertir en contrat |

## Prioritized Backlog

### P0 - Critical (Done)
- [x] Module Devis complet

### P1 - High Priority (Next)
- [ ] Flux complet: Devis accepté -> Contrat -> Génération Facture
- [ ] Export PDF des devis
- [ ] Envoi email automatique du devis au parent

### P2 - Medium Priority
- [ ] Historique des modifications d'un devis
- [ ] Signature électronique du devis
- [ ] Rappels automatiques pour devis en attente

### P3 - Nice to Have
- [ ] Templates de devis prédéfinis
- [ ] Statistiques de conversion (devis acceptés vs refusés)
- [ ] Mode hors-ligne

## Next Tasks
1. Implémenter le flux Contrat -> Facture (génération automatique)
2. Ajouter l'export PDF des devis
3. Notifications email pour les parents

## Technical Notes
- Les dates sont stockées en ISO string format dans MongoDB
- Les enums (status, billing_mode) sont stockés en string
- ObjectId MongoDB n'est pas utilisé comme identifiant (utilisation d'UUID string)
