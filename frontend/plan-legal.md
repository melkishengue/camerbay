# Legal Pages Implementation Research

Research on how marketplace apps handle legal pages (terms, privacy, imprint, etc.) in mobile apps, with a focus on French/EU marketplace requirements.

---

## 1. What Legal Pages Marketplace Apps Include

### Common Legal Pages Across Major Marketplaces

| Page | eBay | Kleinanzeigen | Leboncoin | Vinted |
|------|------|---------------|-----------|--------|
| Terms of Service / CGU | Yes | Yes | Yes | Yes |
| Privacy Policy | Yes | Yes | Yes | Yes |
| Cookie Policy / Settings | Yes | Yes | Yes | Yes |
| Imprint / Mentions Legales | Yes | Yes (for sellers) | Yes | Yes |
| Terms of Sale / CGV | Yes | N/A | Yes | Yes |
| Open Source Licenses | Yes | Yes | Yes | Yes |
| Community Guidelines | Yes | Yes | Yes | Yes (Catalog Rules) |

### Breakdown of Each Page

**CGU (Conditions Generales d'Utilisation / Terms of Use)**
- Defines rules for accessing and using the platform
- Covers user rights and obligations, account rules, content policies
- Mandatory for all digital platforms in France

**CGV (Conditions Generales de Vente / Terms of Sale)**
- Governs commercial transactions on the marketplace
- Required when payments are processed through the app
- Must include information on pricing, payment methods, refunds, and dispute resolution

**Mentions Legales (Legal Notices / Imprint)**
- Required by French law (LCEN - Loi pour la Confiance dans l'Economie Numerique)
- Must include: company name, registered address, company registration number (SIRET/SIREN), publication director name, hosting provider information, contact email/phone

**Politique de Confidentialite (Privacy Policy)**
- Required by RGPD (GDPR) and French data protection law (Loi Informatique et Libertes)
- Must detail: what data is collected, purposes, legal basis, retention periods, user rights (access, rectification, erasure, portability, opposition), DPO contact information

**Politique de Cookies (Cookie Policy)**
- Required by ePrivacy Directive (transposed in French law)
- Must explain cookie types, purposes, and provide opt-in/opt-out mechanism
- Vinted provides cookie settings accessible via Profile > Cookie Settings

**Licences Open Source (Open Source Licenses)**
- Acknowledgement of third-party libraries used in the app
- Required by MIT, BSD, Apache 2.0, and similar licenses
- Tools like `react-native-legal` or `react-native-oss-license` can auto-generate these

---

## 2. Where Legal Pages Are Accessible in the App

### Placement Patterns Observed

**A. Account / Profile Tab (Primary Location)**
- **Vinted**: Profile > Settings contains links to Terms & Conditions, Privacy Policy, Cookie Settings
- **Leboncoin**: Account section contains links to CGU, CGV, Mentions Legales
- **Kleinanzeigen**: "Meins" (My) section > settings area for legal information
- **eBay**: Account tab > Settings or "About" section

**B. Registration / Sign-Up Flow**
- All major marketplaces display Terms of Service and Privacy Policy links during account creation
- Typically shown as clickable links near the "Sign Up" or "Create Account" button
- Pattern: "By creating an account, you agree to our [Terms of Use] and [Privacy Policy]"
- Clickwrap or sign-in wrap consent methods are used

**C. Settings Screen**
- Legal pages are commonly grouped under a "Legal" or "About" section at the bottom of settings
- Typical grouping:
  - **About section**: App version, Open source licenses
  - **Legal section**: Terms of Service, Privacy Policy, Cookie Policy, Legal Notices

**D. App Footer / Bottom of Scrollable Pages**
- On web versions, footer links are standard
- On mobile, this pattern is less common due to infinite scroll and limited screen space
- Some apps place legal links at the very bottom of long scrollable settings/account screens

### Recommended Placement Summary

| Location | Priority | Pages to Include |
|----------|----------|-----------------|
| Account/Profile tab > Settings | Primary | All legal pages |
| Registration flow | Required | CGU + Privacy Policy (with consent) |
| App "About" section | Secondary | Version, Licenses, Legal Notices |
| In-app purchase flows | Contextual | CGV, Refund policy |

---

## 3. How Legal Pages Are Displayed

### Three Main Approaches

**A. In-App WebView (`react-native-webview`)**
- Content is rendered inside the app using a WebView component
- Pros: Seamless experience, consistent navigation, full control over styling
- Cons: Requires hosting legal pages as web content, more complex to implement
- Used when legal content is hosted on a website and needs to look integrated

**B. System Browser Modal (`expo-web-browser`)**
- Opens legal content in a native browser overlay (Safari View Controller on iOS, Chrome Custom Tabs on Android)
- Pros: Simple implementation, native feel, does not affect app's age rating (no "unrestricted web access"), content updates independently
- Cons: Less integrated look, user briefly leaves the app context
- Recommended for Expo apps - the browser modal does not allow URL navigation, providing security
- Important: Using WebBrowser for legal pages only does NOT trigger the "Unrestricted Web Access" flag in App Store content ratings

**C. Native Screens (ScrollView with Text)**
- Legal content rendered as native React Native components
- Pros: Full control over styling, works offline, most integrated experience
- Cons: Harder to update (requires app update), difficult to format long legal text
- Best for short, rarely-changing content like Legal Notices/Imprint

### What Major Apps Use

| App | Approach |
|-----|----------|
| eBay | WebView for detailed policies, native for settings links |
| Vinted | Mix of WebView and native screens |
| Leboncoin | WebView loading web-hosted CGU/CGV pages |
| Most React Native apps | expo-web-browser or react-native-webview |

### Recommendation for Expo/React Native

- Use `expo-web-browser` (WebBrowser.openBrowserAsync) for linking to externally hosted legal pages -- simplest approach, no age rating impact
- Alternatively use `react-native-webview` for a more integrated look
- For static content like Mentions Legales or app version info, use native screens

---

## 4. UX Patterns: Organization and Presentation

### Common Grouping Patterns

**Pattern A: Flat List in Settings (Most Common)**
```
Account / Profile
  > Settings
    > ...other settings...
    ─────────────────
    Legal
      Terms of Use
      Privacy Policy
      Cookie Policy
      Legal Notices
    ─────────────────
    About
      App Version 1.0.0
      Open Source Licenses
```

**Pattern B: Dedicated "Legal" or "About" Sub-Screen**
```
Account / Profile
  > Settings
    > Legal & About
        Terms of Use
        Privacy Policy
        Cookie Policy
        Legal Notices
        Open Source Licenses
        App Version
```

**Pattern C: Combined in Account Tab Bottom (Leboncoin-style)**
```
Account Tab
  [User Profile Card]
  [My Listings]
  [My Purchases]
  [Settings]
  ...
  ─────────────────
  Terms of Use
  Privacy Policy
  Legal Notices
  App Version 1.0.0
```

### UX Best Practices

1. **Consistent accessibility**: Legal pages should be reachable from a main navigation area (Account/Profile tab) within 2 taps maximum
2. **Group together**: All legal links should be grouped in a clearly labeled section ("Legal", "Informations legales", etc.)
3. **Place at bottom**: Legal links are low-priority for most users, so they should be at the bottom of settings/account screens
4. **Use clear labels**: Avoid jargon; use straightforward French labels like "Conditions d'utilisation", "Politique de confidentialite", "Mentions legales"
5. **Show app version**: Include the app version number near legal pages (commonly in an "About" section) -- helps with support and bug reports
6. **Don't hide behind too many taps**: Users should find legal information easily; 65% of consumers say they are hesitant to read fine print because it is time-consuming
7. **Registration consent**: Always show clickable links to CGU and Privacy Policy during signup with an explicit consent mechanism

### Suggested French Labels

| English | French Label |
|---------|-------------|
| Terms of Use | Conditions generales d'utilisation (CGU) |
| Terms of Sale | Conditions generales de vente (CGV) |
| Privacy Policy | Politique de confidentialite |
| Cookie Policy | Politique de cookies |
| Legal Notices | Mentions legales |
| Open Source Licenses | Licences open source |
| About | A propos |
| App Version | Version de l'application |

---

## 5. Legal Requirements for EU/French Marketplace Apps

### French Law Requirements

**LCEN (Loi pour la Confiance dans l'Economie Numerique)**
- Mentions legales are mandatory and must be "easily accessible" from every page/screen
- Required information: company name, address, SIRET/SIREN, publication director, hosting provider, contact details
- Penalty for non-compliance: up to 1 year imprisonment and 75,000 EUR fine for individuals, 375,000 EUR for companies

**Code de la Consommation (Consumer Code)**
- CGV must be provided to consumers before any purchase
- Pre-contractual information requirements: product description, price, delivery terms, withdrawal rights
- 14-day withdrawal right (droit de retractation) for online purchases

**Loi Informatique et Libertes + RGPD/GDPR**
- Privacy policy must be available and detail all data processing activities
- Must inform users of their rights: access, rectification, erasure, portability, opposition
- Must identify the Data Protection Officer (DPO) if applicable
- Must specify data retention periods
- Missing required RGPD information can result in fines up to 20 million EUR or 4% of annual turnover

### EU Digital Services Act (DSA) - Applicable Since February 2024

- Online marketplaces must verify and display seller contact information
- Must provide transparency reports on content moderation
- Must offer clear mechanisms for users to report illegal content
- Must not use "dark patterns" or deceptive design in the interface
- Must provide clear terms of service that explain content moderation policies
- Enforcement is active: fines of up to 6% of global annual turnover for non-compliance

### App Store Requirements

**Apple App Store**
- Privacy policy URL is mandatory in App Store Connect
- Must include a privacy policy link accessible within the app
- App Privacy "nutrition labels" must be filled out accurately

**Google Play Store**
- Privacy policy link is mandatory on the store listing page
- Privacy policy must also be accessible within the app
- Must complete the Data Safety section
- Apps that fail to comply may be suspended or removed
- The privacy policy must be publicly accessible, non-editable, and not in PDF format

### Consent Requirements

- **RGPD**: Consent must be freely given, specific, informed, and unambiguous
- **ePrivacy**: Prior consent required for non-essential cookies and trackers
- **Registration flow**: Must use "clickwrap" (checkbox/button) or clearly visible "sign-in wrap" (notice stating that creating an account implies consent to terms)
- Pre-checked consent boxes are NOT valid under EU law

---

## 6. Implementation Considerations for React Native / Expo

### Recommended Tools

| Tool | Purpose |
|------|---------|
| `expo-web-browser` | Open legal pages in system browser modal |
| `react-native-webview` | Embed legal pages in-app |
| `react-native-legal` | Auto-generate open source license acknowledgements |
| `react-native-oss-license` | Generate license lists for iOS and Android |

### Architecture Recommendations

1. **Host legal pages on a web server** (e.g., the backend or a static site) so they can be updated without app releases
2. **Use `expo-web-browser`** to open them from within the app -- simplest, most maintainable approach
3. **For the Mentions Legales screen**, consider a native screen since the content is short and static
4. **For Open Source Licenses**, use `react-native-legal` from Callstack to auto-generate the list from `package.json`
5. **During registration**, show inline links to CGU and Privacy Policy that open via WebBrowser
6. **Add a "Legal" section** at the bottom of the Account tab or in a Settings sub-screen

### Suggested Screen Structure for Camerbay

```
Account Tab (Compte)
  [User Profile]
  [Mes annonces]
  [Parametres]
  ...
  ─────────────────────────
  Informations legales
    > Conditions d'utilisation (CGU)     -> opens web browser
    > Conditions de vente (CGV)          -> opens web browser
    > Politique de confidentialite       -> opens web browser
    > Mentions legales                   -> native screen or web browser
    > Licences open source               -> native screen (auto-generated)
  ─────────────────────────
  A propos
    Version 1.0.0
```

And in the Registration flow:
```
[Email field]
[Password field]
[x] J'accepte les [Conditions d'utilisation] et la [Politique de confidentialite]
[Creer un compte]
```

---

## Sources

- [Kleinanzeigen Help Center - Impressum](https://hilfe.kleinanzeigen.de/hc/de/articles/17101949468572)
- [Kleinanzeigen - Rechtliche Angaben](https://hilfe-gewerblich.kleinanzeigen.de/artikel/rechtliche-angaben)
- [eBay Mobile Application Terms of Use](https://www.ebay.com/help/policies/listing-policies/mobile-devices-terms?id=4633)
- [eBay User Privacy Notice](https://www.ebay.com/help/policies/member-behaviour-policies/user-privacy-notice-privacy-policy?id=4260)
- [eBay User Agreement](https://www.ebay.com/help/policies/member-behaviour-policies/user-agreement?id=4259)
- [Leboncoin CGU](https://www.leboncoin.fr/dc/cgu)
- [Leboncoin CGV](https://www.leboncoin.fr/dc/cgv)
- [Leboncoin Mentions Legales](https://assistance.leboncoin.info/hc/fr/sections/360000012160-Mentions-l%C3%A9gales)
- [Vinted Terms and Conditions](https://www.vinted.com/terms_and_conditions)
- [Vinted Privacy Policy](https://www.vinted.com/privacy-policy)
- [Vinted Cookie Policy](https://www.vinted.com/cookie-policy)
- [Momentech - Mentions legales obligatoires pour une plateforme](https://momentech.fr/mentions-legales-obligatoires-plateforme-numerique/)
- [FranceNum - Mentions legales pour un site internet](https://www.francenum.gouv.fr/guides-et-conseils/developpement-commercial/site-web/quelles-sont-les-mentions-legales-pour-un-site)
- [Deshoulieres Avocats - Obligations legales des marketplaces](https://www.deshoulieres-avocats.com/avocat-marketplace-quelles-sont-les-obligations-legales-des-marketplaces/)
- [Kreezalid - Reglementation des marketplaces en France](https://www.kreezalid.com/fr/blog/78562-reglementation-des-marketplaces-en-france-en-2022)
- [Martin Avocat - CGV CGU Mentions legales differences](https://martin.avocat.fr/cgv-cgu-mentions-legales-differences/)
- [CaptainContrat - CGV conformes au RGPD](https://www.captaincontrat.com/contrats-commerciaux-cgv/cgv-cgu-cga/cgv-rgpd)
- [EU Digital Services Act](https://digital-strategy.ec.europa.eu/en/policies/digital-services-act)
- [EU DSA Marketplace Obligations](https://www.complianceandrisks.com/blog/online-marketplaces-are-accountable-for-products-sold-on-their-platforms-eu-digital-services-act/)
- [Jake Sparling - Legal pages in React Native apps](https://www.jsparling.com/setting-up-privacy-policy-and-terms-and-conditions-for-react-native-apps/)
- [Callstack - React Native Legal](https://www.callstack.com/blog/react-native-legal-acknowledge-open-source-libraries-in-your-app)
- [react-native-legal on GitHub](https://github.com/callstackincubator/react-native-legal)
- [Expo WebBrowser Documentation](https://docs.expo.dev/versions/latest/sdk/webbrowser/)
- [Expo WebView Documentation](https://docs.expo.dev/versions/latest/sdk/webview/)
- [Termly - App Terms and Conditions](https://termly.io/resources/templates/app-terms-and-conditions/)
- [TermsFeed - Terms and Conditions for Mobile Apps](https://www.termsfeed.com/blog/sample-mobile-app-terms-conditions-template/)
- [Usercentrics - App Terms and Conditions](https://usercentrics.com/guides/terms-of-service/app-terms-and-conditions/)
- [SetProduct - App Settings UI Design](https://www.setproduct.com/blog/settings-ui-design)
- [Google Play Store Privacy Policy Requirements](https://termly.io/resources/articles/google-play-store-privacy-policy-updates/)
- [Google Play - Prepare your app for review](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en)
