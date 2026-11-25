import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Guard from './components/Guard';
import Layout from './components/Layout';
import { ErrorBox, Spinner } from './components/States';
import Login from './pages/Login';
import Documents from './pages/Documents';
import DocumentDetail from './pages/DocumentDetail';
import Upload from './pages/Upload';
import NotFound from './pages/NotFound';
import Users from './pages/admin/Users';
import Departments from './pages/admin/Departments';
import Grants from './pages/admin/Grants';

function Home() {
  const { user } = useAuth();
  return <Navigate to={user.is_admin ? '/admin/grants' : '/documents'} replace />;
}

export default function App() {
  const { loading, bootError, retry } = useAuth();
  if (loading) return <Spinner label="Đang khởi động…" />;
  if (bootError) return <ErrorBox message={bootError} onRetry={retry} />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Guard><Layout /></Guard>}>
        <Route path="/" element={<Home />} />
        <Route path="/documents" element={<Guard member><Documents /></Guard>} />
        <Route path="/documents/new" element={<Guard member upload><Upload /></Guard>} />
        <Route path="/documents/:id" element={<Guard member><DocumentDetail /></Guard>} />
        <Route path="/admin/grants" element={<Guard admin><Grants /></Guard>} />
        <Route path="/admin/users" element={<Guard admin><Users /></Guard>} />
        <Route path="/admin/departments" element={<Guard admin><Departments /></Guard>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
