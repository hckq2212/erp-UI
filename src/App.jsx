import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { useGetMeQuery } from './api/auth';

import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SessionExpiredModal } from './components/auth/SessionExpiredModal';

import { DashboardPage } from './pages/Dashboard/DashboardPage';

import { ChatBubbleWidget } from './components/chat/ChatBubbleWidget';

const lazyNamed = (loader, exportName) => lazy(() =>
  loader().then((module) => ({ default: module[exportName] }))
);

const CustomersPage = lazyNamed(() => import('./pages/Customers/CustomersPage'), 'CustomersPage');
const CustomerDetailPage = lazyNamed(() => import('./pages/Customers/CustomerDetailPage'), 'CustomerDetailPage');
const OpportunitiesPage = lazyNamed(() => import('./pages/Opportunities/OpportunitiesPage'), 'OpportunitiesPage');
const OpportunityDetailPage = lazyNamed(() => import('./pages/Opportunities/OpportunityDetailPage/OpportunityDetailPage'), 'OpportunityDetailPage');
const ServicesPage = lazyNamed(() => import('./pages/Services/ServicesPage'), 'ServicesPage');
const ServiceDetailPage = lazyNamed(() => import('./pages/Services/ServiceDetailPage'), 'ServiceDetailPage');
const JobsPage = lazyNamed(() => import('./pages/Jobs/JobsPage'), 'JobsPage');
const JobDetailPage = lazyNamed(() => import('./pages/Jobs/JobDetailPage'), 'JobDetailPage');
const ContractsPage = lazyNamed(() => import('./pages/Contracts/ContractsPage'), 'ContractsPage');
const ContractDetailPage = lazyNamed(() => import('./pages/Contracts/ContractDetailPage/ContractDetailPage'), 'ContractDetailPage');
const ProjectsPage = lazyNamed(() => import('./pages/Projects/ProjectsPage'), 'ProjectsPage');
const ProjectDetailPage = lazyNamed(() => import('./pages/Projects/ProjectDetailPage/ProjectDetailPage'), 'ProjectDetailPage');
const TasksPage = lazyNamed(() => import('./pages/Tasks/TasksPage'), 'TasksPage');
const TaskDetailPage = lazyNamed(() => import('./pages/Tasks/TaskDetailPage'), 'TaskDetailPage');
const TaskReviewPage = lazyNamed(() => import('./pages/Tasks/TaskReviewPage'), 'TaskReviewPage');
const FinancePage = lazyNamed(() => import('./pages/Finance/FinancePage'), 'FinancePage');
const PaymentRequestsPage = lazyNamed(() => import('./pages/PaymentRequests/PaymentRequestsPage'), 'PaymentRequestsPage');
const PaymentOverviewPage = lazyNamed(() => import('./pages/Finance/PaymentOverviewPage'), 'PaymentOverviewPage');
const AcceptanceMinutesPage = lazyNamed(() => import('./pages/Finance/AcceptanceMinutesPage'), 'AcceptanceMinutesPage');
const VatInvoicesPage = lazyNamed(() => import('./pages/Finance/VatInvoicesPage'), 'VatInvoicesPage');
const VendorsPage = lazyNamed(() => import('./pages/Vendors/VendorsPage'), 'VendorsPage');
const VendorDetailPage = lazyNamed(() => import('./pages/Vendors/VendorDetailPage'), 'VendorDetailPage');
const LoginPage = lazyNamed(() => import('./pages/Auth/LoginPage'), 'LoginPage');
const NotificationsPage = lazyNamed(() => import('./pages/Notifications/NotificationsPage'), 'NotificationsPage');
const AnnouncementsPage = lazyNamed(() => import('./pages/Announcements/AnnouncementsPage'), 'AnnouncementsPage');
const AnnouncementDetailPage = lazyNamed(() => import('./pages/Announcements/AnnouncementDetailPage'), 'AnnouncementDetailPage');
const ReferralPartnersPage = lazyNamed(() => import('./pages/ReferralPartners/ReferralPartnersPage'), 'ReferralPartnersPage');
const PartnerDetailPage = lazyNamed(() => import('./pages/ReferralPartners/PartnerDetailPage'), 'PartnerDetailPage');
const DocumentLibraryPage = lazyNamed(() => import('./pages/DocumentLibrary/DocumentLibraryPage'), 'DocumentLibraryPage');
const TeamsPage = lazyNamed(() => import('./pages/Teams/TeamsPage'), 'TeamsPage');
const TeamDetailPage = lazyNamed(() => import('./pages/Teams/TeamDetailPage'), 'TeamDetailPage');
const UserListPage = lazyNamed(() => import('./pages/Users/UserListPage'), 'UserListPage');
const UserDetailPage = lazyNamed(() => import('./pages/Users/UserDetailPage'), 'UserDetailPage');
const AcceptanceInboxPage = lazyNamed(() => import('./pages/Acceptance/AcceptanceInboxPage'), 'AcceptanceInboxPage');
const ServicePackageListPage = lazyNamed(() => import('./pages/ServicePackages/ServicePackageListPage'), 'ServicePackageListPage');
const ServicePackageDetailPage = lazyNamed(() => import('./pages/ServicePackages/ServicePackageDetailPage'), 'ServicePackageDetailPage');
const MePage = lazyNamed(() => import('./pages/Me/MePage'), 'MePage');
const CreateVideoAIPage = lazyNamed(() => import('./pages/CreateVideoAI/CreateVideoAIPage'), 'CreateVideoAIPage');
const CreateVideoMotionControlPage = lazyNamed(() => import('./pages/CreateVideoAI/CreateVideoMotionControlPage'), 'CreateVideoMotionControlPage');
const LibraryVideoAiPage = lazyNamed(() => import('./pages/LibraryVideoAi/LibraryVideoAiPage'), 'LibraryVideoAiPage');
const DashboardAIPage = lazyNamed(() => import('./pages/DashboardAI/DashboardAIPage'), 'DashboardAIPage');
const SettingsPage = lazyNamed(() => import('./pages/Settings/SettingsPage'), 'SettingsPage');
const ChatPage = lazyNamed(() => import('./pages/Chat/ChatPage'), 'ChatPage');
const GameHubPage = lazyNamed(() => import('./games/GameHubPage'), 'GameHubPage');
const GameRoute = lazyNamed(() => import('./games/GameShell'), 'GameRoute');

const RouteLoadingFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-600" />
      <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
        Đang tải trang...
      </p>
    </div>
  </div>
);

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
      <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>

        {/* =========================
            Public routes
        ========================== */}

        <Route
          path="/login"
          element={<LoginPage />}
        />


        {/* =========================
            Dashboard
        ========================== */}

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Customers
        ========================== */}

        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Layout>
                <CustomersPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <CustomerDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Opportunities
        ========================== */}

        <Route
          path="/opportunities"
          element={
            <ProtectedRoute>
              <Layout>
                <OpportunitiesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/opportunities/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <OpportunityDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Services
        ========================== */}

        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <Layout>
                <ServicesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/services/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ServiceDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Jobs
        ========================== */}

        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <Layout>
                <JobsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobs/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <JobDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Contracts
        ========================== */}

        <Route
          path="/contracts"
          element={
            <ProtectedRoute>
              <Layout>
                <ContractsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/contracts/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ContractDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Projects
        ========================== */}

        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Layout>
                <ProjectsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ProjectDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Tasks
        ========================== */}

        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Layout>
                <TasksPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasks/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <TaskDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasks/:id/review"
          element={
            <ProtectedRoute>
              <Layout>
                <TaskReviewPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Finance
        ========================== */}

        <Route
          path="/finance"
          element={
            <ProtectedRoute>
              <Layout>
                <FinancePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-requests/:id?"
          element={
            <ProtectedRoute>
              <Layout>
                <PaymentRequestsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/finance/overview"
          element={
            <ProtectedRoute>
              <Layout>
                <PaymentOverviewPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/finance/acceptance-minutes"
          element={
            <ProtectedRoute>
              <Layout>
                <AcceptanceMinutesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/finance/vat-invoices"
          element={
            <ProtectedRoute>
              <Layout>
                <VatInvoicesPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Vendors
        ========================== */}

        <Route
          path="/vendors"
          element={
            <ProtectedRoute>
              <Layout>
                <VendorsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendors/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <VendorDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Referral Partners
        ========================== */}

        <Route
          path="/referral-partners"
          element={
            <ProtectedRoute>
              <Layout>
                <ReferralPartnersPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/referral-partners/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <PartnerDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Document Library
        ========================== */}

        <Route
          path="/document-library"
          element={
            <ProtectedRoute>
              <Layout>
                <DocumentLibraryPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Teams
        ========================== */}

        <Route
          path="/teams"
          element={
            <ProtectedRoute>
              <Layout>
                <TeamsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/teams/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <TeamDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Notifications
        ========================== */}

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Layout>
                <NotificationsPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Announcements
        ========================== */}

        <Route
          path="/announcements"
          element={
            <ProtectedRoute>
              <Layout>
                <AnnouncementsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/announcements/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <AnnouncementDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Users
        ========================== */}

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <UserListPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <UserDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Me
        ========================== */}

        <Route
          path="/me"
          element={
            <ProtectedRoute>
              <Layout>
                <MePage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Service Packages
        ========================== */}

        <Route
          path="/service-packages"
          element={
            <ProtectedRoute>
              <Layout>
                <ServicePackageListPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/service-packages/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ServicePackageDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Acceptance
        ========================== */}

        <Route
          path="/acceptance"
          element={
            <ProtectedRoute>
              <Layout>
                <AcceptanceInboxPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            AI Dashboard
        ========================== */}

        <Route
          path="/dashboard-ai"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardAIPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Create Video AI
        ========================== */}

        <Route
          path="/create-video-ai"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateVideoAIPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-video-motion-control"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateVideoMotionControlPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Library Video AI
        ========================== */}

        <Route
          path="/library-video-ai"
          element={
            <ProtectedRoute>
              <Layout>
                <LibraryVideoAiPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Chat
        ========================== */}

        {/* <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Layout>
                <ChatPage />
              </Layout>
            </ProtectedRoute>
          }
        /> */}


        {/* =========================
            Settings
        ========================== */}

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            Game Hub (danh sách game: src/games/registry.js)
        ========================== */}

        <Route
          path="/games"
          element={
            <ProtectedRoute>
              <Layout>
                <GameHubPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/games/:gameId"
          element={
            <ProtectedRoute>
              <Layout>
                <GameRoute />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Link cũ */}
        <Route path="/xiangqi" element={<Navigate to="/games/xiangqi" replace />} />


        {/* =========================
            Fallback
        ========================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
      </Suspense>

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
