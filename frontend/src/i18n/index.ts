import { fr } from "./locales/fr";

export type Locale = "fr";
export type ErrorMessages = typeof fr.errors;
export type ErrorMessageKey = keyof ErrorMessages;

const locales: Record<Locale, typeof fr> = { fr };

let currentLocale: Locale = "fr";

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

/** Translate an API error code to a user-facing message. */
export function tError(code: string): string {
  const messages = locales[currentLocale].errors as Record<string, string>;
  return messages[code] ?? messages.UNKNOWN_ERROR;
}
