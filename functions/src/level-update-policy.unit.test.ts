import { checkLevelUpdate } from './level-update-policy';
import { Arrays } from '../../common/utils';
import { listPlayerRecentGamesAsSymbol } from './dao';

jest.mock('./dao');

describe('checkLevelUpdate', () => {
  const mockListPlayerRecentGamesAsSymbol = listPlayerRecentGamesAsSymbol as jest.Mock;

  afterEach(() => {
    mockListPlayerRecentGamesAsSymbol.mockReset();
  });

  test('Does not get demoted below 1', async () => {
    mockListPlayerRecentGamesAsSymbol.mockReturnValueOnce(
      Arrays.repeat('L', 50));

    let maybeEvent = await checkLevelUpdate({
      ldap: 'jjong',
      name: 'Jongbin Park',
      level: 1,
      isNewbie: true,
    });

    console.info(maybeEvent);
    expect(maybeEvent).toBeUndefined();
  });

  test('Does not get promoted above 10', async () => {
    mockListPlayerRecentGamesAsSymbol.mockReturnValueOnce(
      Arrays.repeat('W', 50));

    let maybeEvent = await checkLevelUpdate({
      ldap: 'jjong',
      name: 'Jongbin Park',
      level: 10,
      isNewbie: true,
    });

    expect(maybeEvent).toBeUndefined();
  });

  test('No update if games played < 10', async () => {
    mockListPlayerRecentGamesAsSymbol.mockReturnValueOnce(
      Arrays.repeat('W', 9));

    let maybeEvent = await checkLevelUpdate({
      ldap: 'jjong',
      name: 'Jongbin Park',
      level: 5,
      isNewbie: true,
    });

    expect(maybeEvent).toBeUndefined();
  });

  test.each([
    [12, 15],
    [15, 20],
  ])('Promoted if more than %d games out of %d win', (wins, total) => {
    Arrays.range(wins, total + 1).forEach(async wins => {
      mockListPlayerRecentGamesAsSymbol.mockReturnValueOnce(
        Arrays.repeat('W', wins).concat(
          Arrays.repeat('L', total - wins)));
      
      let maybeEvent = await checkLevelUpdate({
        ldap: 'jjong',
        name: 'Jongbin Park',
        level: 5,
        isNewbie: true,
      });

      expect(maybeEvent).toMatchObject({
        type: 'promotion',
        payload: {
          ldap: 'jjong',
          levelFrom: 5,
          levelTo: 6
        }
      });
    });
  });

  test.each([
    [12, 15],
    [15, 20],
  ])('Demoted if more than %d games out of %d lost', (loses, total) => {
    Arrays.range(loses, total + 1).forEach(async loses => {
      mockListPlayerRecentGamesAsSymbol.mockReturnValueOnce(
        Arrays.repeat('L', loses).concat(
          Arrays.repeat('W', total - loses)));
      
      let maybeEvent = await checkLevelUpdate({
        ldap: 'jjong',
        name: 'Jongbin Park',
        level: 5,
        isNewbie: true,
      });

      expect(maybeEvent).toMatchObject({
        type: 'demotion',
        payload: {
          ldap: 'jjong',
          levelFrom: 5,
          levelTo: 4
        }
      });
    });
  });

});
