import ScreenContainer from "@/components/screenContainer";
import React from "react";
import { Text, View } from "react-native";

export default function LegalTermsScreen() {
  return (
    <ScreenContainer withSchrollView>
      <View className="pb-8">
        <Text className="text-2xl font-bold text-foreground mb-4">
          Conditions Générales d&apos;Utilisation
        </Text>
        <Text className="text-sm text-muted mb-6">
          Dernière mise à jour : 15 février 2026
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          1. Objet
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU ») ont
          pour objet de définir les modalités et conditions d&apos;utilisation de
          l&apos;application mobile Camerbay (ci-après « l&apos;Application »), ainsi que
          les droits et obligations des utilisateurs.
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          2. Acceptation des CGU
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          L&apos;utilisation de l&apos;Application implique l&apos;acceptation pleine et entière
          des présentes CGU. Si vous n&apos;acceptez pas ces conditions, veuillez ne
          pas utiliser l&apos;Application.
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          3. Description des services
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          Camerbay est une plateforme de mise en relation entre des prestataires
          de services et des clients. L&apos;Application permet aux utilisateurs de
          rechercher, publier et répondre à des offres de services dans
          différentes catégories.
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          4. Inscription et compte utilisateur
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          Pour accéder à certaines fonctionnalités de l&apos;Application, l&apos;utilisateur
          doit créer un compte. L&apos;utilisateur s&apos;engage à fournir des informations
          exactes et à les maintenir à jour. Il est responsable de la
          confidentialité de ses identifiants de connexion.
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          5. Obligations des utilisateurs
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          L&apos;utilisateur s&apos;engage à utiliser l&apos;Application conformément à sa
          destination et aux lois en vigueur. Il est interdit de publier du
          contenu illicite, diffamatoire, ou portant atteinte aux droits de tiers.
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          6. Responsabilité
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          Camerbay agit en tant qu&apos;intermédiaire et ne saurait être tenu
          responsable des transactions entre les utilisateurs. L&apos;Application est
          fournie « en l&apos;état » sans garantie d&apos;aucune sorte.
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          7. Modification des CGU
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          Camerbay se réserve le droit de modifier les présentes CGU à tout
          moment. Les utilisateurs seront informés de toute modification
          significative. La poursuite de l&apos;utilisation de l&apos;Application après
          modification vaut acceptation des nouvelles CGU.
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          8. Droit applicable
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          Les présentes CGU sont régies par le droit français. En cas de litige,
          les tribunaux compétents seront ceux du ressort du siège social de
          Camerbay.
        </Text>
      </View>
    </ScreenContainer>
  );
}
