var express = require("express");
var router = express.Router();

var WebPush = require("../common/WebPushServer");

WebPush.initGlobal({
    gcmAPIKey: "<GOOGLE_CLOUD_MESSAGE_SERVER_KEY>",
    TTL: 2419200, // Default to 4 weeks!
    vapidDetails: {
        subject: `mailto:kum.cp0@gmail.com`,
        publicKey: "<FCM_PUBLIC_KEY>",
        privateKey: "<FCM_PRIVATE_KEY>"
    }
});

const subscribers = [];

router.post("/subscribe", function (req, res, next) {
    subscribers.push(JSON.stringify(req.body.endpoint));
    return res.json({ message: "SUBCRIBED" });
});

router.post("/unsubscribe", function (req, res, next) {
    subscribers.filter(
        subscribe => subscribe !== JSON.stringify(req.body.endpoint)
    );

    return res.json({ message: "UNSUBCRIBED" });
});

router.get("/alert", function (req, res, next) {
    subscribers.map(subscriber => {
        const payload = JSON.stringify({
            message: "Test",
            tag: "Tag"
        });
        const subscriberKey = JSON.parse(subscriber);
        return WebPush.getGlobalInstance().sendPushNotification(
            subscriberKey,
            payload
        );
    });

    return res.json({ message: "RECEIVED" });
});

router.get("/", function (req, res, next) {
    return res.json({ message: "RECEIVED" });
});

module.exports = router;
