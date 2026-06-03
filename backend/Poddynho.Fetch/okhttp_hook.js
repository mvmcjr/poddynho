Java.perform(function () {
    var RequestBuilder = Java.use("okhttp3.Request$Builder");

    function logIfAuth(name, value) {
        if (name.toLowerCase() === "authorization") {
            console.log("\n[TOKEN] " + value + "\n");
        }
    }

    RequestBuilder.header.implementation = function (name, value) {
        logIfAuth(name, value);
        return this.header(name, value);
    };

    RequestBuilder.addHeader.implementation = function (name, value) {
        logIfAuth(name, value);
        return this.addHeader(name, value);
    };

    console.log("[okhttp_hook] Aguardando requisições...");
});
