import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScrollToTop } from './components/ScrollToTop';
import { Home } from './pages/Home';
import { AboutUs } from './pages/AboutUs';
import { Campaigns } from './pages/Campaigns';
import { CampaignDetail } from './pages/CampaignDetail';
import { CreateCampaign } from './pages/CreateCampaign';
import { EditCampaign } from './pages/EditCampaign';
import { Dashboard } from './pages/Dashboard';
import { CampaignStats } from './pages/CampaignStats';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';

function App() {
  return (
    <ErrorBoundary>
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaign/:id" element={<CampaignDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateCampaign />
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaign/:id/edit"
              element={
                <ProtectedRoute>
                  <EditCampaign />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/campaign/:id"
              element={
                <ProtectedRoute>
                  <CampaignStats />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
