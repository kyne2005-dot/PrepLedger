import { describe, expect, it } from 'vitest';
import {
  CURRENT_SCHEMA_VERSION,
  buildExportPayload,
  createInitialState,
  validateAndParseBackupJson,
} from './storage';

describe('backup JSON export & import validation', () => {
  it('includes a schema version field in exported JSON', () => {
    const today = '2026-11-14';
    const initial = createInitialState(today);
    const exported = buildExportPayload(initial, today);

    expect(exported.version).toBe(CURRENT_SCHEMA_VERSION);
    expect(exported.lastExportDate).toBe(today);
  });

  it('rejects malformed JSON and files missing required fields', () => {
    const today = '2026-11-14';

    const badSyntax = validateAndParseBackupJson('{not valid json', today);
    expect(badSyntax.ok).toBe(false);

    const notObject = validateAndParseBackupJson('[1, 2, 3]', today);
    expect(notObject.ok).toBe(false);

    const missingRequired = validateAndParseBackupJson(
      JSON.stringify({ version: 1, foo: 'bar' }),
      today
    );
    expect(missingRequired.ok).toBe(false);

    const badLeetCodeEntry = validateAndParseBackupJson(
      JSON.stringify({
        version: 1,
        leetcodeLogs: [{ title: 'Two Sum', date: 'not-a-date' }],
        internships: [],
      }),
      today
    );
    expect(badLeetCodeEntry.ok).toBe(false);

    const badVersion = validateAndParseBackupJson(
      JSON.stringify({
        version: 'one',
        leetcodeLogs: [],
        internships: [],
      }),
      today
    );
    expect(badVersion.ok).toBe(false);
  });

  it('accepts older versions without a version field and fills missing sections with defaults', () => {
    const today = '2026-11-14';
    const legacyBackup = JSON.stringify({
      firstUseDate: '2026-10-01',
      leetcodeLogs: [
        {
          id: 'old-1',
          date: '2026-10-02',
          title: 'Two Sum',
          notes: 'Used hashmap',
        },
      ],
      internships: [
        {
          id: 'old-int-1',
          company: 'Acme Corp',
          status: 'Applied',
          dateApplied: '2026-10-05',
          notes: 'Applied online',
        },
      ],
    });

    const result = validateAndParseBackupJson(legacyBackup, today);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.state.version).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.state.firstUseDate).toBe('2026-10-01');
    expect(result.state.leetcodeLogs).toHaveLength(1);
    expect(result.state.leetcodeLogs[0].difficulty).toBe('Medium');
    expect(result.state.internships).toHaveLength(1);
    expect(result.state.contacts).toEqual([]);
    expect(result.state.stories).toEqual([]);
    expect(result.state.gymLogs).toEqual([]);
    expect(result.state.dismissedFollowUps).toEqual([]);
    expect(result.state.sprintState.currentSprint.status).toBe('active');
    expect(result.state.settings.dailyMinProblems).toBe(1);
  });
});
