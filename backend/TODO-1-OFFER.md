# Décomposition du Travail - Services Provider

## Epic: Gestion des Offres de Services

---

## TICKET-1: Créer le modèle de données pour les Offres
**Type:** Backend - Model  

### Description
Créer l'entité JPA `Offer` qui représente un service proposé par un provider.

### Critères d'acceptation
- [ ] Entité `Offer` créée dans le package `offer/`
- [ ] Relation ManyToOne avec `ProviderProfile`
- [ ] Champs requis : title, description, category, price
- [ ] Champs optionnels : promotionalPrice, photos, details (liste de strings)
- [ ] Value Object pour `Category` (enum: HAIR_BEAUTY, FOOD_CATERING, FASHION)
- [ ] Value Object pour `Price` (avec validation min/max)
- [ ] Méthodes métier : activate(), deactivate(), updatePrice(), addPhoto()
- [ ] Factory method : `Offer.create(provider, title, category, price)`

### Questions techniques
- Les photos sont-elles stockées comme URLs ou objets séparés? seulement les urls des images sont sauvegardées dans la BD. Les images sont uploadées depuis le frontend sur supabase et une url pour l image est envoyée au backend
- Y a-t-il une limite au nombre de photos par offre? 5
- Le prix est-il obligatoire ou peut-on avoir des offres "sur devis"? non le prix est optionnel

---

## TICKET-2: Créer le Repository pour les Offres
**Type:** Backend - Repository  

### Description
Créer l'interface `OfferRepository` avec les queries nécessaires.

### Critères d'acceptation
- [ ] Interface `OfferRepository extends JpaRepository<Offer, UUID>`
- [ ] Query: `findByProviderId(UUID providerId)` - toutes les offres d'un provider
- [ ] Query: `findByProviderIdAndActive(UUID providerId, Boolean active)` - offres actives seulement
- [ ] Query: `findByCategory(Category category)` - recherche par catégorie
- [ ] Query optimisée avec JOIN FETCH pour charger le provider

### Dépendances
- TICKET-1 doit être complété

---

## TICKET-3: Créer les DTOs pour les Offres
**Type:** Backend - DTO  

### Description
Créer les DTOs pour les requêtes et réponses liées aux offres.

### Critères d'acceptation
- [ ] `CreateOfferRequest` : providerId, title, description, category, price, promotionalPrice, photos
- [ ] `UpdateOfferRequest` : title, description, price, promotionalPrice, photos (tous optionnels)
- [ ] `OfferResponse` : id, providerId, providerName, title, description, category, price, promotionalPrice, photos, active, createdAt
- [ ] Validation Jakarta sur les DTOs (@NotBlank, @NotNull, @Positive pour price, etc.)
- [ ] Méthode statique `OfferResponse.from(Offer offer)` pour mapping

### Dépendances
- TICKET-1 doit être complété

---

## TICKET-4: Implémenter le Service pour les Offres
**Type:** Backend - Service  

### Description
Créer `OfferService` avec la logique métier pour gérer les offres.

### Critères d'acceptation
- [ ] Méthode `createOffer(CreateOfferRequest)` - validation que le provider existe
- [ ] Méthode `updateOffer(UUID offerId, UpdateOfferRequest)` - vérification propriété
- [ ] Méthode `deleteOffer(UUID offerId)` - soft delete (désactivation)
- [ ] Méthode `getOfferById(UUID id)` - récupération offre publique
- [ ] Méthode `getOffersByProvider(UUID providerId)` - liste des offres d'un provider
- [ ] Méthode `getMyOffers(String email)` - offres du provider connecté
- [ ] Validation business : un provider peut avoir max 50 offres actives
- [ ] Transaction management avec @Transactional

### Dépendances
- TICKET-1, TICKET-2, TICKET-3 doivent être complétés

---

## TICKET-5: Créer le Controller pour les Offres (endpoints provider)
**Type:** Backend - Controller  

### Description
Créer `OfferController` avec les endpoints pour que les providers gèrent leurs offres.

### Critères d'acceptation
- [ ] `POST /api/v1/offers` - créer une offre (authentifié, provider only)
- [ ] `PUT /api/v1/offers/{id}` - modifier une offre (vérifier ownership)
- [ ] `DELETE /api/v1/offers/{id}` - supprimer une offre (vérifier ownership)
- [ ] `GET /api/v1/offers/my-offers` - liste des offres du provider connecté
- [ ] `PATCH /api/v1/offers/{id}/activate` - activer une offre
- [ ] `PATCH /api/v1/offers/{id}/deactivate` - désactiver une offre
- [ ] Utiliser `@CurrentUser` pour récupérer l'utilisateur authentifié
- [ ] Validation des permissions (seul le propriétaire peut modifier)
- [ ] Gestion des erreurs avec messages appropriés

### Dépendances
- TICKET-4 doit être complété

---

## TICKET-6: Créer les endpoints publics pour la recherche d'offres
**Type:** Backend - Controller

### Description
Ajouter des endpoints publics (non authentifiés) pour que les clients cherchent des offres.

### Critères d'acceptation
- [ ] `GET /api/v1/offers/search` - recherche avec filtres
  - Query params: `category`, `plz`, `radius`, `search` (texte libre)
  - Retourne liste d'offres avec infos provider (name, rating, distance)
- [ ] `GET /api/v1/offers/{id}` - détails publics d'une offre
- [ ] Pagination des résultats (page, size)
- [ ] Tri par : distance, rating, date création
- [ ] Intégration PostGIS pour recherche géographique
- [ ] Full-text search sur title et description

### Questions techniques
- Faut-il un cache pour les résultats de recherche? pour un debut non
- Quelle est la limite de résultats par page? 10

### Dépendances
- TICKET-4 doit être complété

---

## TICKET-7: Ajouter la validation de propriété dans OfferService
**Type:** Backend - Security  

### Description
S'assurer qu'un provider ne peut modifier que ses propres offres.

### Critères d'acceptation
- [ ] Helper method `validateOwnership(UUID offerId, String email)`
- [ ] Throw `UnauthorizedException` si le provider n'est pas le propriétaire
- [ ] Appliquer cette validation dans update, delete, activate, deactivate
- [ ] Tests unitaires pour les cas de violation

### Dépendances
- TICKET-4 doit être complété

## Questions à Clarifier Avant de Commencer

1. **Prix**: Les offres peuvent-elles être "sur devis" (sans prix fixe)? oui, dans ce cas on doit pouvoir afficher sur le frontend qu il s agit d une offre sur devis. Le prix sera communiqué une fois que le prestataire aura toutes les infos (ex type de gateau, taille, etc...)
2. **Photos**: Combien maximum par offre? Redimensionnement automatique? 5
3. **Catégories**: Les 3 catégories initiales (Hair, Food, Fashion) sont-elles suffisantes? oui pour commencer
4. **Limite offres**: 50 offres actives max par provider est-il approprié?
5. **Recherche**: Faut-il indexer avec Elasticsearch dès le MVP ou PostgreSQL full-text suffit? PostgreSQL full-text search
