import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Pricing } from './pages/Pricing';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Support } from './pages/Support';
import { SignUp } from './pages/SignUp';
import { Login } from './pages/Login';
import PlayerDashboard from './pages/PlayerDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import CreateMatch from './pages/CreateMatch';
import JoinMatch from './pages/JoinMatch';
import JoinTournament from './pages/JoinTournament';
import { CreateTournament } from './pages/CreateTournament';
import { Profile } from './pages/Profile';
import UploadVideo from './pages/UploadVideo';
import { MyMatches } from './pages/MyMatched';
import { MyTournaments } from './pages/MyTournaments';
import ManageJoinRequests from './pages/ManageJoinRequests';
import EnhancedBookSlot from './pages/EnhancedBookSlot';
import ImprovedBookSlot from './pages/ImprovedBookSlot';
import BookSlotTest from './pages/BookSlotTest';
import SlotBookingDemo from './pages/SlotBookingDemo';
import { MyBookings } from './pages/MyBookings';
import { ManageBookings } from './pages/ManageBookings';
import { ManageFacilities } from './pages/ManageFacilities';
import CourtManagement from './pages/CourtManagement';
import { SlotManagement } from './pages/SlotManagement';
import OwnerSlotManagement from './pages/OwnerSlotManagement';
import { ManageTournaments } from './pages/ManageTournaments';
import OwnerSignUp from './pages/OwnerSignUp';
import { TournamentRegistrations } from './pages/TournamentRegistrations';
import { RouteGuard } from './components/RouteGuard';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import VerificationRequests from './pages/Admin/VerificationRequests';
import AdminLayout from './components/Admin/AdminLayout';
import ChatTest from './pages/ChatTest';

const AppContent: React.FC = () => {
  const location = useLocation();
  const publicPages = ['/', '/about', '/contact', '/pricing'];
  const showFooter = publicPages.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/player-dashboard" element={
            <RouteGuard requiredRole="player">
              <PlayerDashboard />
            </RouteGuard>
          } />
          <Route path="/owner-dashboard" element={
            <RouteGuard requiredRole="owner">
              <OwnerDashboard />
            </RouteGuard>
          } />
          <Route path="/create-match" element={<CreateMatch />} />
          <Route path="/join-match" element={<JoinMatch />} />
          <Route path="/join-tournament" element={<JoinTournament />} />
          <Route path="/create-tournament" element={<CreateTournament />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/upload-video" element={<UploadVideo />} />
          <Route path="/my-matches" element={<MyMatches />} />
          <Route path="/manage-join-requests" element={<ManageJoinRequests />} />
          <Route path="/my-tournaments" element={<MyTournaments />} />
          <Route path="/book-slot" element={<ImprovedBookSlot />} />
          <Route path="/slot-demo" element={<SlotBookingDemo />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/manage-bookings" element={<ManageBookings />} />
          <Route path="/manage-facilities" element={<ManageFacilities />} />
          <Route path="/court-management" element={<CourtManagement />} />
          <Route path="/slot-management" element={<SlotManagement />} />
          <Route path="/owner-slot-management" element={<OwnerSlotManagement />} />
          <Route path="/manage-tournaments" element={<ManageTournaments />} />
          <Route path="/owner-signup-xyz123" element={<OwnerSignUp />} />
          <Route path="/tournament-registrations/:id" element={<TournamentRegistrations />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/support" element={<Support />} />
          <Route path="/chat-test" element={<ChatTest />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="verifications" element={<VerificationRequests />} />
            {/* Add more admin routes here */}
          </Route>
        </Routes>
      </main>
      {/* Only show footer on public pages */}
      {showFooter && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;