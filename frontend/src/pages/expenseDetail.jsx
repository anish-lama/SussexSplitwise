import { useEffect, useState } from "react";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function ExpenseDetail({ expense, setPage }){
    if(!expense){
        return <div className="p-6">Loading...</div>;
    } 

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6">

        {/* Back Button */}
        <button
            onClick={() => setPage("group")}
            className="mb-4 text-blue-600 hover:underline"
        >
            ← Back
        </button>

        <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow">

            {/* Merchant */}
            <h1 className="text-2xl font-bold text-gray-800">
            {expense.merchant}
            </h1>

            {/* Date */}
            <p className="text-gray-500 mb-6">
            {expense.date
                ? new Date(expense.date).toLocaleDateString()
                : "N/A"}
            </p>

            {/* 🧾 Items Section */}
            <div className="mb-6">
            <h2 className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                Items
            </h2>

            <div className="space-y-2">
                {expense.items?.map((item, i) => (
                <div
                    key={i}
                    className="flex justify-between border-b pb-1 text-sm"
                >
                    <span className="text-gray-700">
                    {item.name}
                    </span>

                    <span className="text-gray-900 font-medium">
                    ${item.price}
                    </span>
                </div>
                ))}
            </div>
            </div>

            {/* Total */}
            <div className="flex justify-between text-lg font-bold border-t pt-4 mb-6">
            <span>Total</span>
            <span>${expense.total}</span>
            </div>

            {/* Receipt Image */}
            {expense.image && (
            <div>
                <h2 className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                Receipt
                </h2>

                <img
                src={`${API_BASE}${expense.image}`}
                alt="Receipt"
                className="w-full rounded-lg border"
                />
            </div>
            )}

        </div>
        </div>
    );
}