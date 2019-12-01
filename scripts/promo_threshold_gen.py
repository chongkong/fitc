import functools
import math

import fire
import numpy as np
import scipy.integrate


def integrate(scalar_fn, a, b):
    result = scipy.integrate.quad(scalar_fn, a, b)
    return result[0]


@functools.lru_cache(maxsize=1024)
def binom(n, k):
    """Returns bionmial coefficient n!/(n-k)!k!"""
    if 2*k > n:
        k = n - k
    if k == 0:
        return 1
    return binom(n-1, k-1) + binom(n-1, k)


def binomial_pmf(p, n, k):
    """Returns probability of getting `k` positive out of `n` trials
    when success probability is `p`."""
    return binom(n, k) * pow(p, k) * pow(1-p, n-k)


@np.vectorize
def binomial_test(threshold, wins, loses):
    """Returns probabiliy of winrate >= threshold given number of wins
    and loses."""
    binomial_pdf = functools.partial(binomial_pmf, n=wins + loses, k=wins)
    return (integrate(binomial_pdf, a=threshold, b=1)
            / integrate(binomial_pdf, a=0, b=1))


@np.vectorize
def required_wins_to_claim_winrate(num_games, winrate, confidence):
    """Return number of games won to claim winrate >= winrate 
    given total number of games with given confidence."""
    winrate = np.ones([num_games + 1], dtype=np.float64) * winrate
    wins = np.arange(num_games + 1)
    loses = num_games - wins
    result = binomial_test(winrate, wins, loses)
    if any(result):
        return np.argmax(result > confidence)
    else:
        return -1


def main(
    winrate,
    confidence,
    output_format='js',  # Output format.
    window_size=100,  # Number of recent games to decide promotion.
    min_games=10,  # Minimal number of games to play to be a promo candidate.
):
    promo_threshold = required_wins_to_claim_winrate(
        num_games=np.arange(window_size + 1),
        winrate=winrate,
        confidence=confidence
    )
    promo_threshold[:min_games] = -1

    if output_format == 'js':
        print('\n'.join([
            'const PROMO_THRESHOLDS = [',
            *[
              '  ' + ('{:2d}, ' * min(10, len(promo_threshold[10*i:])))
              .format(*promo_threshold[10*i:10*(i + 1)])
              .rstrip()
              for i in range(0, (len(promo_threshold) + 9) // 10)
              ],
            '];'
        ]).replace(',\n]', '\n]'))

    elif output_format == 'md':
        print('\n'.join([
            '| Required Wins | Games Played |',
            '| ============= | ============ |',
            *[
              '| {:13d} | {:12d} |'.format(wins, total)
              for wins, total in zip(promo_threshold, np.arange(window_size + 1))
              ]
        ]))


if __name__ == '__main__':
    fire.Fire(main)
