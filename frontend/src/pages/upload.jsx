import { useState, useEffect } from "react";
import { fetchWithAuth } from "../utils/api";
const API_BASE = "https://sussexsplitwise-backend-bkgcbxfackggh7be.canadacentral-01.azurewebsites.net";

export default function Upload({ setPage }) {
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const currentUsername = localStorage.getItem("username");
    const groupId = localStorage.getItem("groupId");

    // Fetch users on load
    useEffect(() => {

        fetchWithAuth(`${API_BASE}/api/get-group-members/${groupId}/`)
         .then((res) => res.json())
         .then((data) => {
            setUsers(data.members);
         })
         .catch((err) => console.error(err));
    }, []);

    const handleUpload = async() => {
        if(!file){
            alert("Please select a file");
            return;
        }

        const form = new FormData();
        form.append("file", file);

        setLoading(true);

        try{
            const res = await fetchWithAuth(`${API_BASE}/api/upload-receipt/`, {
                method: "POST",
                body: form
            });

            const data = await res.json();

            if (res.ok){
                console.log(data);
                setFormData({
                    ...data.data,
                    image_path: data.image_path, 
                });
            } else{
                alert(data.error);
            }
        } catch(err){
            console.error(err);
            alert("Upload failed");
        } finally{
            setLoading(false);
        }
    };

    const handleSave = async () => {

        try{
            const res = await fetchWithAuth(`${API_BASE}/api/save-expenses/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...formData,
                    group_id: parseInt(groupId),
                    user_ids: selectedUsers
                })
            });

            const data = await res.json();

            if(res.ok) {
                alert("Expense saved successfully");

                setPage("group");
            } else{
                alert(data.error);
            }
        } catch(err){
            console.error(err);
            alert("Save failed");
        }
    };

            return (
        <div className="min-h-screen bg-gray-100 flex items-start justify-center p-4 sm:p-6">

            <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-lg">

            {/* Title */}
            <h2 className="text-2xl font-bold mb-6 text-center">
                Upload Receipt
            </h2>

            {/* Upload Box */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-500 transition">
                
                <span className="text-gray-500 mb-2">
                Click to upload receipt
                </span>

                <span className="text-sm text-gray-400">
                PNG, JPG, PDF
                </span>

                <input
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0])}
                />
            </label>

            {/* File name */}
            {file && (
                <p className="mt-3 text-sm text-gray-600 text-center">
                Selected: <span className="font-medium">{file.name}</span>
                </p>
            )}
            <div className="flex gap-4 mt-4">
                
                <button
                    onClick={() => setPage("group")}
                    className="w-1/2 bg-gray-300 text-black py-3 rounded-lg hover:bg-gray-400"
                >
                    Cancel
                </button>

                <button
                    onClick={handleUpload}
                    className="w-1/2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                    Upload
                </button>

            </div>

            {loading && (
            <div className="mt-6 flex flex-col items-center justify-center text-center">

                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>

                <p className="text-gray-600 font-medium">
                Fetching receipt information...
                </p>

            </div>
            )}

            {/* FORM AFTER OCR */}
            {formData && (
                <div className="mt-8 border-t pt-6">

                <h3 className="text-xl font-semibold mb-4">
                    Edit Receipt
                </h3>

                {/* Merchant */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Merchant</label>
                    <input
                    className="w-full border p-2 rounded-lg"
                    value={formData.merchant || ""}
                    onChange={(e) =>
                        setFormData({ ...formData, merchant: e.target.value })
                    }
                    />
                </div>

                {/* Date */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                    type="date"
                    className="w-full border p-2 rounded-lg"
                    value={formData.transaction_date || ""}
                    onChange={(e) =>
                        setFormData({
                        ...formData,
                        transaction_date: e.target.value,
                        })
                    }
                    />
                </div>

                {/* Items */}
                <div className="mb-4">
                    <h4 className="font-semibold mb-2">Items</h4>

                    <div className="space-y-2">
                    {formData.items.map((item, index) => (
                        <div key={index} className="flex gap-2">
                        
                        <input
                            className="flex-1 border p-2 rounded-lg"
                            placeholder="Item name"
                            value={item.name || ""}
                            onChange={(e) => {
                            const updatedItems = [...formData.items];
                            updatedItems[index].name = e.target.value;
                            setFormData({ ...formData, items: updatedItems });
                            }}
                        />

                        <input
                            type="number"
                            className="w-24 border p-2 rounded-lg"
                            placeholder="Price"
                            value={item.price || ""}
                            onChange={(e) => {
                            const updatedItems = [...formData.items];
                            updatedItems[index].price =
                                parseFloat(e.target.value) || 0;
                            setFormData({ ...formData, items: updatedItems });
                            }}
                        />

                        </div>
                    ))}
                    </div>
                </div>

                {/* Total */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Total</label>
                    <input
                    type="number"
                    className="w-full border p-2 rounded-lg"
                    value={formData.total || ""}
                    onChange={(e) =>
                        setFormData({
                        ...formData,
                        total: parseFloat(e.target.value) || 0,
                        })
                    }
                    />
                </div>

                {/* Split */}
                <div className="mb-6">
                    <h4 className="font-semibold mb-2">Split between</h4>

                    <div className="grid grid-cols-2 gap-2">
                    {users.map((user) => {
                        const isCurrentUser = user.username === currentUsername;

                        return (
                        <label
                            key={user.id}
                            className="flex items-center gap-2 border p-2 rounded-lg cursor-pointer"
                        >
                            <input
                            type="checkbox"
                            checked={
                                isCurrentUser || selectedUsers.includes(user.id)
                            }
                            disabled={isCurrentUser}
                            onChange={(e) => {
                                if (isCurrentUser) return;

                                if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                                } else {
                                setSelectedUsers(
                                    selectedUsers.filter((id) => id !== user.id)
                                );
                                }
                            }}
                            />
                            <span>
                            {user.username} {isCurrentUser && "(you)"}
                            </span>
                        </label>
                        );
                    })}
                    </div>
                </div>
                
                <div className="flex gap-4 mt-4">
                    <button
                        onClick = {() => setPage("group")}
                        className = "w-1/3 bg-gray-300 text-black py-3 rounded-lg hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                    
                    <button
                        onClick={handleSave}
                        className="w-2/3 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                    >
                        Save Expense
                    </button>
                </div>
                </div>
            )}
            </div>
        </div>
        );
}