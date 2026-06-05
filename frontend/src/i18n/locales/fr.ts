export const fr = {
  errors: {
    // User
    USER_NOT_FOUND: "Utilisateur introuvable.",

    // Offer
    OFFER_NOT_FOUND: "Cette offre est introuvable.",
    OFFER_MAX_ACTIVE_REACHED:
      "Vous avez atteint la limite de 50 offres actives.",
    OFFER_ACCESS_DENIED: "Vous n'êtes pas autorisé à modifier cette offre.",

    // Category
    CATEGORY_NOT_FOUND: "Catégorie introuvable.",

    // Conversation
    CONVERSATION_NOT_FOUND: "Conversation introuvable.",
    CONVERSATION_ACCESS_DENIED: "Vous n'avez pas accès à cette conversation.",

    // Phone
    PHONE_INVALID:
      "Numéro de téléphone invalide. Il doit commencer par + suivi de l'indicatif pays (ex: +49 17643244788).",

    // Price
    PRICE_NEGATIVE: "Le prix ne peut pas être négatif.",
    PRICE_EXCEEDS_MAX: "Le prix ne peut pas dépasser 100 000 €.",
    PRICE_PROMO_INVALID:
      "Le prix promotionnel doit être inférieur au prix normal.",

    // System
    VALIDATION_ERROR: "Données invalides. Veuillez vérifier le formulaire.",
    MISSING_HEADER: "Requête invalide.",
    INTERNAL_ERROR: "Une erreur interne est survenue. Veuillez réessayer.",
    UNKNOWN_ERROR: "Une erreur est survenue. Veuillez réessayer."
  }
} as const;
