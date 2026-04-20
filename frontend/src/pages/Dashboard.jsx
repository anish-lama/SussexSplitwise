import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { fetchWithAuth } from "../utils/api";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
API_BASE = "https://sussexsplitwise-backend-bkgcbxfackggh7be.canadacentral-01.azurewebsites.net";

export default function Dashboard({ setPage , setSelectedExpense}) {

    const [groups, setGroups] = useState([]);
    const [balances, setBalances] = useState({
        you_owe: [],
        you_are_owed: [],
    });

    const currentUsername = localStorage.getItem("username");
   
    // Fetch Groups
    useEffect(() => {
      fetchWithAuth(`${API_BASE}/api/list-groups/`)
      .then((res) => res.json())
      .then((data) => setGroups(data.groups))
      .catch((err) => console.error(err));
    }, []);

    // Fetch balances
    const fetchBalances = () => {
        fetchWithAuth(`${API_BASE}/api/balances/`)
          .then((res) => res.json())
          .then((data) => setBalances(data))
          .catch((err) => console.error(err));
      };

    useEffect(() => {
        fetchBalances();
    }, []);


    //handle Logout

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("username");

        setPage("login");
    }


    //handle delete group

    const handleGroupDelete = async (groupId) => {
      const confirmDelete = window.confirm("Are you sure?");
      if(!confirmDelete) return;

      try{
        const res = await fetchWithAuth(`${API_BASE}/api/delete-group/${groupId}/`, {
          method: "DELETE"
        });

        if (res.ok){
          setGroups(groups.filter((g) => g.id !== groupId));
        } else{
          console.error("Delete failed");
        }
      } catch(err){
        console.error(err);
      }
    }

    return (
    <div className="min-h-screen bg-gray-100">

      {/* 🔝 NAVBAR */}
      <div className="bg-white shadow px-4 sm:px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg sm:text-xl font-bold text-blue-600">
          Sussex Splitwise
        </h1>
        <div className="flex items-center gap-4">

            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 text-white flex items-center justify-center rounded-full">
                    {currentUsername?.[0]?.toUpperCase()}
                </div>
                <span className="text-gray-700 text-sm sm:text-base">
                    {currentUsername}
                </span>
            </div>

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="text-sm bg-blue-200 px-3 py-1 rounded-lg hover:bg-blue-300 transition"
            >
                Logout
            </button>
        </div>
      </div>

      {/* 🔥 MAIN LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6">

        {/* 📊 BALANCES (LEFT / TOP ON MOBILE) */}
        <div className="w-full lg:w-1/3 bg-white p-4 rounded-xl shadow">

          <h3 className="font-semibold mb-4">Balances</h3>

          {/* You owe */}
          <div className="mb-4">
            <h4 className="text-red-500 font-medium mb-2">You owe</h4>

            {balances.you_owe.length === 0 ? (
              <p className="text-gray-500">Nothing!</p>
            ) : (
              balances.you_owe.map((item, index) => (
                <div key={index} className="flex justify-between text-sm mb-1">
                  <span>{item.username}</span>
                  <span className="font-medium">${item.amount}</span>
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
              balances.you_are_owed.map((item, index) => (
                <div key={index} className="flex justify-between text-sm mb-1">
                  <span>{item.username}</span>
                  <span className="font-medium">${item.amount}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Groups (Right) */}
        <div className="w-full lg:w-2/3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">
              Your Groups
            </h2>

            <button 
              onClick={() => setPage("createGroup")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"  
            >
              + Create Group
            </button>
          </div>

          {groups.length === 0 ? (
            <p className="text-gray-500">No groups yet</p>
          ): (
            <div className="space-y-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white p-5 rounded-2xl shadow hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center">
                    <h3
                      onClick={() => {
                        setPage("group");
                        localStorage.setItem("groupId", group.id);
                      }}
                      className="text-lg font-semibold text-blue-600 cursor-pointer hover:underline"
                    >
                      {group.name}
                    </h3>

                    {/* Delete button */}
                    <button
                      onClick={() => handleGroupDelete(group.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} className="transition-transform group-hover:scale-110" />
                    </button>
                  </div>
                  

                </div>
              ))}
            </div>
          )}

        </div>
        

      </div>
    </div>
  );
}