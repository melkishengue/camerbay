export const ZITADEL_DOMAIN = process.env.EXPO_PUBLIC_OAUTH_ISSUER;

export const authConfig = {
  issuer: `https://${ZITADEL_DOMAIN}`,
  clientId: process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID as string,
  redirectUrl: "com.camerbay.app://oauth/callback",
  scopes: [
    "openid",
    "profile",
    "email",
    "offline_access",
    `urn:zitadel:iam:org:id:${process.env.EXPO_PUBLIC_OAUTH_ORG_ID}`
  ],
  organizationId: process.env.EXPO_PUBLIC_OAUTH_ORG_ID as string
};

export const ZITADEL_USERINFO_ENDPOINT = `https://${ZITADEL_DOMAIN}/oidc/v1/userinfo`;
