import axios from "axios";
window.axios = axios;

window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
// import Echo from "laravel-echo";
// import Pusher from "pusher-js";

// window.Pusher = Pusher;

// window.Echo = new Echo({
//     broadcaster: "reverb",
//     key: import.meta.env.VITE_REVERB_APP_KEY, // Use VITE_ prefix for Vite
//     wsHost: import.meta.env.VITE_REVERB_HOST || "127.0.0.1",
//     wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
//     wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
//     forceTLS: false,
//     enabledTransports: ["ws", "wss"],
// });

import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST || "127.0.0.1",
    wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
    forceTLS: false,
    enabledTransports: ["ws", "wss"],
    authEndpoint: "/broadcasting/auth", // Uses Sanctum session/cookie auth
    auth: {
        headers: {
            "X-CSRF-TOKEN":
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute("content") || "",
            "X-Requested-With": "XMLHttpRequest",
        },
    },
});

// // Listen to the private channel and update Inertia state
// window.Echo.private("leave-requests.private").listen("NewLeaveRequest", (e) => {
//     console.log("New leave request from:", e.employeeName);
//     // Refresh notifications via Inertia
//     Inertia.reload({
//         only: ["notifications"],
//         preserveState: true,
//         preserveScroll: true,
//     });
// });
