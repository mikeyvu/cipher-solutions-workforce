import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { ContractorsPage } from '@/pages/ContractorsPage'
import { EmployeesPage } from '@/pages/EmployeesPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { ProjectDetailPage } from '@/pages/ProjectDetailPage'
import { BackupPage } from '@/pages/BackupPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/contractors" replace />} />
        <Route path="/contractors" element={<ContractorsPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/backup" element={<BackupPage />} />
      </Route>
    </Routes>
  )
}

export default App
