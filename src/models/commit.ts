export type Commit = {
  hash: string;
  shortHash: string;
  message: string;
  jiraKeys: string[];
  author: string;
  date: string;
  webUrl: string;
};
