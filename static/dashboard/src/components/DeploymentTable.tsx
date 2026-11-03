import { EmptyState } from './EmptyState';
import { SectionCard } from './SectionCard';

export function DeploymentTable() {
  return (
    <SectionCard
      id="deployments"
      title="Deployments"
      description="Environment, status, commit, repository, timing, and deployment links."
    >
      <EmptyState
        title="No deployments"
        message="Deployment history will appear after Bitbucket deployments are connected."
      />
    </SectionCard>
  );
}
