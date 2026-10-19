import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { useGetMeQuery } from './api/auth';

import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SessionExpiredModal } from './components/auth/SessionExpiredModal';
import { ROUTE_PERMISSIONS } from './config/routes.config';
import { selectSessionExpired, selectIsAuthenticated } from './store/authSlice';
import { hasSessionMarker } from './utils/authSession';

const RoleRoute = ({ path, element }) => {
  const allowedRoles = ROUTE_PERMISSIONS[path];
  if (!allowedRoles || allowedRoles.length === 0) {
    return element;
  }
  return <ProtectedRoute allowedRoles={allowedRoles}>{element}</ProtectedRoute>;
};

const lazyNamed = (loader, exportName) => lazy(() =>
  loader().then((module) => ({ default: module[exportName] }))
);

const DashboardPage = lazyNamed(() => import('./pages/Dashboard/DashboardPage'), 'DashboardPage');
const ChatBubbleWidget = lazy(() =>
  import('./components/chat/ChatBubbleWidget').then((module) => ({ default: module.ChatBubbleWidget }))
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
  const sessionExpired = useSelector(selectSessionExpired);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const pathname = globalThis.location?.pathname || '/';
  const shouldCheckSession = hasSessionMarker() && !sessionExpired && pathname !== '/login';

  // Use the query to check if the user is logged in via cookies on startup
  const { isLoading } = useGetMeQuery(undefined, {
    skip: !shouldCheckSession,
  });

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
              Authenticated Application Shell (Persistent Layout & SSE via Outlet)
          ========================== */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/customers" element={<RoleRoute path="/customers" element={<CustomersPage />} />} />
            <Route path="/customers/:id" element={<RoleRoute path="/customers/:id" element={<CustomerDetailPage />} />} />
            <Route path="/opportunities" element={<RoleRoute path="/opportunities" element={<OpportunitiesPage />} />} />
            <Route path="/opportunities/:id" element={<RoleRoute path="/opportunities/:id" element={<OpportunityDetailPage />} />} />
            <Route path="/services" element={<RoleRoute path="/services" element={<ServicesPage />} />} />
            <Route path="/services/:id" element={<RoleRoute path="/services/:id" element={<ServiceDetailPage />} />} />
            <Route path="/jobs" element={<RoleRoute path="/jobs" element={<JobsPage />} />} />
            <Route path="/jobs/:id" element={<RoleRoute path="/jobs/:id" element={<JobDetailPage />} />} />
            <Route path="/contracts" element={<RoleRoute path="/contracts" element={<ContractsPage />} />} />
            <Route path="/contracts/:id" element={<RoleRoute path="/contracts/:id" element={<ContractDetailPage />} />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
            <Route path="/tasks/:id/review" element={<TaskReviewPage />} />
            <Route path="/finance" element={<RoleRoute path="/finance" element={<FinancePage />} />} />
            <Route path="/payment-requests/:id?" element={<PaymentRequestsPage />} />
            <Route path="/finance/overview" element={<RoleRoute path="/finance/overview" element={<PaymentOverviewPage />} />} />
            <Route path="/finance/acceptance-minutes" element={<RoleRoute path="/finance/acceptance-minutes" element={<AcceptanceMinutesPage />} />} />
            <Route path="/finance/vat-invoices" element={<RoleRoute path="/finance/vat-invoices" element={<VatInvoicesPage />} />} />
            <Route path="/vendors" element={<RoleRoute path="/vendors" element={<VendorsPage />} />} />
            <Route path="/vendors/:id" element={<RoleRoute path="/vendors/:id" element={<VendorDetailPage />} />} />
            <Route path="/referral-partners" element={<RoleRoute path="/referral-partners" element={<ReferralPartnersPage />} />} />
            <Route path="/referral-partners/:id" element={<RoleRoute path="/referral-partners/:id" element={<PartnerDetailPage />} />} />
            <Route path="/document-library" element={<DocumentLibraryPage />} />
            <Route path="/teams" element={<RoleRoute path="/teams" element={<TeamsPage />} />} />
            <Route path="/teams/:id" element={<RoleRoute path="/teams/:id" element={<TeamDetailPage />} />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
            <Route path="/users" element={<RoleRoute path="/users" element={<UserListPage />} />} />
            <Route path="/users/:id" element={<RoleRoute path="/users/:id" element={<UserDetailPage />} />} />
            <Route path="/me" element={<MePage />} />
            <Route path="/service-packages" element={<RoleRoute path="/service-packages" element={<ServicePackageListPage />} />} />
            <Route path="/service-packages/:id" element={<RoleRoute path="/service-packages/:id" element={<ServicePackageDetailPage />} />} />
            <Route path="/acceptance" element={<RoleRoute path="/acceptance" element={<AcceptanceInboxPage />} />} />
            <Route path="/dashboard-ai" element={<DashboardAIPage />} />
            <Route path="/create-video-ai" element={<CreateVideoAIPage />} />
            <Route path="/create-video-motion-control" element={<CreateVideoMotionControlPage />} />
            <Route path="/library-video-ai" element={<LibraryVideoAiPage />} />
            <Route path="/settings" element={<RoleRoute path="/settings" element={<SettingsPage />} />} />
            <Route path="/chat" element={<ChatPage />} />
          </Route>

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
      {isAuthenticated && <ChatBubbleWidget />}
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
