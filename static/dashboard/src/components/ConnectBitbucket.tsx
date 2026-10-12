import { useState } from 'react';

export function ConnectBitbucket({
  errorMessage,
  isSaving,
  onConnect
}: {
  errorMessage: string | null;
  isSaving: boolean;
  onConnect: (email: string, token: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');

  return (
    <section className="connect-card" aria-labelledby="connect-title">
      <h2 id="connect-title">Connect Bitbucket</h2>
      <p>
        Forge cannot mix Bitbucket workspace scopes with a Jira site app. Connect with a Bitbucket API token
        instead. The token is stored encrypted in Forge and is never sent back to the browser.
      </p>
      <ol>
        <li>
          Open{' '}
          <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noreferrer">
            API tokens
          </a>
        </li>
        <li>Create an API token with scopes and select <strong>Bitbucket</strong> (not Forge)</li>
        <li>
          Include <code>read:workspace:bitbucket</code> and <code>read:repository:bitbucket</code>
        </li>
      </ol>
      <form
        className="connect-form"
        onSubmit={(event) => {
          event.preventDefault();
          void onConnect(email, token);
        }}
      >
        <label className="filter-field">
          <span>Atlassian email</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="filter-field">
          <span>Bitbucket API token</span>
          <input
            type="password"
            autoComplete="current-password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
          />
        </label>
        {errorMessage ? (
          <p className="connect-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <button type="submit" className="refresh-button" disabled={isSaving}>
          {isSaving ? 'Connecting…' : 'Connect Bitbucket'}
        </button>
      </form>
    </section>
  );
}
