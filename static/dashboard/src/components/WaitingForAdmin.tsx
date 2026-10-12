export function WaitingForAdmin() {
  return (
    <section className="connect-card" aria-labelledby="waiting-title">
      <h2 id="waiting-title">Waiting for an administrator</h2>
      <p>
        A Jira administrator needs to connect Bitbucket and enable the Jira projects you should see. If you
        already have access, ask them to add you to the dashboard viewer group.
      </p>
    </section>
  );
}
