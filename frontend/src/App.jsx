import {useState } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Upload from "./pages/upload";
import Dashboard from "./pages/Dashboard";
import ExpenseDetail from "./pages/expenseDetail";
import CreateGroup from "./pages/CreateGroup";
import GroupPage from "./pages/GroupPage";

function App(){
  const [page, setPage] = useState("login");
  const [selectedExpense, setSelectedExpense] = useState(null);

  return(
    <>
      {page === "login" && <Login setPage={setPage} />}
      {page === "signup" && <Signup setPage={setPage} />}
      {page === "upload" && <Upload setPage={setPage}/>}
      {page === "dashboard" && <Dashboard setPage={setPage} setSelectedExpense={setSelectedExpense}/>}
      {page === "expenseDetail" && <ExpenseDetail expense={selectedExpense} setPage={setPage} />}
      {page === "createGroup" && <CreateGroup setPage={setPage}/>}
      {page === "group" && <GroupPage setPage={setPage} setSelectedExpense={setSelectedExpense}/>}
    </>
  );
}

export default App;