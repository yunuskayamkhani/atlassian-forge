import { toFailureResult, type Result } from '../services/bitbucket/errors';
import { hasBitbucketConnection } from '../services/bitbucket/credentials';
import { listBrowsableProjects } from '../services/jira/access';
import { listAdmins, saveAdmins } from '../services/config/admins';
import { deleteMapping, listVisibleMappings, saveMapping } from '../services/config/mappings';
import type { ProjectMapping } from '../models/projectMapping';
import type { AppUser } from '../models/appUser';
import type { JiraProject } from '../services/jira/access';

export type AccessContext = {
  connected: boolean;
  isAdmin: boolean;
  mappings: ProjectMapping[];
  jiraProjects: JiraProject[];
  admins: AppUser[];
};

export async function getAccessContext(): Promise<Result<AccessContext>> {
  try {
    const [connected, visible, admins] = await Promise.all([
      hasBitbucketConnection(),
      listVisibleMappings(),
      listAdmins()
    ]);
    const jiraProjects = visible.isAdmin ? await listBrowsableProjects() : [];
    console.log(
      `getAccessContext -> connected=${connected} isAdmin=${visible.isAdmin} mappings=${visible.mappings.length} admins=${admins.length}`
    );
    return {
      ok: true,
      data: {
        connected,
        isAdmin: visible.isAdmin,
        mappings: visible.mappings,
        jiraProjects,
        admins: visible.isAdmin ? admins : []
      }
    };
  } catch (error) {
    console.error('getAccessContext failed', error);
    return toFailureResult(error);
  }
}

export async function saveProjectMapping(payload: unknown): Promise<Result<ProjectMapping[]>> {
  try {
    const data = await saveMapping(payload);
    console.log(`saveProjectMapping -> ${data.length} mappings`);
    return { ok: true, data };
  } catch (error) {
    return toFailureResult(error);
  }
}

export async function deleteProjectMapping(payload: unknown): Promise<Result<ProjectMapping[]>> {
  try {
    const data = await deleteMapping(payload);
    console.log(`deleteProjectMapping -> ${data.length} mappings`);
    return { ok: true, data };
  } catch (error) {
    return toFailureResult(error);
  }
}

export async function saveDashboardAdmins(payload: unknown): Promise<Result<AppUser[]>> {
  try {
    const data = await saveAdmins(payload);
    console.log(`saveDashboardAdmins -> ${data.length} admins`);
    return { ok: true, data };
  } catch (error) {
    return toFailureResult(error);
  }
}
