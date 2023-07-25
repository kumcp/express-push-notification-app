const EventTag = {
    MESSAGE: "message",
    NOTIFICATION: "notification",
    WARNING: "warning",
    SUCCESSFUL: "successful",
    TEST: "test",
    ACTION_LIST: "action-list"
};

class PushNotificationTemplate {
    static validate(clients, event) {
        return PushNotificationTemplate.checkBrowserShouldShow(clients, event);
    }

    /**
     * Check if notification should show with the current browser
     *
     * @param {*} windowClients window tab clients from browser
     * @param {*} event push event payload received from server
     *
     * @returns {Boolean} should show noti or not
     */
    static checkBrowserShouldShow(windowClients, event) {
        if (windowClients.length === 0) {
            // Always show push notification when open no tab
            // Show notification when client not open browser or focus on our page.
            return true;
        }

        // If All event tag is valid -> show
        if (Object.values(EventTag).indexOf(event.tag) > -1) {
            return true;
        }

        const shouldShowPushNoti =
            windowClients
                .map(client =>
                    PushNotificationTemplate.checkTabShouldShow(client, event)
                )
                .filter(result => result).length > 0;

        return shouldShowPushNoti;
    }

    /**
     * Validate for each tab page
     * NOTE: notification shows once
     * @param {*} client window tab client from browser
     * @param {*} event push event payload received from server
     */
    static checkTabShouldShow(client, event) {
        if (event && "focus" in client) {
            return !client.focused;
        }
        return true;
    }

    static generateTemplate(clients, event) {
        let body = {};
        if (event.data) {
            body = event.data.json();
        }

        return {
            title: body.title || "You got a notification",
            body: body.message,
            tag: body.tag || EventTag.TEST, // will group all notification together without create new one, so not annoying user
            renotify: body.renotify || false, // still keep notify user but without create new one.
            icon: body.icon || "/img/icons/android-chrome-192x192.png",
            badge: body.badge || "/img/icons/favicon-32x32.png",
            vibrate: body.vibrate || [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                url: body.url
            },
            actions: body.actions || []
        };
    }
}

/**
 * Action right before receiving push notification
 */
self.addEventListener("push", event => {
    const promiseChain = clients
        .matchAll({
            type: "window"
        })
        .then(windowClients => {
            if (PushNotificationTemplate.validate(windowClients, event)) {
                const options = PushNotificationTemplate.generateTemplate(
                    windowClients,
                    event
                );
                return self.registration.showNotification(
                    options.title || "Notification",
                    options
                );
            }
            return Promise.resolve();

            // DO NOTHING CAUSE APPLICATION IS ALREADY OPEN
            // THIS WILL CAUSE A DIALOG TO SHOW ON MOBILE BROWSER CAUSE SERVICE WORKER HAS
            // NOT SHOW THE NOTIFICATION YET
            // Generally as soon as you receive a push message from GCM (Google Cloud Messaging)
            // you have to show a push notification in the browser
        });
    event.waitUntil(promiseChain);
});

/**
 * Action when click to notification.
 */
self.addEventListener("notificationclick", event => {
    const { notification, action } = event;

    const urlEndpoint = notification.data.url;

    self.registration.getNotifications().then(notifications => {
        notifications.forEach(noti => {
            noti.close();
        });
    });

    if (action !== "close") {
        const promiseChain = clients
            .matchAll({
                type: "window",
                includeUncontrolled: true
            })
            .then(windowClients => {
                const matchingClient = windowClients.find(windowClient => {
                    return windowClient.url === urlEndpoint;
                });

                if (matchingClient) {
                    return matchingClient.focus();
                }
                return clients.openWindow(urlEndpoint);
            });
        event.waitUntil(promiseChain);
    }
});
