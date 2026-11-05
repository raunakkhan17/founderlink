import { Types } from 'mongoose';
import { DocumentModel, AccessLevel } from '../models/document.model';

describe('Document Model - AccessLevel Enum Validation', () => {
  const dummyStartupId = new Types.ObjectId();

  it('should fail with a Mongoose validation error on accessLevel when accessLevel is "secret"', () => {
    const doc = new DocumentModel({
      startupId: dummyStartupId,
      type: 'pitchdeck',
      title: 'Confidential Pitch',
      fileUrl: 'https://r2.example.com/pitch.pdf',
      accessLevel: 'secret' as any,
    });

    const error = doc.validateSync();

    expect(error).toBeDefined();
    expect(error?.errors).toBeDefined();
    expect(error?.errors.accessLevel).toBeDefined();
    expect(error?.errors.accessLevel.name).toBe('ValidatorError');
    expect(error?.errors.accessLevel.message).toContain('is not a valid access level');
  });

  it('should accept valid accessLevel values: "public", "locked", and "approved_only"', () => {
    const validLevels: AccessLevel[] = ['public', 'locked', 'approved_only'];

    for (const level of validLevels) {
      const doc = new DocumentModel({
        startupId: dummyStartupId,
        type: 'pitchdeck',
        title: `Pitch Deck - ${level}`,
        fileUrl: `https://r2.example.com/${level}.pdf`,
        accessLevel: level,
      });

      const error = doc.validateSync();
      expect(error).toBeUndefined();
      expect(doc.accessLevel).toBe(level);
    }
  });
});

