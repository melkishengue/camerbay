# Flow d'Onboarding Utilisateur

```mermaid
flowchart TD
    Start([Utilisateur visite la plateforme]) --> CheckAuth{Authentifié?}
    
    CheckAuth -->|Non| Login[Redirection vers Zitadel<br/>pour login]
    Login --> ReturnAuth[Retour avec email authentifié]
    
    CheckAuth -->|Oui| CheckProfile[GET /api/users/me]
    ReturnAuth --> CheckProfile
    
    CheckProfile --> ProfileExists{Profil existe?}
    
    ProfileExists -->|Non - 404| Onboarding[Page d'onboarding]
    
    Onboarding --> ChooseRole{Choisir rôle}
    
    ChooseRole -->|Client| ClientForm[Formulaire Client<br/>- Nom<br/>- Téléphone]
    ChooseRole -->|Provider| ProviderForm[Formulaire Provider<br/>- Nom<br/>- Téléphone<br/>- Nom business<br/>- PLZ<br/>- Ville<br/>- Description]
    
    ClientForm --> SubmitClient[POST /api/users/onboarding<br/>role: CLIENT]
    ProviderForm --> SubmitProvider[POST /api/users/onboarding<br/>role: PROVIDER]
    
    SubmitClient --> CreateClientUser[Création User CLIENT]
    SubmitProvider --> CreateProviderUser[Création User PROVIDER<br/>+ ProviderProfile]
    
    CreateClientUser --> ClientDashboard[Redirection vers<br/>Dashboard Client]
    CreateProviderUser --> ProviderDashboard[Redirection vers<br/>Dashboard Provider]
    
    ProfileExists -->|Oui - 200| CheckRole{Role?}
    
    CheckRole -->|Client| ClientDashboard
    CheckRole -->|Provider| ProviderDashboard
    
    ClientDashboard --> BrowseOffers[Parcourir les offres<br/>de services]
    ProviderDashboard --> ManageProfile[Gérer profil<br/>et créer offres]
    
    style Start fill:#e1f5ff
    style Login fill:#fff3cd
    style Onboarding fill:#d4edda
    style ClientDashboard fill:#cce5ff
    style ProviderDashboard fill:#d1ecf1
    style CheckAuth fill:#ffeaa7
    style ProfileExists fill:#ffeaa7
    style CheckRole fill:#ffeaa7
    style ChooseRole fill:#ffeaa7
```

## Détails du Flow

### 1. Première Visite (Nouvel Utilisateur)
1. L'utilisateur arrive sur la plateforme
2. Pas de session → Bouton "Se connecter"
3. Redirection vers Zitadel pour authentification
4. Après login, retour avec email dans les headers
5. Backend vérifie : GET /api/users/me → **404 Not Found**
6. Frontend redirige vers `/onboarding`

### 2. Page d'Onboarding
L'utilisateur remplit un formulaire selon son rôle :

**Pour un Client :**
- Nom
- Numéro de téléphone

**Pour un Provider :**
- Nom
- Numéro de téléphone
- Nom du business
- Code postal (PLZ)
- Ville
- Description (optionnel)

### 3. Soumission
- Frontend envoie POST /api/users/onboarding
- Backend crée :
  - User avec role CLIENT ou PROVIDER
  - Si PROVIDER : également un ProviderProfile

### 4. Redirection Finale
- **Client** → Dashboard pour parcourir les offres
- **Provider** → Dashboard pour gérer son profil et créer des offres

### 5. Visites Suivantes (Utilisateur Existant)
1. L'utilisateur arrive sur la plateforme
2. Session active → Headers d'auth présents
3. Backend vérifie : GET /api/users/me → **200 OK**
4. Frontend redirige directement vers le dashboard approprié
   - Client Dashboard si role = CLIENT
   - Provider Dashboard si role = PROVIDER

## États de l'Utilisateur

| État | Condition | Action |
|------|-----------|--------|
| **Nouveau** | Pas de User en DB | Afficher page d'onboarding |
| **Client** | User avec role CLIENT | Rediriger vers dashboard client |
| **Provider** | User avec role PROVIDER + ProviderProfile | Rediriger vers dashboard provider |