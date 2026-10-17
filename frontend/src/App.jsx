import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, homeFor } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import UserDashboard from './pages/user/UserDashboard.jsx';
import SubmitEwaste from './pages/user/SubmitEwaste.jsx';
import MyRequests from './pages/user/MyRequests.jsx';
import CollectorPickups from './pages/collector/CollectorPickups.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminRequests from './pages/admin/AdminRequests.jsx';
import AdminProcessing from './pages/admin/AdminProcessing.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminCollectors from './pages/admin/AdminCollectors.jsx';
import AdminFacilities from './pages/admin/AdminFacilities.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';

function Guard({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={homeFor(user.role)} replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to={homeFor(user.role)} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={homeFor(user.role)} replace /> : <Register />} />

      <Route path="/user" element={<Guard role="USER"><Layout /></Guard>}>
        <Route index element={<UserDashboard />} />
        <Route path="submit" element={<SubmitEwaste />} />
        <Route path="requests" element={<MyRequests />} />
      </Route>

      <Route path="/collector" element={<Guard role="COLLECTOR"><Layout /></Guard>}>
        <Route index element={<CollectorPickups />} />
      </Route>

      <Route path="/admin" element={<Guard role="ADMIN"><Layout /></Guard>}>
        <Route index element={<AdminDashboard />} />
        <Route path="requests" element={<AdminRequests />} />
        <Route path="processing" element={<AdminProcessing />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="collectors" element={<AdminCollectors />} />
        <Route path="facilities" element={<AdminFacilities />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
