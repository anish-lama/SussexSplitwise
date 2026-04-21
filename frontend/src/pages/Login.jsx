import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// 🔐 Get CSRF token from cookie
const getCSRFToken = () => {
    return document.cookie
        .split("; ")
        .find(row => row.startsWith("csrftoken="))
        ?.split("=")[1];
};

export default function Login({ setPage }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        try {
            // ✅ Step 1: Get CSRF cookie
            await fetch(`${API_BASE}/api/csrf/`, {
                credentials: "include",
            });

            // ✅ Step 2: Login request WITH CSRF header
            const res = await fetch(`${API_BASE}/api/login/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken(),  // 🔥 REQUIRED
                },
                credentials: "include",
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                console.log("Login success:", data);

                localStorage.setItem("access", data.access);
                localStorage.setItem("username", username);

                setPage("dashboard");
            } else {
                alert(data.error || "Login failed");
            }
        } catch (err) {
            console.error(err);
            alert("Server error");
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-r from-blue-500 to-indigo-600">
            <div className="flex items-center px-6 py-4">
                <img
                    src={new URL("/logo.png", import.meta.url).href}
                    alt="Logo"
                    className="h-10 w-auto"
                />
            </div>

            <div className="flex items-center justify-center mt-10">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleLogin();
                    }}
                    className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
                >
                    <h1 className="text-3xl font-bold text-center mb-2">
                        Login
                    </h1>

                    <input
                        type="text"
                        placeholder="Username"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        Login
                    </button>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Don't have an account?{" "}
                        <span
                            className="text-blue-600 cursor-pointer hover:underline"
                            onClick={() => setPage("signup")}
                        >
                            Create account
                        </span>
                    </p>
                </form>
            </div>
        </div>
    );
}