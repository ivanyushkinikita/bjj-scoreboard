import { describe, expect, it } from 'vitest';
import { titleCaseName } from './names';

describe('titleCaseName', () => {
  it('capitalizes every Cyrillic and Latin word while preserving separators', () => {
    expect(titleCaseName('\u0438\u0412\u0410\u041d-\u0438\u0432\u0410\u041d\u041e\u0412  aNNa')).toBe('\u0418\u0432\u0430\u043d-\u0418\u0432\u0430\u043d\u043e\u0432  Anna');
  });
});