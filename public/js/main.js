async function init() {
    await SWWrapper.registerGlobal(navigator, "/sw.js");

    console.log("[Service Worker] registered");

    const response = await PNWrapper.requestPermission();
    console.log("Notify Request Permission: ", response);

    const globalPusher = new PNWrapper(
        SWWrapper.getGlobal().getRegistration().pushManager,
        Notification,
        {
            applicationServerKey: "<FCM_PUBLIC_KEY>"
        }
    );

    PNWrapper.setGlobal(globalPusher);
}

init();

async function subscribe() {
    try {
        const globalPusher = PNWrapper.getGlobal();

        const subscription = await globalPusher.subscribeIfNotExist();
        console.log("PERMISSION_GRANTED");
        console.log(subscription);
        return await fetch("/push/subscribe", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: JSON.stringify({
                endpoint: subscription
            })
        });
    } catch (err) {
        if (Notification.permission === "denied") {
            console.warn(
                `PERMISSION_DENIED: Permission for notifications was denied: ${err}`
            );
            throw new Error(`PERMISSION_DENIED`);
        }

        console.error(
            "SUBSCRIBE_USER_FAILED: Failed to subscribe the user: ",
            err
        );
        throw new Error(`SUBSCRIBE_USER_FAILED`);
    }
}

async function unsubscribe() {
    if (!SWWrapper.getGlobal().getRegistration()) {
        console.warn("USER_NOT_SUBSCRIBED_YET");
        return;
    }

    try {
        const subscription = await PNWrapper.getGlobal().unsubscribeIfExist();
        fetch("/push/subscribe", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: JSON.stringify({
                endpoint: subscription
            })
        });
        console.log("Unsubscription successful");
    } catch (error) {
        console.log("UNSUBSCRIPTION_FAILED: Error unsubscribing", error);
        throw new Error("UNSUBSCRIPTION_FAILED");
    }
}

function showalert() {
    fetch("/push/alert", { method: "GET" });
}
