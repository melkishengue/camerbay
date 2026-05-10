import ScreenContainer from "@/components/screenContainer";
import React from "react";
import { Text, View } from "react-native";

export default function LegalNoticesScreen() {
  return (
    <ScreenContainer withSchrollView>
      <View className="pb-8">
        <Text className="text-2xl font-bold text-foreground mb-4">
          Mentions Légales
        </Text>
        <Text className="text-sm text-muted mb-6">
          Dernière mise à jour : 15 février 2026
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          1. Éditeur de l&apos;Application
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          L&apos;application Camerbay est éditée par la société Camerbay SAS, au
          capital de [montant] euros, immatriculée au Registre du Commerce et des
          Sociétés de [ville] sous le numéro [numéro RCS].{"\n\n"}
          Siège social : [adresse complète]{"\n"}
          Téléphone : [numéro]{"\n"}
          E-mail : contact@camerbay.com{"\n"}
          Directeur de la publication : [nom du directeur]
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          2. Hébergement
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          L&apos;Application et ses données sont hébergées par :{"\n\n"}
          [Nom de l&apos;hébergeur]{"\n"}
          [Adresse de l&apos;hébergeur]{"\n"}
          [Numéro de téléphone de l&apos;hébergeur]
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          3. Propriété intellectuelle
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          L&apos;ensemble des contenus présents sur l&apos;Application (textes, images,
          logos, icônes, sons, logiciels) est protégé par les lois relatives à la
          propriété intellectuelle. Toute reproduction, représentation ou
          diffusion, en tout ou partie, du contenu de l&apos;Application est interdite
          sans autorisation préalable.
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          4. Protection des données personnelles
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          Conformément à la loi « Informatique et Libertés » du 6 janvier 1978
          modifiée et au Règlement Général sur la Protection des Données (RGPD),
          vous disposez de droits sur vos données personnelles. Pour plus de
          détails, consultez notre Politique de Confidentialité.
        </Text>

        <Text className="text-lg font-bold text-foreground mb-2">
          5. Contact
        </Text>
        <Text className="text-foreground leading-6 mb-4">
          Pour toute question ou réclamation concernant l&apos;Application, vous pouvez
          nous contacter :{"\n\n"}
          Par e-mail : contact@camerbay.com{"\n"}
          Par courrier : [adresse postale complète]
        </Text>
      </View>
    </ScreenContainer>
  );
}
