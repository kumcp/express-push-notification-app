let globalPusher;

class PNWrapper {
    /**
     * Construct preinput Push Notification key
     * ```
     * // pushManager get from ServiceWorker registered:
     *
     * const sw = new ServiceWorker(navigator, { path: "/sw" })
     * const swRegistered = await sw.register()
     * try {
     *     await PNWrapper.requestPermission();
     *     const pn = new PNWrapper(
     *         swRegistered.pushManager,
     *         Notification,
     *         { applicationServerKey: <WEB_PUSHER_APP_KEY> }
     *     )
     * } catch (err) {
     *    console.log(err)
     * }
     *
     * ```
     * @param {*} pushManager (ServiceWorkerRegistration.pushManager)
     * @param {*} notification `Notification` global object from browser
     * @param {*} options.userVisibleOnly (default: `true`)
     */
    constructor(pushManager, notification = Notification, options = {}) {
        this.pushManager = pushManager;
        this.notification = notification;
        this.options = {
            userVisibleOnly: true,
            ...options
        };

        if (options.applicationServerKey) {
            this.options.applicationServerKey = PNWrapper.urlB64ToUint8Array(
                options.applicationServerKey
            );
        }
    }

    /**
     * Set application server public key
     * @param {string} applicationServerKey
     */
    setPublicKey(applicationServerKey) {
        this.options.applicationServerKey =
            this.urlB64ToUint8Array(applicationServerKey);
    }

    /**
     * Subscribe with parameter has been parsed
     * You may need to use `.subscribeIfNotExist` to avoid some problems
     *
     * @returns {PushSubscription}
     */
    subscribe(options = this.options) {
        return this.pushManager.subscribe(options);
    }

    /**
     * Get the push subscription
     *
     * @returns {PushSubscription}
     */
    getSubscription() {
        console.log(this.pushManager);
        return this.pushManager.getSubscription();
    }

    async subscribeIfNotExist() {
        let subscription = await this.getSubscription();

        if (subscription) {
            return subscription;
        }

        subscription = await this.subscribe();

        return subscription;
    }

    async unsubscribeIfExist() {
        const subscription = await this.getSubscription();

        if (!subscription) {
            console.warn(
                "PNWrapper.unsubscribeIfExist: Push notification has not been subscribed yet"
            );
            throw new Error("NOT_SUBSCRIBED_YET");
        }

        await subscription.unsubscribe();

        return subscription;
    }

    static setGlobal(pw) {
        globalPusher = pw;
    }

    static getGlobal() {
        return globalPusher;
    }

    static requestPermission(
        notification = Notification,
        afterRequestCb = () => {}
    ) {
        return notification.requestPermission(afterRequestCb);
    }

    /**
     * Convert urlB64 to Uint8Array helper function for transform key
     * @param {*} base64String
     */
    static urlB64ToUint8Array(base64String) {
        console.log("UrlB64: ", base64String);
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; i += 1) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

let globalServiceWorker;

class SWWrapper {
    /**
     * Create a SWWrapper preinput
     *
     * @param {*} navigator object from browser
     * @param {*} options.path path to register service worker with server (default: `'/service-worker'`)
     */
    constructor(
        navigator,
        options = {
            path: "/service-worker"
        }
    ) {
        if (!SWWrapper.checkSupport(navigator)) {
            console.warn("SW_NOT_SUPPORT: Service worker not supported");
            throw new Error("SW_NOT_SUPPORT");
        }

        this.sw = navigator.serviceWorker;
        this.options = options;
    }

    /**
     * Register a worker with the path has been defined or a specific path
     *
     * @param {string} path service worker path (default = this.options.path)
     *
     * @returns {Promise<ServiceWorkerRegistration>}
     *
     * @throws {Error('PATH_NOT_DEFINED')} if none path has been declare
     *
     */
    async register(path) {
        const serviceWorkerPath = path || this.options.path;

        if (!serviceWorkerPath) {
            console.error(
                "ServiceWorker.register: service worker path has not been defined"
            );
            throw new Error("PATH_NOT_DEFINED");
        }
        this.swRegistered = await this.sw.register(serviceWorkerPath);
        return this.swRegistered;
    }

    /**
     * Return registered service worker
     * @returns {ServiceWorkerRegistration}
     * @throws {Error('NOT_REGISTERED_YET')} if service worker has not been registered
     */
    getRegistration() {
        if (!this.swRegistered) {
            console.error(
                "ServiceWorker.getRegistration: service worker path has not been registered"
            );
            throw new Error("NOT_REGISTERED_YET");
        }
        return this.swRegistered;
    }

    /**
     * Return the actual Service Worker object in browser `navigator.serviceWorker`
     *
     * @return {ServiceWorkerContainer}
     */
    getServiceWorker() {
        return this.sw;
    }

    /**
     * Check if serviceWorker is support or not
     * @param {*} navigator parsed navigator
     * @returns {Boolean} serviceWorker support in navigator or not
     */
    static checkSupport(navigator) {
        return navigator && "serviceWorker" in navigator;
    }

    /**
     * Register service worker directly from navigator
     * @param {*} navigator parsed navigator
     * @param {string} path service worker path (default = "/service-worker")
     *
     * @returns {Promise<ServiceWorkerRegistration>}
     */
    static register(navigator, path) {
        const sw = new SWWrapper(navigator);
        return sw.register(path);
    }

    /**
     * Register service worker as a global. You can get the global service worker using:
     * ```
     * SWWrapper.getGlobal()
     * ```
     * @param {*} navigator
     * @param {*} path
     *
     * @returns {Promise<ServiceWorkerContainer>}
     */
    static async registerGlobal(navigator, path) {
        try {
            globalServiceWorker = new SWWrapper(navigator);
            await globalServiceWorker.register(path);
            return globalServiceWorker;
        } catch (error) {
            console.log(`SERVICE_WORKER_REGISTATION_FAILED: ${error}`);
            throw new Error(`SERVICE_WORKER_REGISTATION_FAILED`);
        }
    }

    /**
     * Return global service worker if you have registered a global. `undefined` otherwise
     *
     * @returns {Promise<ServiceWorkerContainer>}
     */
    static getGlobal() {
        return globalServiceWorker;
    }
}
