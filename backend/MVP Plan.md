
# Récapitulatif d’Architecture – Plateforme de Services Afro-Communautaires (MVP)

## 1. Vision Produit (Récapitulatif)

**Objectif**  
Créer une plateforme, d’abord en Allemagne, orientée vers la communauté afro, permettant de **découvrir, faire confiance et entrer en contact** avec des prestataires de services locaux.

**Proposition de valeur principale**  
Renforcer la confiance et la visibilité de services culturellement pertinents qui circulent aujourd’hui surtout par le bouche-à-oreille.

**Ce que fait la plateforme (MVP)**

- Permet de rechercher des services par catégorie et par ville
    
- Présente de vrais prestataires avec photos et avis
    
- Met en relation clients et prestataires (via WhatsApp)
    
- Collecte des avis fiables après des collaborations réelles
    

**Ce que la plateforme ne fait pas (MVP)**

- Pas de réservation
    
- Pas de paiement
    
- Pas de messagerie interne
    
- Pas de system d authentification. L'authentification sera gérée de facon externe (header based authentication)
---

## 2. Utilisateurs Cibles

### Clients

- Personnes afro-descendantes vivant en Allemagne
    
- À la recherche de services de confiance et culturellement adaptés
    
- Habituées à communiquer via WhatsApp
    

### Prestataires

- Majoritairement des side hustlers
    
- Souvent informels ou semi-formels
    
- Déjà actifs sur WhatsApp
    
- Peu visibles en dehors de leur réseau personnel
    

---

## 3. Catégories de Services (Périmètre MVP)

1. **Coiffure & Beauté**
    
2. **Cuisine & Traiteur**
    
3. **Mode & Couture**
    

Chaque catégorie :

- Partage des attributs communs
    
- Possède aussi des attributs spécifiques
    

---

## 4. Architecture Système – Vue d’Ensemble

```
+-------------------+       +----------------------+
| Frontend          | <---> | Backend API          |
| Next.js           |       | Java (Spring, etc.)  |
+-------------------+       +----------------------+
                                     |
                                     |
                          +------------------------+
                          | PostgreSQL (Base       |
                          | de données principale)|
                          +------------------------+
                                     |
                                     |
                          +------------------------+
                          | WhatsApp Business API |
                          | (via fournisseur BSP)|
                          +------------------------+
```

---

## 5. Stratégie de Communication

### Prestataire ↔ Client

- **WhatsApp uniquement** (liens directs)
    
- Aucune messagerie intégrée à la plateforme
    

**Raisons**

- Alignement avec les usages réels
    
- Taux de réponse élevé
    
- Complexité technique réduite
    
- Les prestataires sont déjà actifs sur WhatsApp
    

---

## 6. Système d’Avis – Conception Centrale

### Principes Directeurs

- Les avis doivent être **mérités**, pas ouverts à tous
    
- Un contact ne signifie pas forcément une collaboration
    
- La plateforme demande confirmation, elle ne présume rien
    
- Faible friction, forte crédibilité
    

---

### Cycle de Vie d’un Avis (Flux Conceptuel)

```
Client contacte un prestataire
           |
           v
Enregistrement du contact
           |
           v
Attente (délai selon la catégorie)
           |
           v
Message WhatsApp de confirmation
"Avez-vous travaillé ensemble ?"
           |
           +---- Non --------> Fin
           |
           +---- Pas encore -> Rappel plus tard (max 2)
           |
           +---- Oui -------->
                            |
                            v
                     Demande d’avis
                            |
                            v
                       Avis soumis
```

---

### Délais de Demande d’Avis (Valeurs Initiales)

- Coiffure & Beauté : ~3 jours
    
- Cuisine & Traiteur : ~5–7 jours
    
- Mode & Couture : ~10–14 jours
    

(Peut commencer avec un délai unique pour le MVP.)

---

## 7. Utilisation de l’API WhatsApp Business

### Pourquoi WhatsApp dès le MVP

- Les avis sont un pilier de la confiance
    
- WhatsApp offre les meilleurs taux de réponse
    
- Messages transactionnels, non promotionnels
    

### Caractéristiques Clés

- Messages initiés par la plateforme via des templates approuvés
    
- Les réponses ouvrent une fenêtre de session de 24h
    
- Liens d’avis sécurisés, uniques et temporaires
    

### WhatsApp est utilisé pour :

- Confirmation de collaboration
    
- Demande d’avis après confirmation
    
- Aucune communication marketing
    

---

## 8. Philosophie de Données

### Base de Données Principale

**PostgreSQL**

**Raisons**

- Forte intégrité relationnelle
    
- Fiabilité des avis
    
- Agrégations simples (notes, statistiques)
    
- Transactions sûres
    
- Compatible avec les exigences RGPD
    

---

## 9. Modélisation des Services

### Constat Clé

Tous les services ne partagent pas les mêmes attributs.

### Solution : Modèle en Trois Couches

#### Couche 1 – Service Central (Commun)

- Prestataire
    
- Catégorie
    
- Ville
    
- Description
    
- Statut actif
    

#### Couche 2 – Extensions par Catégorie

- Attributs spécifiques par type de service
    
- Relation 1–à–1 avec le service central
    
- Données typées et cohérentes
    

#### Couche 3 – Métadonnées Flexibles (Optionnel)

- Attributs rares ou expérimentaux
    
- Évolution sans refonte du schéma
    

---

## 10. Relations de Données – Vue Conceptuelle

```
Utilisateur
    |
    | contacts
    v
 Contact  ---> Service ---> Prestataire
    |
    | (0..1)
    v
   Avis
```

Relations supplémentaires :

- Service → Catégorie
    
- Prestataire → Ville
    
- Messages WhatsApp → Contact
    

---

## 11. Confiance & Prévention des Abus

- Avis possibles uniquement après collaboration confirmée
    
- Un avis par contact
    
- Numéros de téléphone vérifiés
    
- Modération manuelle au début
    
- Signalement possible par les prestataires
    

---

## 12. Gestion des Offres Obsolètes (Stale Offers)

### Problématique

Une offre peut devenir obsolète lorsque :

- Le prestataire ne propose plus réellement le service
    
- Le prestataire oublie de désactiver l’offre
    
- Le prestataire n’est plus actif
    

Afficher indéfiniment ces offres nuit à la confiance des utilisateurs.

### Principes Directeurs

1. Aucune offre n’est valide indéfiniment sans signal d’activité
    
2. La visibilité diminue avant toute désactivation
    
3. Aucune suppression automatique
    

---

### Concept de « Fraîcheur » d’une Offre

Chaque offre possède un état de fraîcheur :

- **Active
    
- **Vieillissante**
    
- **Obsolète**
    

---

### Activités Qui Rafraîchissent une Offre

**Signaux forts**

- Réception d’un contact client
    
- Confirmation WhatsApp de disponibilité
    
- Modification de l’offre
    
- Soumission d’un avis
    

**Signaux faibles**

- Connexion du prestataire
    
- Mise à jour du profil prestataire
    

---

### Règles Temporelles (Valeurs Initiales MVP)

Pour simplifier le MVP :

- Offre considérée comme obsolète après **90 jours sans activité**
    

(Des règles par catégorie pourront être introduites plus tard.)

---

### Comportement des Offres Obsolètes

- L’offre n’est pas supprimée
    
- Elle apparaît plus bas dans les résultats de recherche
    
- Un badge est affiché :
    
    - « Disponibilité à confirmer »
        
    - « Dernière activité il y a X temps »
        

---

### Relance Prestataire via WhatsApp

Lorsqu’une offre devient obsolète :

- Un message WhatsApp est envoyé :
    
    > « Salut 👋 Proposes-tu toujours ce service sur la plateforme ?  
    > Réponds OUI pour le garder actif, NON pour le désactiver. »
    
- Une réponse **OUI** réactive immédiatement l’offre
    
- Aucune connexion à la plateforme n’est requise
    

---

### Absence de Réponse

En cas de non-réponse prolongée :

1. L’offre reste visible mais dépriorisée
    
2. Après une très longue inactivité, elle peut être masquée de la recherche
    
3. L’offre est archivée, jamais supprimée par défaut
    

---

### Signalement par les Utilisateurs

Les utilisateurs peuvent signaler :

- « Ce prestataire ne répond plus »
    

Ce signal :

- Réduit temporairement la fraîcheur
    
- Déclenche une vérification via WhatsApp
    
---

## 12. Fonctionnalités Volontairement Repoussées

Pour rester focalisé sur le MVP :

- Paiements
    
- Réservations
    
- Messagerie interne
    
- Réponses publiques aux avis
    
- Algorithmes de classement avancés
    

---

## 13. Critères de Succès du MVP

Le MVP est réussi si :

- Les prestataires répondent rapidement sur WhatsApp
    
- Les utilisateurs laissent naturellement des avis
    
- La confiance est visible
    
- Les prestataires invitent d’autres prestataires
    
- La communauté commence à dépendre de la plateforme
    

---

## 14. Évolutions Futures (Sans Blocage)

- Réservations et paiements
    
- Mise en avant de prestataires
    
- Indexation et recherche avancée
    
- Statistiques pour prestataires
    
- Messagerie interne (si nécessaire)
    
- Expansion hors d’Allemagne
    

---

## 15. Étoile Polaire Architecturale

> **La plateforme ne remplace pas les comportements réels — elle les amplifie.**

Toute l’architecture vise à soutenir :

- La communication humaine
    
- La confiance communautaire
    
- La simplicité d’usage
    
- Une croissance durable