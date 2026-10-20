"""The unrounded values `kalman` and `traffic_light` give for the page's test
data, which `src/trend/trend.test.ts` and `src/verdict/traffic-light.test.ts`
hold the page's filter and traffic light to.

    python3 -I analysis/kalman/reference.py > src/test/fixtures/kalman-reference.json

Run it again after changing a setting in `kalman.py`.
"""

import datetime as dt
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from kalman import kalman, load, traffic_light  # noqa: E402

FIXTURE = os.path.join(HERE, "..", "..", "src", "test", "fixtures", "gewicht-2026-07-bis-10.csv")
# The days `src/test/weight-history-fixture.ts` adds to the extract; the two
# change together.
EXTRA = [(dt.date(2026, 10, 18), 98.4), (dt.date(2026, 10, 19), 97.0), (dt.date(2026, 10, 20), 96.9)]


def main():
    rows = load(FIXTURE) + EXTRA
    days, kgs = [d for d, _ in rows], [k for _, k in rows]
    out, _ = kalman(days, kgs)
    light = traffic_light(out)
    reference = [
        {
            "day": d.isoformat(),
            "kg": kg,
            "level": level,
            "pacePerDay": pace,
            "levelVariance": var_level,
            "pacePerDayVariance": var_pace,
            "z": z,
            "light": colour,
            "pNotLosing": p_not,
        }
        for d, kg, (level, pace, var_level, var_pace, z), (colour, p_not) in zip(days, kgs, out, light)
    ]
    json.dump(reference, sys.stdout, indent=2)
    print()


if __name__ == "__main__":
    main()
