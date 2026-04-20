import { useState, useEffect } from "react";
import { fetchWithAuth } from "../utils/api";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function CreateGroup({ setPage }) {
    const [name, setName] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

    const currentUsername = localStorage.getItem("username");

    // Fetch users
    useEffect(() => {
        fetchWithAuth(`${API_BASE}/api/users/`)
         .then((res) => res.json())
         .then((data) => {
            const fetchedUsers = data.users;
            setUsers(fetchedUsers);

            const currentUser = fetchedUsers.find(
                (u) => u.username === currentUsername
            );

            if (currentUser){
                setSelectedUsers((prev) => 
                    prev.includes(currentUser.id)
                        ? prev
                        : [...prev, currentUser.id]
                );
            }
         }) 
         .catch((err) => console.error(err)); 
    }, []);

    // Handle checkbox
    const toggleUser = (id) => {
        const currentUser = users.find(
            (u) => u.username === currentUsername
        );

        if (id === currentUser?.id) return; // 🔒 block removal

        setSelectedUsers((prev) =>
            prev.includes(id)
            ? prev.filter((u) => u !== id)
            : [...prev, id]
        );
    };

    // Create group
    const handleCreate = async () => {
        if (!name){
            alert("Enter group name");
            return;
        }

        const res = await fetchWithAuth(`${API_BASE}/api/create-group/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                user_ids: selectedUsers
            })
        });

        const data = await res.json();

        if(res.ok){
            alert("group created");
            setPage("dashboard");
        } else{
            alert(data.error || "Error creating group");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-6 rounded-xl shadow w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Create Group</h2>

                {/* Group Name */}
                <input
                    type="text"
                    placeholder="Group Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                />

                <p className="text-sm font-semibold text-gray-600 mb-2">
                    Add Members
                </p>

                <div className="max-h-40 overflow-y-auto mb-4">
                    {users && [...users]
                     .sort((a, b) => {
                        if (a.username === currentUsername) return -1;
                        if (b.username === currentUsername) return 1;
                        return 0;
                     })
                        .map((user) => {
                        
                            const isCurrentUser = user.username === currentUsername;

                            return(
                                <label key={user.id} className="flex items-center gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        checked={
                                            isCurrentUser || selectedUsers.includes(user.id)
                                        }
                                        disabled={isCurrentUser}
                                        onChange={() => toggleUser(user.id)}
                                    />
                                    {user.username}
                                    {isCurrentUser && (
                                        <span className="text-xs text-gray-400">(You)</span>
                                    )}
                                </label>
                            );
                         })}
                </div>

                {/* Buttons */}
                <div className="flex justify-between">
                    <button
                        onClick={() => setPage("dashboard")}
                        className="text-gray-500"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleCreate}
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Create
                    </button>
                </div>

            </div>
        </div>
    )


}