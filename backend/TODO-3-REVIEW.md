# Décomposition du Travail - Review System

## Epic: Système d'Avis et Évaluations

---

## TICKET-R1: Créer le modèle de données pour les Reviews
**Type:** Backend - Model

### Description
Créer l'entité JPA `Review` qui représente un avis client sur un provider après une collaboration.

### Critères d'acceptation
- [ ] Entité `Review` créée dans le package `review/`
- [ ] Relation ManyToOne avec `Contact` (one-to-one - un contact = un avis max)
- [ ] Relation ManyToOne avec `ProviderProfile` (pour requêtes optimisées)
- [ ] Champs requis : rating (1-5), reviewText
- [ ] Champs optionnels : photos (URLs), serviceDate
- [ ] Champs techniques : reviewToken (UUID unique), tokenExpiresAt, submittedAt, visible
- [ ] Value Object pour `Rating` (validation 1-5, BigDecimal avec 1 décimale)
- [ ] Méthodes métier : `isExpired()`, `markAsVisible()`, `markAsHidden()`
- [ ] Factory method : `Review.create(contact, rating, reviewText, serviceDate)`
- [ ] Validation : impossible de créer 2 reviews pour le même Contact

### Notes techniques
- Le token est généré automatiquement et a une durée de vie de 30 jours
- Le champ `visible` permet la modération manuelle si nécessaire

---

## TICKET-R2: Créer le modèle pour le Bayesian Average
**Type:** Backend - Model

### Description
Implémenter la logique de calcul du Bayesian Average pour les ratings providers.

### Critères d'acceptation
- [ ] Classe utilitaire `BayesianRatingCalculator` dans le package `review/`
- [ ] Méthode `calculateBayesianAverage(currentRating, totalReviews, newRating, platformAverage, minReviews)`
- [ ] Paramètres configurables :
  - `platformAverage` : moyenne globale de la plateforme (ex: 4.0)
  - `minReviews` : nombre minimum d'avis pour stabiliser (ex: 5)
- [ ] Formule : `(totalReviews * currentRating + minReviews * platformAverage + newRating) / (totalReviews + minReviews + 1)`
- [ ] Tests unitaires avec différents scénarios :
  - Provider avec 0 avis → premier avis
  - Provider avec peu d'avis (< minReviews)
  - Provider avec beaucoup d'avis (> minReviews)
  - Vérifier que les nouveaux avis ont moins d'impact sur providers établis

### Notes techniques
- Le Bayesian Average évite qu'un seul avis 5★ donne un rating parfait
- Les nouveaux providers ont un rating qui tend vers la moyenne plateforme au début

---

## TICKET-R3: Créer le Repository pour les Reviews
**Type:** Backend - Repository

### Description
Créer l'interface `ReviewRepository` avec les queries nécessaires.

### Critères d'acceptation
- [ ] Interface `ReviewRepository extends JpaRepository<Review, UUID>`
- [ ] Query: `findByProviderId(UUID providerId)` - tous les avis d'un provider
- [ ] Query: `findByProviderIdAndVisible(UUID providerId, Boolean visible)` - avis visibles uniquement
- [ ] Query: `findByReviewToken(UUID token)` - recherche par token pour soumission
- [ ] Query: `findByContactId(UUID contactId)` - vérifier si un contact a déjà un avis
- [ ] Query: `existsByContactId(UUID contactId)` - vérification rapide
- [ ] Query optimisée avec JOIN FETCH du provider pour l'affichage public
- [ ] Query de stats : `calculateAverageRating(UUID providerId)` - moyenne simple

### Dépendances
- TICKET-R1 doit être complété

---

## TICKET-R4: Créer les DTOs pour les Reviews
**Type:** Backend - DTO

### Description
Créer les DTOs pour les requêtes et réponses liées aux avis.

### Critères d'acceptation
- [ ] `SubmitReviewRequest` : reviewToken, rating, reviewText, serviceDate, photos
- [ ] `ReviewResponse` : id, providerName, rating, reviewText, serviceDate, photos, submittedAt
- [ ] `ProviderReviewsResponse` : providerId, providerName, averageRating, totalReviews, reviews (liste ReviewResponse)
- [ ] Validation Jakarta sur les DTOs :
  - `@NotNull` sur reviewToken et rating
  - `@Min(1) @Max(5)` sur rating
  - `@Size(min=10, max=1000)` sur reviewText
  - `@Past` sur serviceDate
  - `@Size(max=5)` sur photos (max 5 photos)
- [ ] Méthode statique `ReviewResponse.from(Review review)` pour mapping

### Dépendances
- TICKET-R1 doit être complété

---

## TICKET-R5: Implémenter le Service pour les Reviews
**Type:** Backend - Service

### Description
Créer `ReviewService` avec la logique métier pour gérer les avis.

### Critères d'acceptation
- [ ] Méthode `submitReview(SubmitReviewRequest)` :
  - Valider que le token existe et n'est pas expiré
  - Vérifier qu'aucun avis n'existe déjà pour ce contact
  - Créer le review
  - Mettre à jour le rating du provider (via Bayesian Average)
  - Incrémenter le compteur de reviews du provider
  - Marquer le review comme visible par défaut
- [ ] Méthode `getProviderReviews(UUID providerId, Boolean visibleOnly)` - liste des avis
- [ ] Méthode `getReviewById(UUID reviewId)` - détails d'un avis
- [ ] Méthode `hideReview(UUID reviewId)` - modération (admin)
- [ ] Méthode `showReview(UUID reviewId)` - rendre visible (admin)
- [ ] Helper method privée `updateProviderRating(UUID providerId, BigDecimal newRating)` :
  - Récupérer les stats actuelles du provider
  - Calculer le nouveau Bayesian Average
  - Mettre à jour le provider
- [ ] Transaction management avec @Transactional

### Dépendances
- TICKET-R1, TICKET-R2, TICKET-R3, TICKET-R4 doivent être complétés

---

## TICKET-R6: Créer le Controller pour les Reviews
**Type:** Backend - Controller

### Description
Créer `ReviewController` avec les endpoints publics et authentifiés pour les avis.

### Critères d'acceptation
- [ ] `POST /api/v1/reviews` - soumettre un avis (public, via token)
  - Body: SubmitReviewRequest
  - Validation du token dans le request body
  - Retourne ReviewResponse
- [ ] `GET /api/v1/reviews/provider/{providerId}` - avis d'un provider (public)
  - Query param: `visibleOnly` (default: true)
  - Pagination (page, size)
  - Tri par date (desc par défaut)
  - Retourne ProviderReviewsResponse
- [ ] `GET /api/v1/reviews/{id}` - détails d'un avis (public)
  - Retourne ReviewResponse
- [ ] `PATCH /api/v1/reviews/{id}/hide` - cacher un avis (admin seulement - pour plus tard)
- [ ] `PATCH /api/v1/reviews/{id}/show` - montrer un avis (admin seulement - pour plus tard)
- [ ] Gestion des erreurs :
  - Token invalide ou expiré → 400 Bad Request
  - Review déjà soumis pour ce contact → 409 Conflict
  - Review non trouvé → 404 Not Found

### Dépendances
- TICKET-R5 doit être complété

---

## TICKET-R7: Implémenter la génération et validation des tokens de review
**Type:** Backend - Service

### Description
Créer la logique pour générer des tokens sécurisés et les valider lors de la soumission.

### Critères d'acceptation
- [ ] Service `ReviewTokenService` dans le package `review/`
- [ ] Méthode `generateReviewToken(Contact contact)` :
  - Génère un UUID unique
  - Définit une expiration à 30 jours
  - Retourne le token sous forme de string
- [ ] Méthode `validateToken(UUID token)` :
  - Vérifie que le token existe
  - Vérifie qu'il n'est pas expiré
  - Retourne le Contact associé
  - Throw exception si invalide ou expiré
- [ ] Le token est créé lors de la confirmation WhatsApp (Contact passe à CONFIRMED)
- [ ] Méthode `isTokenValid(UUID token)` - vérification rapide boolean

### Notes techniques
- Les tokens sont stockés directement dans l'entité Review (champ reviewToken)
- Un token ne peut être utilisé qu'une seule fois (vérification via existsByContactId)

### Dépendances
- TICKET-R1 doit être complété

---

## TICKET-R8: Créer le système de calcul de la moyenne plateforme
**Type:** Backend - Service

### Description
Calculer automatiquement la moyenne globale des avis de la plateforme pour le Bayesian Average.

### Critères d'acceptation
- [ ] Méthode `calculatePlatformAverage()` dans ReviewService :
  - Calcule la moyenne de tous les ratings visibles
  - Cache le résultat pendant 1 heure
  - Retourne 4.0 par défaut si aucun avis
- [ ] Job planifié (tous les jours à 3h du matin) pour recalculer la moyenne
- [ ] Stocker la valeur en configuration ou cache Redis (pour MVP : variable en mémoire)
- [ ] Méthode `getPlatformAverage()` - récupère la valeur actuelle

### Notes techniques
- Pour le MVP, une simple variable statique en mémoire suffit
- Plus tard, migrer vers Redis ou table de configuration DB

### Dépendances
- TICKET-R5 doit être complété

---

## TICKET-R11: Ajouter les contraintes DB pour l'unicité des reviews
**Type:** Backend - Database

### Description
S'assurer au niveau base de données qu'un contact ne peut avoir qu'un seul avis.

### Critères d'acceptation
- [ ] Contrainte UNIQUE sur la colonne `contact_id` dans la table `reviews`
- [ ] Index sur `provider_id` pour optimiser les requêtes de listing
- [ ] Index sur `review_token` pour optimiser la validation
- [ ] Index sur `visible` pour filtrer les avis visibles rapidement
- [ ] Migration Liquibase ou script SQL pour créer les contraintes
- [ ] Documentation des contraintes dans un README

### Dépendances
- TICKET-R1 doit être complété

---

## Configuration Bayesian Average

### Valeurs recommandées pour le MVP
```yaml
review:
  bayesian:
    platform-average: 4.0  # Moyenne initiale de la plateforme
    min-reviews: 5         # Nombre d'avis fictifs pour stabiliser
    token-expiry-days: 30  # Durée de validité des tokens
```

### Formule Bayesian Average
```
nouvelle_moyenne = (
    (nombre_avis × moyenne_actuelle) + 
    (min_reviews × moyenne_plateforme) + 
    nouveau_rating
) / (nombre_avis + min_reviews + 1)
```

### Exemple concret
- Provider nouveau (0 avis) reçoit un avis de 5★
- Platform average = 4.0, min_reviews = 5
- Calcul : `(0×0 + 5×4.0 + 5) / (0 + 5 + 1) = 25/6 = 4.17★`
- Le provider démarre à 4.17★ au lieu de 5★ (plus réaliste)

---

## Questions Techniques Résolues

1. **Bayesian Average**: Utilisé pour éviter les ratings artificiellement élevés sur peu d'avis ✅
2. **Token expiration**: 30 jours après génération ✅
3. **Unicité review**: Une review max par Contact (contrainte DB) ✅
4. **Modération**: Champ `visible` permet de cacher des avis inappropriés ✅
5. **Photos review**: Max 5 photos par avis, URLs Supabase ✅