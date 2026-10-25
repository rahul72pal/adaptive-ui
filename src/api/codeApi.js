import { apiClient } from './client';

export const codeApi = {
  /**
   * Execute code against test cases on the backend sandbox.
   * Endpoint: POST /api/code/execute
   */
  execute: ({ language = 'python', code, function_name = 'solution', test_cases = [], contract = {} }) =>
    apiClient.post('/code/execute', {
      language,
      code,
      function_name,
      test_cases,
      ...contract,
    }),
};
