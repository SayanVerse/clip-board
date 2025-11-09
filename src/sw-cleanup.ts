export async function cleanupServiceWorkers() {
  if (typeof window === "undefined") return;
  if ("serviceWorker" in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      const hadSW = regs.length > 0;
      await Promise.all(regs.map((r) => r.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      console.info("[SW] Cleaned up old service workers and caches");
      if (hadSW) {
        setTimeout(() => window.location.reload(), 100);
      }
    } catch (err) {
      console.warn("[SW] Cleanup failed", err);
    }
  }
}
