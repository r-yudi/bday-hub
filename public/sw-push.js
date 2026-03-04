/* Minimal Service Worker for Web Push. No fetch/cache. */
self.addEventListener("push", function (event) {
  var payload = { title: "Lembra", body: "Hoje tem aniversário!", url: "/today" };
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (_) {}
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "Lembra", {
      body: payload.body || "",
      icon: "/icon-192.png",
      badge: "/icon-72.png",
      data: { url: payload.url || "/today" }
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/today";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if (clientList[i].url && "focus" in clientList[i]) {
          clientList[i].navigate(url);
          return clientList[i].focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
