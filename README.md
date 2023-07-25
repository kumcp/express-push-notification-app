# Noti-server

This is a server written in Express to send push notification to the noti-app in o ther folder.

# Serve the server with:

```
DEBUG=noti-server:* npm start
```

# Instruction on configuration the push notification

Before you create the push notification, you will need to do these following steps:

## 1. Config `service-worker.js`

Express server has already configured the `/{file}` map to `./public/`, just put the `sw.js` into this folder.

## 2. Update `manifest.json`

`manifest.json` is a file served in the root path: `example.com/manifest.json`, contains pwa app and directory to service worker.

In `manifest.json`, there is 1 place to config: `gcm_sender_id`, you will need to get this from

## 3. Use Firebase Cloud Messaging API

Enable FCM API [Link](https://console.cloud.google.com/apis/api/fcm.googleapis.com/metrics)

You will need to config inside Push Notification in Server side `./routes/push-noti.js`:

```
{
    gcmAPIKey: "<GOOGLE_CLOUD_MESSAGE_SERVER_KEY>",
    TTL: 2419200, // Default to 4 weeks!
    vapidDetails: {
        subject: `mailto:<your-email>`,
        publicKey: "<WEB_PUSHER_CERTIFICATE_PUBLIC_KEY>",
        privateKey: "<WEB_PUSHER_CERTIFICATE_PRIVATE_KEY>"
    }
}
```

In the client side, you will need to config `./public/js/main.js`. This is an actual 4 action in client side you will need to:

-   init
-   subscribe (send endpoint to server)
-   unsubscribe (send endpoint to server)
-   send alert (config parameters)

This is a pretty simple demo using express, to show you an example of using service worker and push notification using Firebase Cloud Messaging.
