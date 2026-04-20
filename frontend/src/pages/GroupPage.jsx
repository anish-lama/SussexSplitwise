import { useEffect, useState } from "react";
import { Trash2, ArrowLeft } from "lucide-react";
import { fetchWithAuth } from "../utils/api";

const API_BASE = "https://sussexsplitwise-backend-bkgcbxfackggh7be.canadacentral-01.azurewebsites.net";

export default function GroupPage({ setPage, setSelectedExpense }) {
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState({
        you_owe: [],
        you_are_owed: [],

    });

    const groupId = localStorage.getItem("groupId");

    // Fetch group expenses

    const fetchBalances = () => {
        fetchWithAuth(`${API_BASE}/api/balances/?group_id=${groupId}`)
            .then((res) => res.json())
            .then((data) => setBalances(data))
            .catch((err) => console.error(err));
        };
    
    useEffect(() => {
        fetchBalances();
    }, []);

    useEffect(() => {
        fetchWithAuth(`${API_BASE}/api/list-expenses/?group_id=${groupId}`)
            .then((res) => res.json())
            .then((data) => {
            console.log("EXPENSES:", data); // 🔥 debug
            setExpenses(data.expenses);
            })
            .catch((err) => console.error(err));
        }, []);

    // Expense detail
    const handle_exp_details = async (id) => {
    try {
        const res = await fetchWithAuth(`${API_BASE}/api/list-expenses/${id}/`);

        const data = await res.json();

        if (res.ok) {
        setSelectedExpense(data);   
        setPage("expenseDetail");
        } else {
        alert(data.error || "Failed to fetch expense");
        }
    } catch (err) {
        console.error(err);
        alert("Error fetching expense");
    }
    };

    //Delete
    const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;

    const res = await fetchWithAuth(`${API_BASE}/api/delete-expense/${id}/`, {
        method: "DELETE"
    });

    if (res.ok) {
        setExpenses((prev) => prev.filter((e) => e.id !== id));

        // refresh balances
        fetchBalances();
    }
    };

    return (
    <div className="min-h-screen bg-gray-100">

        {/* HEADER */}
        <div className="p-4 sm:p-6">
        <button
            onClick={() => setPage("dashboard")}
            className="flex items-center gap-2 text-blue-500 mb-4 hover:text-blue-700"
        >
           <ArrowLeft size={18} />
           <span>Back</span>
        </button>
        </div>

        {/* MAIN LAYOUT  */}
        <div className="flex flex-col lg:flex-row gap-6 px-4 sm:px-6 pb-6">

        {/* BALANCES (LEFT) */}
        <div className="w-full lg:w-1/3 bg-white p-4 rounded-xl shadow">

            <h3 className="font-semibold mb-4">Group Balances</h3>

            {/* You owe */}
            <div className="mb-4">
            <h4 className="text-red-500 font-medium mb-2">You owe</h4>

            {balances.you_owe.length === 0 ? (
                <p className="text-gray-500">Nothing!</p>
            ) : (
                balances.you_owe.map((b, i) => (
                <div key={i} className="flex justify-between text-sm mb-1">
                    <span>{b.username}</span>
                    <span className="font-medium">${b.amount}</span>
                </div>
                ))
            )}
            </div>

            {/* You are owed */}
            <div>
            <h4 className="text-green-500 font-medium mb-2">
                You are owed
            </h4>

            {balances.you_are_owed.length === 0 ? (
                <p className="text-gray-500">Nothing!</p>
            ) : (
                balances.you_are_owed.map((b, i) => (
                <div key={i} className="flex justify-between text-sm mb-1">
                    <span>{b.username}</span>
                    <span className="font-medium">${b.amount}</span>
                </div>
                ))
            )}
            </div>
        </div>

        {/* EXPENSES (RIGHT) */}
        <div className="w-full lg:w-2/3">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">
                Recent Expenses
            </h2>

            <button
                onClick={() => setPage("upload")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto"
            >
                + Add Expense
            </button>
            </div>

            {/* Expense List */}
            {expenses.length === 0 ? (
            <p className="text-gray-500">No expenses yet</p>
            ) : (
            <div className="space-y-4">
                {expenses.map((exp) => {
                const currentUsername = localStorage.getItem("username");
                const isYou = exp.paid_by === currentUsername;

                return (
                    <div
                    key={exp.id}
                    className="group bg-white p-5 rounded-2xl shadow hover:shadow-md transition"
                    >
                    <div className="flex gap-4">

                        {/* DATE */}
                        <div className="text-sm text-gray-400 w-20 pt-1">
                        {exp.date
                            ? new Date(exp.date).toLocaleDateString()
                            : "N/A"}
                        </div>

                        {/* CONTENT */}
                        <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <h4
                            className="font-semibold text-lg text-gray-800 cursor-pointer hover:text-blue-600"
                            onClick={() => handle_exp_details(exp.id)}
                            >
                            {exp.merchant}
                            </h4>

                            <div className="flex items-center gap-3">
                            <p className="font-bold text-lg text-gray-900">
                                ${exp.total}
                            </p>

                            {isYou && (
                                <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(exp.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 text-sm"
                                >
                                <Trash2 size={18} className="transition-transform group-hover:scale-110" />
                                </button>
                            )}
                            </div>
                        </div>

                        <p className="text-gray-500 text-sm mt-1">
                            {isYou ? "You paid" : `${exp.paid_by} paid`}
                        </p>
                        {/* TOP ITEMS */}
                        {exp.top_items && exp.top_items.length > 0 && (
                        <div className="mt-3">

                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                            Top items
                            </p>

                            <div className="space-y-1">
                            {exp.top_items.map((item, i) => (
                                <div
                                key={i}
                                className="flex justify-between text-sm"
                                >
                                <span className="text-gray-700 truncate">
                                    {item.name}
                                </span>

                                <span className="text-gray-400">
                                    ${item.price}
                                </span>
                                </div>
                            ))}
                            </div>

                        </div>
                        )}
                        </div>

                    </div>
                    </div>
                );
                })}
            </div>
            )}
        </div>

        </div>
    </div>
    );
}