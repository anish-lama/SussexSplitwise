const API_BASE = import.meta.env.VITE_API_BASE_URL;

// 🔐 Get CSRF token from cookie
const getCSRFToken = () => {
    return document.cookie
        .split("; ")
        .find(row => row.startsWith("csrftoken="))
        ?.split("=")[1];
};

export async function fetchWithAuth(url, options = {}) {
    let token = localStorage.getItem("access");

    // 🔥 Attach headers properly
    const isUnsafeMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(
        options.method
    );

    let res = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
            ...(isUnsafeMethod && {
                "X-CSRFToken": getCSRFToken(),
            }),
        },
        credentials: "include",
    });

    // 🔄 If access expired → refresh
    if (res.status === 401) {
        console.log("Access expired ---> refreshing");

        const refreshRes = await fetch(`${API_BASE}/api/refresh/`, {
            method: "POST",
            credentials: "include",
            headers: {
                "X-CSRFToken": getCSRFToken(),
            },
        });

        if (!refreshRes.ok) {
            localStorage.removeItem("access");
            window.location.href = "/";
            return;
        }

        const data = await refreshRes.json();
        localStorage.setItem("access", data.access);

        // 🔁 Retry original request with new token
        res = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${data.access}`,
                ...(isUnsafeMethod && {
                    "X-CSRFToken": getCSRFToken(),
                }),
            },
            credentials: "include",
        });
    }

    return res;
}