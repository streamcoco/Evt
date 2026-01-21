
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    await Notification.requestPermission();
  }
};

export const sendNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: '/icon.png', // Fallback if no icon
    });
  }
};
