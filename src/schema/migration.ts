export interface MigrationStep {
  fromVersion: number;
  toVersion: number;
  migrate: (data: Record<string, unknown>) => Record<string, unknown>;
}

// Registry of sequential migration steps for future schema upgrades
export const MIGRATIONS: MigrationStep[] = [
  // Example future migration:
  // {
  //   fromVersion: 1,
  //   toVersion: 2,
  //   migrate: (data) => ({ ...data, version: 2 })
  // }
];

export const CURRENT_PIXORA_VERSION = 1;

export function migrateProject(data: Record<string, unknown>): Record<string, unknown> {
  let current = { ...data };
  let version = (current.version as number) || 1;

  while (version < CURRENT_PIXORA_VERSION) {
    const step = MIGRATIONS.find(m => m.fromVersion === version);
    if (!step) {
      break;
    }
    current = step.migrate(current);
    version = step.toVersion;
  }

  return current;
}
