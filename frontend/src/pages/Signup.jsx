import { useState } from "react";
const API_BASE = "https://sussexsplitwise-backend-bkgcbxfackggh7be.canadacentral-01.azurewebsites.net";

export default function Signup({ setPage }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");

    const handleSignup = async () => {
        try{
            const res = await fetch(`${API_BASE}/api/signup/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ username, password, email }),
            });

            const data = await res.json();

            if (res.ok){
                console.log("Signup success:", data);

                localStorage.setItem("access", data.access);

                alert("Signup successful");
            } else{
                alert(data.console.error || "Sign up failed");
            }
        } catch(err) {
            console.error(err);
            alert("Server error");
        }
    };

        return (
            <div className="min-h-screen bg-linear-to-r from-blue-500 to-indigo-600">

                {/* 🔝 LOGO */}
                <div className="flex items-center px-6 py-4">
                <img
                    src={new URL("/logo.png", import.meta.url).href}
                    alt="Logo"
                    className="h-10 w-auto"
                />
                </div>

                {/* 🔥 CENTER CARD */}
                <div className="flex items-center justify-center mt-10 px-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-center mb-2">
                    Create Account
                    </h1>

                    <p className="text-center text-gray-500 mb-6">
                    Join Sussex Splitwise
                    </p>

                    {/* Username */}
                    <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Username"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    </div>

                    {/* Password */}
                    <div className="mb-6">
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    </div>

                    {/* Button */}
                    <button
                    onClick={handleSignup}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                    Sign Up
                    </button>

                    {/* Footer */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                    Already a user?{" "}
                    <span
                        className="text-blue-600 cursor-pointer hover:underline"
                        onClick={() => setPage("login")}
                    >
                        Login
                    </span>
                    </p>

                </div>
                </div>
            </div>
    );

}
