import 'fake-indexeddb/auto';
// Matchers do jest-dom (toBeInTheDocument etc.) para o Vitest.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
