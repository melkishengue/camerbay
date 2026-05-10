# Décomposition du Travail - Contact & Lead Generation System

## Epic: Système de Contact et Génération de Leads

---

## TICKET-C1: Créer le modèle de données pour les Contacts
**Type:** Backend - Model

### Description
Créer l'entité JPA `Contact` qui représente l'interaction entre un client et un provider via WhatsApp.

### Critères d'acceptation
- [ ] Entité `Contact` créée dans le package `contact/`
- [ ] Relation ManyToOne avec `User` (client)
- [ ] Relation ManyToOne avec `Offer` (offre contactée)
- [ ] Relation ManyToOne avec `ProviderProfile` (dénormalisé pour requêtes rapides)
- [ ] Champs requis : clientPhone (copié du profil), contactedAt
- [ ] Champs de statut : status (enum), reviewEligible (boolean)
- [ ] Enum `ContactStatus` : CONTACTED, CONFIRMED, DECLINED, PENDING, EXPIRED
- [ ] Champs temporels : lastFollowUpAt, confirmedAt
- [ ] Méthodes métier :
  - `markAsConfirmed()` - passe status à CONFIRMED, set confirmedAt, reviewEligible=true
  - `markAsDeclined()` - passe status à DECLINED
  - `markAsPending()` - passe status à PENDING (réponse "NOCH NICHT")
  - `isEligibleForFollowUp()` - vérifie si délai écoulé selon catégorie
  - `canReceiveReview()` - vérifie si reviewEligible=true
- [ ] Factory method : `Contact.create(client, offer, clientPhone)`
- [ ] Validation : impossible de créer plusieurs contacts identiques dans les 24h

### Notes techniques
- Le clientPhone est copié au moment du contact pour tracking même si le user change son numéro
- Le status CONTACTED est l'état initial après le clic WhatsApp
- reviewEligible devient true uniquement après confirmation

---

## TICKET-C2: Créer le Repository pour les Contacts
**Type:** Backend - Repository

### Description
Créer l'interface `ContactRepository` avec les queries nécessaires pour gérer les contacts.

### Critères d'acceptation
- [ ] Interface `ContactRepository extends JpaRepository<Contact, UUID>`
- [ ] Query: `findByClientId(UUID clientId)` - historique contacts d'un client
- [ ] Query: `findByProviderId(UUID providerId)` - contacts reçus par un provider
- [ ] Query: `findByOfferId(UUID offerId)` - contacts pour une offre spécifique
- [ ] Query: `findByStatus(ContactStatus status)` - filtrer par statut
- [ ] Query: `findContactsForFollowUp()` - contacts CONTACTED qui ont dépassé le délai
  - Status = CONTACTED
  - contactedAt < now - délai selon catégorie
  - Aucun WhatsAppMessage de type CONFIRMATION_REQUEST envoyé
- [ ] Query: `findPendingContactsForReminder()` - contacts PENDING à relancer
  - Status = PENDING
  - lastFollowUpAt < now - X jours
  - Compteur de reminders < 2
- [ ] Query: `existsByClientIdAndOfferIdAndContactedAtAfter()` - vérifier contact récent
- [ ] Query optimisée avec JOIN FETCH pour charger client, offer, provider ensemble

### Dépendances
- TICKET-C1 doit être complété

---

## TICKET-C3: Créer les DTOs pour les Contacts
**Type:** Backend - DTO

### Description
Créer les DTOs pour les requêtes et réponses liées aux contacts.

### Critères d'acceptation
- [ ] `CreateContactRequest` : offerId, clientPhone (pour validation)
- [ ] `ContactResponse` : id, clientName, offerTitle, providerName, status, contactedAt, confirmedAt
- [ ] `ClientContactHistoryResponse` : liste de ContactResponse avec pagination
- [ ] `ProviderContactsResponse` : liste de ContactResponse avec statistiques (total, confirmed, pending)
- [ ] Validation Jakarta sur les DTOs :
  - `@NotNull` sur offerId
  - Validation format phone (E.164)
- [ ] Méthode statique `ContactResponse.from(Contact contact)` pour mapping

### Dépendances
- TICKET-C1 doit être complété

---

## TICKET-C4: Implémenter le Service pour les Contacts
**Type:** Backend - Service

### Description
Créer `ContactService` avec la logique métier pour gérer les contacts.

### Critères d'acceptation
- [ ] Méthode `createContact(CreateContactRequest, String email)` :
  - Récupérer le User via email (client authentifié)
  - Vérifier que l'offre existe et est active
  - Vérifier qu'aucun contact n'existe pour cette offre dans les dernières 24h
  - Créer le Contact avec status CONTACTED
  - Retourner ContactResponse
- [ ] Méthode `getMyContacts(String email)` - historique du client connecté
  - Pagination (page, size)
  - Tri par date (desc)
- [ ] Méthode `getProviderContacts(UUID providerId)` - contacts reçus par provider
  - Filtrage par status optionnel
  - Pagination
  - Statistiques (total, confirmed, declined, pending)
- [ ] Méthode `updateContactStatus(UUID contactId, ContactStatus newStatus)` :
  - Appelée par le système WhatsApp après réponse
  - Si CONFIRMED → marquer comme reviewEligible
  - Si PENDING → incrémenter compteur de rappels
- [ ] Méthode `getContactsForFollowUp()` - pour le job planifié
  - Retourne les contacts nécessitant un message de confirmation
  - Filtre selon le délai de la catégorie
- [ ] Méthode `getContactsForReminder()` - pour le job planifié
  - Retourne les contacts PENDING à relancer (max 2 rappels)
- [ ] Transaction management avec @Transactional

### Dépendances
- TICKET-C1, TICKET-C2, TICKET-C3 doivent être complétés

---

## TICKET-C5: Créer le Controller pour les Contacts
**Type:** Backend - Controller

### Description
Créer `ContactController` avec les endpoints pour gérer les contacts.

### Critères d'acceptation
- [ ] `POST /api/v1/contacts` - créer un contact (authentifié)
  - Body: CreateContactRequest
  - Utilise `@CurrentUser` pour identifier le client
  - Retourne ContactResponse
  - Code 201 Created
- [ ] `GET /api/v1/contacts/my-contacts` - historique du client connecté
  - Query params: page, size, status (optionnel)
  - Retourne ClientContactHistoryResponse
  - Code 200 OK
- [ ] `GET /api/v1/contacts/provider/{providerId}` - contacts d'un provider (authentifié, provider only)
  - Query params: page, size, status (optionnel)
  - Vérification que l'utilisateur connecté est bien le provider
  - Retourne ProviderContactsResponse avec stats
  - Code 200 OK
- [ ] `GET /api/v1/contacts/{id}` - détails d'un contact (vérifier ownership)
  - Accessible par le client OU le provider concerné
  - Retourne ContactResponse
  - Code 200 OK ou 403 Forbidden
- [ ] Gestion des erreurs :
  - Offre inexistante ou inactive → 404 Not Found
  - Contact dupliqué (< 24h) → 409 Conflict
  - Accès non autorisé → 403 Forbidden

### Dépendances
- TICKET-C4 doit être complété

---

## TICKET-C6: Implémenter la logique des délais de follow-up par catégorie
**Type:** Backend - Service

### Description
Créer un système qui détermine quand envoyer le message de confirmation selon la catégorie de l'offre.

### Critères d'acceptation
- [ ] Enum `FollowUpDelay` dans le package `contact/` :
  - HAIR_BEAUTY(3, DAYS) - 3 jours
  - FOOD_CATERING(7, DAYS) - 7 jours
  - FASHION(14, DAYS) - 14 jours
- [ ] Méthode `getDelayForCategory(Category category)` - retourne le délai
- [ ] Configuration externalisée dans application.properties :
  ```yaml
  contact:
    followup:
      hair-beauty-days: 3
      food-catering-days: 7
      fashion-days: 14
      reminder-interval-days: 5
      max-reminders: 2
  ```
- [ ] Service `ContactFollowUpService` :
  - Méthode `calculateFollowUpDate(Contact contact)` - calcule la date d'envoi
  - Méthode `shouldSendFollowUp(Contact contact)` - vérifie si le délai est écoulé
  - Méthode `shouldSendReminder(Contact contact)` - vérifie si rappel nécessaire

### Notes techniques
- Les délais sont configurables pour faciliter les tests et ajustements
- Le délai commence à partir de contactedAt

### Dépendances
- TICKET-C1 doit être complété

---

## TICKET-C7: Créer le modèle pour le compteur de rappels
**Type:** Backend - Model

### Description
Ajouter la logique pour limiter le nombre de rappels WhatsApp par contact.

### Critères d'acceptation
- [ ] Champ `reminderCount` (Integer, default 0) dans l'entité Contact
- [ ] Champ `lastReminderSentAt` (LocalDateTime, nullable) dans l'entité Contact
- [ ] Méthode `canSendReminder()` dans Contact :
  - Vérifie que status = PENDING
  - Vérifie que reminderCount < 2
  - Vérifie que lastReminderSentAt est null OU > 5 jours
- [ ] Méthode `incrementReminderCount()` dans Contact :
  - Incrémente reminderCount
  - Met à jour lastReminderSentAt
  - Si reminderCount >= 2 → passe status à EXPIRED
- [ ] Méthode `hasExceededReminderLimit()` - retourne boolean

### Notes techniques
- Maximum 2 rappels par contact
- Interval de 5 jours entre rappels
- Après 2 rappels, le contact expire (plus de follow-up)

### Dépendances
- TICKET-C1 doit être complété

---

## TICKET-C8: Implémenter la validation anti-spam des contacts
**Type:** Backend - Service

### Description
Empêcher qu'un client contacte plusieurs fois le même provider pour la même offre rapidement.

### Critères d'acceptation
- [ ] Méthode `validateContactNotDuplicate(UUID clientId, UUID offerId)` dans ContactService
- [ ] Vérification : pas de contact pour cette offre dans les dernières 24h
- [ ] Si duplicate trouvé → throw `DuplicateContactException` avec message explicite
- [ ] Configuration du délai anti-spam dans application.properties :
  ```yaml
  contact:
    anti-spam:
      cooldown-hours: 24
  ```
- [ ] Tests pour différents scénarios :
  - Contact après 23h → erreur
  - Contact après 25h → succès
  - Contacts pour offres différentes → succès

### Notes techniques
- Évite le spam accidentel ou malveillant
- 24h est un bon compromis entre protection et UX

### Dépendances
- TICKET-C4 doit être complété

---

## TICKET-C9: Créer les statistiques de contacts pour les providers
**Type:** Backend - Service

### Description
Fournir des statistiques sur les contacts reçus par un provider.

### Critères d'acceptation
- [ ] DTO `ContactStatsResponse` :
  - totalContacts (total tous statuts)
  - contactedCount (CONTACTED)
  - confirmedCount (CONFIRMED)
  - declinedCount (DECLINED)
  - pendingCount (PENDING)
  - expiredCount (EXPIRED)
  - conversionRate (confirmedCount / totalContacts en %)
  - averageResponseTime (temps moyen entre contact et confirmation)
- [ ] Méthode `getContactStats(UUID providerId)` dans ContactService
- [ ] Query native ou JPQL pour calculer les stats efficacement
- [ ] Endpoint `GET /api/v1/contacts/provider/{providerId}/stats`
  - Authentifié, provider only
  - Retourne ContactStatsResponse

### Notes techniques
- Les stats aident les providers à comprendre leur performance
- Peut être étendu plus tard avec graphiques temporels

### Dépendances
- TICKET-C4, TICKET-C5 doivent être complétés

---

## TICKET-C12: Ajouter les contraintes DB et index pour les Contacts
**Type:** Backend - Database

### Description
Optimiser les performances et garantir l'intégrité des données.

### Critères d'acceptation
- [ ] Index composite sur (client_id, offer_id, contacted_at) - pour détection duplicates
- [ ] Index sur status - pour filtrage rapide
- [ ] Index sur provider_id - pour requêtes provider
- [ ] Index sur contacted_at - pour tri chronologique
- [ ] Index sur (status, contacted_at) - pour job de follow-up
- [ ] Foreign key constraints :
  - client_id → users(id) ON DELETE CASCADE
  - offer_id → offers(id) ON DELETE SET NULL
  - provider_id → provider_profiles(id) ON DELETE CASCADE
- [ ] Migration Liquibase ou script SQL
- [ ] Documentation des index dans README

### Notes techniques
- L'index composite (client, offer, date) optimise la détection anti-spam
- CASCADE sur client permet de supprimer l'historique si user supprimé
- SET NULL sur offer préserve l'historique même si offre supprimée

### Dépendances
- TICKET-C1 doit être complété

---

## Configuration Système Contact

### Valeurs recommandées pour le MVP (application.properties)
```yaml
contact:
  followup:
    hair-beauty-days: 3        # Délai pour coiffure
    food-catering-days: 7      # Délai pour cuisine
    fashion-days: 14           # Délai pour mode
    reminder-interval-days: 5  # Intervalle entre rappels
    max-reminders: 2           # Nombre max de rappels
  
  anti-spam:
    cooldown-hours: 24         # Délai minimum entre contacts identiques
```

---

## Cycle de Vie d'un Contact

```
1. Client clique "Contact via WhatsApp"
   → Status: CONTACTED
   → Enregistrement dans DB avec timestamp

2. Job planifié vérifie après X jours (selon catégorie)
   → Envoie WhatsApp: "Avez-vous travaillé ensemble?"

3a. Client répond "OUI"
    → Status: CONFIRMED
    → reviewEligible: true
    → Envoi du lien d'avis

3b. Client répond "NON"
    → Status: DECLINED
    → Fin du cycle

3c. Client répond "NOCH NICHT"
    → Status: PENDING
    → Rappel dans 5 jours (max 2 fois)
    → Si 2 rappels sans réponse → EXPIRED

4. Si CONFIRMED et reviewEligible
   → Client peut soumettre un avis
```

---

## Statistiques Contact (Exemple)

```json
{
  "totalContacts": 50,
  "contactedCount": 10,
  "confirmedCount": 25,
  "declinedCount": 8,
  "pendingCount": 5,
  "expiredCount": 2,
  "conversionRate": 50.0,
  "averageResponseTime": "4.2 days"
}
```

---

## Questions Techniques Résolues

1. **Anti-spam**: Cooldown de 24h entre contacts identiques ✅
2. **Délais follow-up**: Variables par catégorie (3/7/14 jours) ✅
3. **Rappels**: Maximum 2, espacés de 5 jours ✅
4. **Status flow**: CONTACTED → CONFIRMED/DECLINED/PENDING → EXPIRED ✅
5. **Review eligibility**: Seulement après status CONFIRMED ✅
6. **Données dénormalisées**: Provider ID copié pour stats rapides ✅
7. **Phone tracking**: Client phone copié au contact pour historique ✅