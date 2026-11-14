const asset = /(?:^|[\/ (])([a-zA-Z0-9_.-]{1,120}\.(?:[cm]?js|jsx|tsx?))(?::([0-9]{1,9}):([0-9]{1,9}))(?=\)?\s*$)/;
const errorNames = new Set(["Error", "TypeError", "ReferenceError", "SyntaxError", "RangeError", "EvalError", "URIError", "AggregateError"]);

export function installClientErrorReporting({ endpoint }) {
    const attempted = new Map();

    function capture(error, location, fallbackName = "Error") {
        try {
            const name = errorNames.has(error?.name) ? error.name : fallbackName;
            const frames = (typeof error?.stack === "string" ? error.stack.slice(0, 8192).split("\n") : [])
                .flatMap(line => {
                    if (!/^\s*at\s|^[^\s@]*@(?:https?:|webpack)/.test(line)) return [];
                    const match = line.replace(/\?[^\s)]*?(?=:\d+:\d+(?:\)|\s|$))/, "").match(asset);
                    return match ? [{ file: match[1], line: Number(match[2]), column: Number(match[3]) }] : [];
                }).slice(0, 5);
            if (frames.length === 0 && location) {
                const url = new URL(location.filename, window.location.href);
                const file = url.pathname.split("/").at(-1);
                const match = (file + ":" + location.lineno + ":" + location.colno).match(asset);
                if (match) frames.push({ file, line: location.lineno, column: location.colno });
            }

            const body = JSON.stringify({ name, frames });
            const key = JSON.stringify([name, frames[0]]);
            const now = Date.now();
            if ((attempted.get(key) ?? 0) > now) return;
            if (attempted.size >= 128) attempted.delete(attempted.keys().next().value);
            const cooldown = now + 30000;
            attempted.set(key, cooldown);
            void fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body,
                credentials: "omit",
                keepalive: true
            }).then(response => {
                if (response.ok && attempted.get(key) === cooldown) attempted.set(key, Infinity);
            }).catch(() => {});
        } catch {
            // Reporting is best-effort and must never generate another unhandled error.
        }
    }

    const onError = event => {
        if (event instanceof ErrorEvent && (event.error || event.filename)) capture(event.error, event);
    };
    const onRejection = event => capture(event.reason, null, "UnhandledRejection");
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return {
        reactRootOptions: {
            onCaughtError(error, info) {
                capture(error);
                console.error(error, info.componentStack);
            }
        },
        dispose() {
            window.removeEventListener("error", onError);
            window.removeEventListener("unhandledrejection", onRejection);
        }
    };
}
