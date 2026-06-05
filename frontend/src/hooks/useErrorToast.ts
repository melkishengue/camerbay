import { useToast } from "heroui-native";
import { tError } from "@/i18n";
import { extractApiError } from "@/utils/apiError";

/**
 * Returns a `showError` function that extracts the error code from any
 * thrown value (typically an Axios error), translates it, and shows a
 * danger toast. Centralised so all components stay DRY and i18n-ready.
 */
export function useErrorToast() {
  const { toast } = useToast();

  function showError(error: unknown) {
    const { code } = extractApiError(error);
    const message = tError(code);

    toast.show({
      duration: 3000,
      variant: "danger",
      label: "Oops!",
      description: message,
      actionLabel: "Fermer",
      onActionPress: ({ hide }) => hide(),
    });
  }

  return { showError };
}
