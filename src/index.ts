import Resolver from '@forge/resolver';
import { getAppStatus } from './resolvers/appStatus';
import { connectBitbucket, disconnectBitbucket, getConnectionStatus } from './resolvers/connection';
import { deleteProjectMapping, getAccessContext, saveDashboardAdmins, saveProjectMapping } from './resolvers/access';
import { searchUsers } from './resolvers/users';
import { getWorkspaces } from './resolvers/workspaces';
import { getRepositories, getRepositoryDetails } from './resolvers/repositories';
import { getPullRequests } from './resolvers/pullRequests';
import { getCommits } from './resolvers/commits';
import { getIssueStatuses } from './resolvers/jiraIssues';
import { getBoards, getSprints } from './resolvers/sprints';

const resolver = new Resolver();

resolver.define('getAppStatus', () => getAppStatus());
resolver.define('getConnectionStatus', () => getConnectionStatus());
resolver.define('getAccessContext', () => getAccessContext());
resolver.define('saveProjectMapping', (req) => saveProjectMapping(req.payload));
resolver.define('deleteProjectMapping', (req) => deleteProjectMapping(req.payload));
resolver.define('saveDashboardAdmins', (req) => saveDashboardAdmins(req.payload));
resolver.define('searchUsers', (req) => searchUsers(req.payload));
resolver.define('connectBitbucket', (req) => connectBitbucket(req.payload));
resolver.define('disconnectBitbucket', () => disconnectBitbucket());
resolver.define('getWorkspaces', () => getWorkspaces());
resolver.define('getRepositories', (req) => getRepositories(req.payload));
resolver.define('getRepository', (req) => getRepositoryDetails(req.payload));
resolver.define('getPullRequests', (req) => getPullRequests(req.payload));
resolver.define('getCommits', (req) => getCommits(req.payload));
resolver.define('getIssueStatuses', (req) => getIssueStatuses(req.payload));
resolver.define('getBoards', (req) => getBoards(req.payload));
resolver.define('getSprints', (req) => getSprints(req.payload));

export const handler = resolver.getDefinitions();
