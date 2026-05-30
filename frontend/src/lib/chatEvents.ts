type Listener = (channelId: string) => void;
const listeners = new Set<Listener>();

export const chatEvents = {
  emit(channelId: string) {
    listeners.forEach((l) => l(channelId));
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
