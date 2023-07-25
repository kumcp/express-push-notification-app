const wp = require('web-push');

let globalWebPush;

const defaultOptions = {
    force: false
};

/**
 * A class wrapping web-push, and handle server push notification
 */
class WebPushServer {
    /**
     * Create global Web Push with passing options
     *
     * Refer to [web-push](https://www.npmjs.com/package/web-push) library for more
     *
     * @param {*} options
     */
    static initGlobal(options) {
        globalWebPush = new WebPushServer(options);
        return globalWebPush;
    }

    /**
     * Set global web push for the whole project (singleton)
     * You can access by calling `WebPushServer.getGlobalInstance()`
     *
     * @param {WebPushServer} webPush passing a global WebPush object
     */
    static setGlobalInstance(webPush, options = {}) {
        const opt = {
            ...defaultOptions,
            ...options
        };

        if (!(webPush instanceof WebPushServer)) {
            console.error('Passing object is not an instance of WebPush');
            throw new Error('NOT_A_WEBPUSH_OBJECT');
        }

        if (globalWebPush) {
            if (!opt.force) {
                console.error('Web Push global has already been created.');
                console.info('Using `options.force`=true to overwrite');
                throw new Error('WEBPUSH_OBJECT_EXISTED');
            }
        }

        this.globalWebPush = webPush;
    }

    /**
     * Get global web push
     *
     * @returns {WebPushServer} a global WebPush object
     */
    static getGlobalInstance() {
        return globalWebPush;
    }

    constructor(options) {
        if (options) {
            this.options = options;
        }
    }

    /**
     * Set options for WebPush object
     * @param {*} options
     */
    setOptions(options) {
        this.options = options;
    }

    /**
     * Send Push Notification in runtime
     *
     * @param {*} pushSubscription
     * @param {*} payload
     * @param {*} options
     */
    async sendPushNotification(pushSubscription, payload, options) {
        const opt = options || this.options;

        if (!opt) {
            console.error('WebPushServer options has not been provided yet.');
        }

        try {
            return await wp.sendNotification(pushSubscription, payload, opt);
        } catch (err) {
            console.error(err);
            throw new Error('PUSH_NOTIFICATION_ERROR');
        }
    }
}

module.exports = WebPushServer;
