import { FilterProvider } from './state/FilterContext';
import { DashboardDataProvider } from './state/DashboardData';
import { useDiscovery } from './state/useDiscovery';
import { ConnectBitbucket } from './components/ConnectBitbucket';
import { Dashboard } from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorState } from './components/ErrorState';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { WaitingForAdmin } from './components/WaitingForAdmin';

function Shell() {
  const discovery = useDiscovery();

  if (discovery.loadState === 'loading' && !discovery.lastUpdated && !discovery.needsConnection) {
    return <LoadingSkeleton />;
  }

  if (discovery.loadState === 'error' && !discovery.lastUpdated && !discovery.needsConnection) {
    return (
      <ErrorState
        message={discovery.errorMessage ?? 'Unable to load dashboard.'}
        onRetry={() => void discovery.load()}
      />
    );
  }

  if (discovery.needsConnection) {
    return (
      <div className="app-shell">
        <header className="hero">
          <p className="eyebrow">BITBUCKET ENGINEERING</p>
          <h1>Engineering dashboard</h1>
        </header>
        {discovery.isAdmin ? (
          <ConnectBitbucket
            errorMessage={discovery.errorMessage}
            isSaving={discovery.isRefreshing}
            onConnect={discovery.connect}
          />
        ) : (
          <WaitingForAdmin />
        )}
      </div>
    );
  }

  return (
    <Dashboard
      isAdmin={discovery.isAdmin}
      admins={discovery.admins}
      mappings={discovery.mappings}
      jiraProjects={discovery.jiraProjects}
      workspaces={discovery.workspaces}
      repositories={discovery.repositories}
      lastUpdated={discovery.lastUpdated}
      isRefreshing={discovery.isRefreshing}
      errorMessage={discovery.errorMessage}
      retryable={discovery.retryable}
      repositoryStatus={discovery.repositoryStatus}
      onRefresh={() => void discovery.load()}
      onDisconnect={() => void discovery.disconnect()}
      onSaveMapping={discovery.saveMapping}
      onSaveAdmins={discovery.saveAdmins}
      onDeleteMapping={discovery.removeMapping}
      onLoadRepositories={discovery.loadAdminRepositories}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FilterProvider>
        <DashboardDataProvider>
          <Shell />
        </DashboardDataProvider>
      </FilterProvider>
    </ErrorBoundary>
  );
}
