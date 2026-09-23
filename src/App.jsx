import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useGetMeQuery } from './api/auth';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SessionExpiredModal } from './components/auth/SessionExpiredModal';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { CustomersPage } from './pages/Customers/CustomersPage';
import { CustomerDetailPage } from './pages/Customers/CustomerDetailPage';
import { OpportunitiesPage } from './pages/Opportunities/OpportunitiesPage';
import { OpportunityDetailPage } from './pages/Opportunities/OpportunityDetailPage/OpportunityDetailPage';
import { ServicesPage } from './pages/Services/ServicesPage';
import { ServiceDetailPage } from './pages/Services/ServiceDetailPage';
import { JobsPage } from './pages/Jobs/JobsPage';
import { JobDetailPage } from './pages/Jobs/JobDetailPage';
import { ContractsPage } from './pages/Contracts/ContractsPage';
import { ProjectsPage } from './pages/Projects/ProjectsPage';
import { ProjectDetailPage } from './pages/Projects/ProjectDetailPage/ProjectDetailPage';
import { TasksPage } from './pages/Tasks/TasksPage';
import { TaskDetailPage } from './pages/Tasks/TaskDetailPage';
import { TaskReviewPage } from './pages/Tasks/TaskReviewPage';
import { FinancePage } from './pages/Finance/FinancePage';
import { PaymentRequestsPage } from './pages/PaymentRequests/PaymentRequestsPage';
import { VendorsPage } from './pages/Vendors/VendorsPage';
import { VendorDetailPage } from './pages/Vendors/VendorDetailPage';
import { LoginPage } from './pages/Auth/LoginPage';
import ContractDetailPage from './pages/Contracts/ContractDetailPage/ContractDetailPage';
import { NotificationsPage } from './pages/Notifications/NotificationsPage';
import { AnnouncementsPage } from './pages/Announcements/AnnouncementsPage';
import { AnnouncementDetailPage } from './pages/Announcements/AnnouncementDetailPage';
import { ReferralPartnersPage } from './pages/ReferralPartners/ReferralPartnersPage';
import { DocumentLibraryPage } from './pages/DocumentLibrary/DocumentLibraryPage';
import { PartnerDetailPage } from './pages/ReferralPartners/PartnerDetailPage';
import { TeamsPage } from './pages/Teams/TeamsPage';
import { TeamDetailPage } from './pages/Teams/TeamDetailPage';
import { UserListPage } from './pages/Users/UserListPage';
import { UserDetailPage } from './pages/Users/UserDetailPage';
import { AcceptanceInboxPage } from './pages/Acceptance/AcceptanceInboxPage';
import { ServicePackageListPage } from './pages/ServicePackages/ServicePackageListPage';
import { ServicePackageDetailPage } from './pages/ServicePackages/ServicePackageDetailPage';
import { MePage } from './pages/Me/MePage';
import { CreateVideoAIPage } from './pages/CreateVideoAI/CreateVideoAIPage';
import { CreateVideoMotionControlPage } from './pages/CreateVideoAI/CreateVideoMotionControlPage';
import { LibraryVideoAiPage } from './pages/LibraryVideoAi/LibraryVideoAiPage';
import { DashboardAIPage } from './pages/DashboardAI/DashboardAIPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { ChatPage } from './pages/Chat/ChatPage';
import { ChatBubbleWidget } from './components/chat/ChatBubbleWidget';

function AppContent() {
  // Use the query to check if the user is logged in via cookies on startup
  const { data: currentUser, isLoading } = useGetMeQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] animate-pulse">
            Khởi tạo hệ thống...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path='/login' element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path='/'
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/customers'
          element={
            <ProtectedRoute>
              <Layout>
                <CustomersPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/customers/:id'
          element={
            <ProtectedRoute>
              <Layout>
                <CustomerDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/opportunities'
          element={
            <ProtectedRoute>
              <Layout>
                <OpportunitiesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/opportunities/:id'
          element={
            <ProtectedRoute>
              <Layout>
                <OpportunityDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/services'
          element={
            <ProtectedRoute>
              <Layout>
                <ServicesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/services/:id'
          element={
            <ProtectedRoute>
              <Layout>
                <ServiceDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/jobs'
          element={
            <ProtectedRoute>
              <Layout>
                <JobsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/jobs/:id'
          element={
            <ProtectedRoute>
              <Layout>
                <JobDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/contracts'
          element={
            <ProtectedRoute>
              <Layout>
                <ContractsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/contracts/:id'
          element={
            <ProtectedRoute>
              <Layout>
                <ContractDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/projects'
          element={
            <ProtectedRoute>
              <Layout>
                <ProjectsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/projects/:id'
          element={
            <ProtectedRoute>
              <Layout>
                <ProjectDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/tasks'
          element={
            <ProtectedRoute>
              <Layout>
                <TasksPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/tasks/:id'
          element={
            <ProtectedRoute>
              <Layout>
                <TaskDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/tasks/:id/review'
          element={
            <ProtectedRoute>
              <Layout>
                <TaskReviewPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/vendors'
          element={
            <ProtectedRoute>
              <Layout>
                <VendorsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/vendors/:id'
          element={
            <ProtectedRoute>
              <Layout>
                <VendorDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/finance'
          element={
            <ProtectedRoute>
              <Layout>
                <FinancePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/payment-requests'
          element={
            <ProtectedRoute>
              <Layout>
                <PaymentRequestsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/payment-requests/:id'
          element={
            <ProtectedRoute>
              <Layout>
                <PaymentRequestsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/referral-partners'
          element={
            <ProtectedRoute>
              <Layout>
                <ReferralPartnersPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/referral-partners/:id'
          element={
            <ProtectedRoute>
              <Layout>
                <PartnerDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/document-library'
          element={
            <ProtectedRoute>
              <Layout>
                <DocumentLibraryPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/teams'
          element={
            <ProtectedRoute>
              <Layout>
                <TeamsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/teams/:id'
          element={
            <ProtectedRoute>
              <Layout>
                <TeamDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/notifications'
          element={
            <ProtectedRoute>
              <Layout>
                <NotificationsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/announcements'
          element={
            <ProtectedRoute>
              <Layout>
                <AnnouncementsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/announcements/:id'
          element={
            <ProtectedRoute>
              <Layout>
                <AnnouncementDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/users'
          element={
            <ProtectedRoute>
              <Layout>
                <UserListPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/users/:id'
          element={
            <ProtectedRoute>
              <Layout>
                <UserDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/me'
          element={
            <ProtectedRoute>
              <Layout>
                <MePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/service-packages'
          element={
            <ProtectedRoute>
              <Layout>
                <ServicePackageListPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/service-packages/:id'
          element={
            <ProtectedRoute>
              <Layout>
                <ServicePackageDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/acceptance'
          element={
            <ProtectedRoute>
              <Layout>
                <AcceptanceInboxPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/dashboard-ai'
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardAIPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/create-video-ai'
          element={
            <ProtectedRoute>
              <Layout>
                <CreateVideoAIPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/create-video-motion-control'
          element={
            <ProtectedRoute>
              <Layout>
                <CreateVideoMotionControlPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/library-video-ai'
          element={
            <ProtectedRoute>
              <Layout>
                <LibraryVideoAiPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/chat'
          element={
            <ProtectedRoute>
              <Layout>
                <ChatPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/settings'
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
      <SessionExpiredModal />
      <ChatBubbleWidget />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
