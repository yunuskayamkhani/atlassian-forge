export type PipelineRun = {
  uuid: string;
  buildNumber: number | null;
  status: string;
  branch: string;
  commitHash: string;
  trigger: string;
  createdOn: string;
  completedOn: string;
  buildSeconds: number | null;
  webUrl: string;
};
