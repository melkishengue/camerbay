import ScreenContainer from "@/components/screenContainer";
import React from "react";
import { Text, View } from "react-native";

export default function LegalPrivacyScreen() {
  return (
    <ScreenContainer withSchrollView>
      <View className="pb-8">
        <Text className="text-2xl font-bold text-foreground mb-4">
          Politique de Confidentialité
        </Text>
        <Text className="text-sm text-muted mb-6">
          Dernière mise à jour : 15 février 2026
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          1. Collecte des données
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          Dans le cadre de l&apos;utilisation de l&apos;Application Camerbay, nous
          collectons les données personnelles suivantes : nom, prénom, adresse
          e-mail, numéro de téléphone, photo de profil, et données de
          localisation. Ces données sont nécessaires au fonctionnement du service.
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          2. Finalités du traitement
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          Vos données personnelles sont traitées pour les finalités suivantes :
          gestion de votre compte utilisateur, mise en relation avec des
          prestataires, envoi de notifications relatives à vos demandes, et
          amélioration de nos services.
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          3. Base légale du traitement
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          Le traitement de vos données repose sur votre consentement lors de la
          création de votre compte, ainsi que sur l&apos;exécution du contrat qui nous
          lie (les CGU). Certains traitements peuvent également reposer sur notre
          intérêt légitime.
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          4. Durée de conservation
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          Vos données personnelles sont conservées pendant la durée de votre
          utilisation du service, puis pendant une durée de 3 ans à compter de
          votre dernière activité, conformément aux obligations légales.
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          5. Partage des données
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          Vos données peuvent être partagées avec les autres utilisateurs de la
          plateforme dans le cadre de la mise en relation. Nous ne vendons jamais
          vos données personnelles à des tiers. Nos sous-traitants techniques
          (hébergement, messagerie) ont accès aux données dans la stricte mesure
          nécessaire à leurs prestations.
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          6. Vos droits
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          Conformément au RGPD, vous disposez des droits suivants : droit
          d&apos;accès, de rectification, d&apos;effacement, de limitation du traitement,
          de portabilité des données, et d&apos;opposition. Pour exercer ces droits,
          contactez-nous à l&apos;adresse indiquée dans les Mentions Légales.
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          7. Cookies et traceurs
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          L&apos;Application peut utiliser des technologies de suivi pour améliorer
          l&apos;expérience utilisateur et analyser l&apos;utilisation du service. Vous
          pouvez gérer vos préférences dans les paramètres de votre appareil.
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          8. Sécurité
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          Nous mettons en œuvre des mesures techniques et organisationnelles
          appropriées pour protéger vos données personnelles contre tout accès non
          autorisé, perte, ou altération.
        </Text>
      </View>
    </ScreenContainer>
  );
}
