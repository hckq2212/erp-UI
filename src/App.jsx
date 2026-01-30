import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { CustomersPage } from './pages/Customers/CustomersPage';
import { OpportunitiesPage } from './pages/Opportunities/OpportunitiesPage';
import { OpportunityDetailPage } from './pages/Opportunities/OpportunityDetailPage/OpportunityDetailPage';
import { ServicesPage } from './pages/Services/ServicesPage';
import { ServiceDetailPage } from './pages/Services/ServiceDetailPage';
import { JobsPage } from './pages/Jobs/JobsPage';
import { ContractsPage } from './pages/Contracts/ContractsPage';
import { ProjectsPage } from './pages/Projects/ProjectsPage';
import { ProjectDetailPage } from './pages/Projects/ProjectDetailPage/ProjectDetailPage';
import { TasksPage } from './pages/Tasks/TasksPage';
import { TaskDetailPage } from './pages/Tasks/TaskDetailPage';
import { FinancePage } from './pages/Finance/FinancePage';
import { VendorsPage } from './pages/Vendors/VendorsPage';
import { VendorDetailPage } from './pages/Vendors/VendorDetailPage';
import { LoginPage } from './pages/Auth/LoginPage';
import ContractDetailPage from './pages/Contracts/ContractDetailPage/ContractDetailPage';
import { NotificationsPage } from './pages/Notifications/NotificationsPage';
import { ReferralPartnersPage } from './pages/ReferralPartners/ReferralPartnersPage';

function App() {
  return (
    <BrowserRouter>
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
          path='/notifications'
          element={
            <ProtectedRoute>
              <Layout>
                <NotificationsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
