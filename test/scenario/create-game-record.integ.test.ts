import { helper } from '../helper';

jest.mock('../../functions/src/firebase', () => {
  const app = helper.createFirebaseAdminApp();
  return { app };
});

describe('Creates GameRecord', () => {
  test('Example test', () => {
    console.info('success!');
  });
});
