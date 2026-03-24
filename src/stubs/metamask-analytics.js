// Stub for @metamask/sdk-analytics
// Prevents the openapi-fetch ESM crash — we don't need MetaMask analytics
class Analytics {
    constructor() { }
    send() { }
    addEvent() { }
}

module.exports = { Analytics };
module.exports.default = { Analytics };
