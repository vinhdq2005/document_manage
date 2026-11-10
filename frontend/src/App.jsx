import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Documents from "./pages/Documents";
import DocumentDetail from "./pages/DocumentDetail";
import Upload from "./pages/Upload";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDepartments from "./pages/admin/AdminDepartments";
import AdminGrants from "./pages/admin/AdminGrants";

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Đang tải...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.is_admin ? "/admin/users" : "/documents"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/documents" element={<ProtectedRoute readerOnly><Documents /></ProtectedRoute>} />
        <Route path="/documents/:id" element={<ProtectedRoute readerOnly><DocumentDetail /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute readerOnly needUpload><Upload /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/departments" element={<ProtectedRoute adminOnly><AdminDepartments /></ProtectedRoute>} />
        <Route path="/admin/grants" element={<ProtectedRoute adminOnly><AdminGrants /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
