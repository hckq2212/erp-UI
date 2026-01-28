import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { CustomersPage } from './pages/Customers/CustomersPage';
import { OpportunitiesPage } from './pages/Opportunities/OpportunitiesPage';
import { OpportunityDetailPage } from './pages/Opportunities/OpportunityDetailPage/OpportunityDetailPage';
import { QuotationsPage } from './pages/Quotations/QuotationsPage';
import { ContractsPage } from './pages/Contracts/ContractsPage';
import { ProjectsPage } from './pages/Projects/ProjectsPage';
import { TasksPage } from './pages/Tasks/TasksPage';
import { FinancePage } from './pages/Finance/FinancePage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { LoginPage } from './pages/Auth/LoginPage';

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
          path='/quotations'
          element={
            <ProtectedRoute>
              <Layout>
                <QuotationsPage />
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
    </BrowserRouter>
  );
}

export default App;
