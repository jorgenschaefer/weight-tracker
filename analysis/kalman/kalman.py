"""Backtest of the morning assessment on one's own weight history.

Everything here only looks at measurements up to the day it judges, as the
page would on that morning. The CSV (``datum,kg``, decimals with a point or a
comma) is passed as an argument and stays out of the repository.

    python3 -I kalman.py fit      gewicht.csv   # fit the noise parameters
    python3 -I kalman.py grid     gewicht.csv   # compare settings of the traffic light
    python3 -I kalman.py days     gewicht.csv 2026-10-01 2026-10-20
    python3 -I kalman.py smoothers gewicht.csv  # seven smoothers against a retrospective curve
"""

import datetime as dt
import math
import statistics as st
import sys

START = dt.date(2023, 1, 1)  # dense data from here on
EVALUATE_FROM = dt.date(2023, 3, 1)  # after the filter has settled

# The setting that did best in `grid`: measurement variance (kg²), how far the
# weight itself wanders (kg²/day), how fast the pace may change ((kg/day)²/day).
MEASUREMENT_VAR = 0.3
LEVEL_VAR = 0.02
PACE_VAR = 1e-4
# Traffic light: green where it is this likely that the pace is under the
# threshold, red where it is this likely that it is not.
THRESHOLD_KG_PER_WEEK = -0.1
CONFIDENCE = 0.8
PLAN_KG_PER_WEEK = -0.5


def load(path, start=START):
    rows = []
    for line in open(path).read().splitlines()[1:]:
        day, kg = line.split(",", 1)
        rows.append((dt.date.fromisoformat(day), float(kg.replace(",", "."))))
    return sorted(r for r in rows if r[0] >= start)


def phi(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


def kalman(days, kgs, r=MEASUREMENT_VAR, q_level=LEVEL_VAR, q_pace=PACE_VAR, robust=True):
    """Local linear trend: level and pace per day, with their covariance.

    Returns per measurement (level kg, pace kg/day, var level, var pace,
    deviation of the measurement from its prediction in standard deviations)
    and the Gaussian log-likelihood of the predictions. With `robust` a
    measurement more than 2 standard deviations off counts less.
    """
    x = [kgs[0], 0.0]
    p = [[1.0, 0.0], [0.0, (0.5 / 7) ** 2]]
    out = [(x[0], 0.0, p[0][0], p[1][1], 0.0)]
    loglik = 0.0
    for i in range(1, len(kgs)):
        t = (days[i] - days[i - 1]).days
        x = [x[0] + t * x[1], x[1]]
        p = [
            [
                p[0][0] + 2 * t * p[0][1] + t * t * p[1][1] + q_level * t + q_pace * t**3 / 3,
                p[0][1] + t * p[1][1] + q_pace * t * t / 2,
            ],
            [p[0][1] + t * p[1][1] + q_pace * t * t / 2, p[1][1] + q_pace * t],
        ]
        v = kgs[i] - x[0]
        s = p[0][0] + r
        loglik += -0.5 * (math.log(2 * math.pi * s) + v * v / s)
        z = v / math.sqrt(s)
        if robust and abs(z) > 2:
            s = p[0][0] + r * (abs(z) / 2) ** 2
        k = [p[0][0] / s, p[0][1] / s]
        x = [x[0] + k[0] * v, x[1] + k[1] * v]
        p = [
            [(1 - k[0]) * p[0][0], (1 - k[0]) * p[0][1]],
            [(1 - k[0]) * p[0][1], p[1][1] - k[1] * p[0][1]],
        ]
        out.append((x[0], x[1], p[0][0], p[1][1], z))
    return out, loglik


def traffic_light(out, threshold=THRESHOLD_KG_PER_WEEK, confidence=CONFIDENCE, hysteresis=0.0):
    """Per day (colour, P(pace over threshold)). A colour once shown holds
    until its probability falls under confidence - hysteresis."""
    state, res = "gelb", []
    for _level, pace, _vl, var_pace, _z in out:
        p_not = phi((pace * 7 - threshold) / (math.sqrt(var_pace) * 7))
        p_loss = 1 - p_not
        if not ((state == "rot" and p_not > confidence - hysteresis) or (state == "grün" and p_loss > confidence - hysteresis)):
            enter = confidence + hysteresis
            state = "rot" if p_not > enter else ("grün" if p_loss > enter else "gelb")
        res.append((state, p_not))
    return res


def local_regression(days, kgs, i, half=14):
    """Retrospective level and pace (kg/week) on day i: tricube-weighted linear
    regression over ±half days, None without 5 measurements on each side."""
    pts = [((days[j] - days[i]).days, kgs[j]) for j in range(len(days)) if abs((days[j] - days[i]).days) <= half]
    if sum(t < 0 for t, _ in pts) < 5 or sum(t > 0 for t, _ in pts) < 5:
        return None
    w = [(1 - (abs(t) / (half + 1)) ** 3) ** 3 for t, _ in pts]
    sw = sum(w)
    tb = sum(a * t for a, (t, _) in zip(w, pts)) / sw
    yb = sum(a * y for a, (_, y) in zip(w, pts)) / sw
    b = sum(a * (t - tb) * (y - yb) for a, (t, y) in zip(w, pts)) / sum(a * (t - tb) ** 2 for a, (t, _) in zip(w, pts))
    return yb - b * tb, b * 7


def phase(pace):
    """The retrospective phase a day belongs to, by its pace in kg/week."""
    if pace is None:
        return None
    return "ab" if pace < -0.25 else ("nicht" if pace >= 0 else "unklar")


def episodes(phases, days, target, min_days=14):
    """Indices where the phase turns to target and stays at least min_days."""
    eps, i = [], 1
    while i < len(phases):
        if phases[i] == target and phases[i - 1] != target:
            j = i
            while j < len(phases) and phases[j] == target:
                j += 1
            if (days[j - 1] - days[i]).days >= min_days:
                eps.append(i)
            i = j
        else:
            i += 1
    return eps


def evaluate(days, kgs, phases, q_level, q_pace, confidence, hysteresis):
    out, _ = kalman(days, kgs, q_level=q_level, q_pace=q_pace)
    light = traffic_light(out, confidence=confidence, hysteresis=hysteresis)
    idx = [i for i in range(len(days)) if days[i] >= EVALUATE_FROM and phases[i]]

    def share(ph, colour):
        return sum(phases[i] == ph and light[i][0] == colour for i in idx) / sum(phases[i] == ph for i in idx)

    def delays(target, colour, cap=42):
        res = []
        for s in episodes(phases, days, target):
            if days[s] < EVALUATE_FROM:
                continue
            d = cap
            for j in range(s, len(days)):
                if (days[j] - days[s]).days > cap:
                    break
                if light[j][0] == colour:
                    d = (days[j] - days[s]).days
                    break
            res.append(d)
        return res

    changes = sum(1 for i in range(1, len(days)) if days[i] >= EVALUATE_FROM and light[i][0] != light[i - 1][0])
    return {
        "false_red": share("ab", "rot"),
        "false_green": share("nicht", "grün"),
        "changes_per_30_days": changes / (days[-1] - EVALUATE_FROM).days * 30,
        "days_to_red": delays("nicht", "rot"),
        "days_to_green": delays("ab", "grün"),
    }


def median(values):
    return sorted(values)[len(values) // 2]


def cmd_fit(days, kgs):
    res = []
    for r in [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4]:
        for ql in [0, 0.01, 0.02, 0.04, 0.08, 0.16, 0.32]:
            for qp in [1e-8, 1e-7, 1e-6, 1e-5, 3e-5, 1e-4]:
                _, ll = kalman(days, kgs, r, ql, qp, robust=False)
                res.append((ll, r, ql, qp))
    print("Best fit per pace variance (the likelihood barely tells them apart):")
    for qp in sorted({x[3] for x in res}):
        ll, r, ql, _ = max(x for x in res if x[3] == qp)
        print(f"  q_pace={qp:<7g} loglik={ll:8.1f}  r={r:.2f} (±{math.sqrt(r):.2f} kg)  q_level={ql:.2f}")


def cmd_grid(days, kgs):
    phases = [phase(None if (lr := local_regression(days, kgs, i)) is None else lr[1]) for i in range(len(days))]
    print("q_level q_pace   conf hyst | red while losing | green while not | changes/30d | days to red (median) | days to green")
    for ql in [0.0, 0.02, 0.08]:
        for qp in [1e-6, 3e-6, 1e-5, 3e-5, 1e-4]:
            for c in [0.7, 0.8, 0.9]:
                for h in [0, 0.05, 0.1]:
                    if c + h >= 0.99:
                        continue
                    e = evaluate(days, kgs, phases, ql, qp, c, h)
                    print(
                        f"{ql:<7} {qp:<8g} {c:.2f} {h:.2f} | {e['false_red'] * 100:5.1f} %          "
                        f"| {e['false_green'] * 100:5.1f} %         | {e['changes_per_30_days']:4.1f}        "
                        f"| {median(e['days_to_red']):2d} {e['days_to_red']} | {median(e['days_to_green']):2d} {e['days_to_green']}"
                    )


def cmd_days(days, kgs, first, last):
    out, _ = kalman(days, kgs)
    light = traffic_light(out)
    print("day        kg    | estimate       | pace kg/week   | kcal/day     | P(loss) P(plan) | dev   | light")
    for i, d in enumerate(days):
        if not first <= d <= last:
            continue
        level, pace, var_level, var_pace, z = out[i]
        sd = math.sqrt(var_pace) * 7
        p_loss = phi((THRESHOLD_KG_PER_WEEK - pace * 7) / sd)
        p_plan = phi((PLAN_KG_PER_WEEK - pace * 7) / sd)
        print(
            f"{d} {kgs[i]:5.1f} | {level:5.1f} ± {math.sqrt(var_level):.2f} | {pace * 7:+.2f} ± {sd:.2f} "
            f"| {pace * 7700:+5.0f} ± {sd * 1100:3.0f} | {p_loss:.2f}    {p_plan:.2f}    | {z:+.1f}σ | {light[i][0]}"
        )


def cmd_smoothers(days, kgs):
    n = len(days)

    def window(i, length=7):
        return [j for j in range(i + 1) if (days[i] - days[j]).days < length]

    def wma(i):
        js = window(i)
        w = [7 - (days[i] - days[j]).days for j in js]
        return sum(a * kgs[j] for a, j in zip(w, js)) / sum(w)

    ema, e = [], kgs[0]
    for i in range(n):
        if i:
            e += (1 - 0.9 ** (days[i] - days[i - 1]).days) * (kgs[i] - e)
        ema.append(e)

    holt, level, slope = [], kgs[0], 0.0
    for i in range(n):
        if i and (t := (days[i] - days[i - 1]).days):
            predicted = level + t * slope
            new = predicted + (1 - 0.85**t) * (kgs[i] - predicted)
            slope += 0.03 * ((new - level) / t - slope)
            level = new
        holt.append(level)

    def hampel(i):
        xs = [kgs[j] for j in window(i, 8)]
        m = st.median(xs)
        mad = st.median(abs(x - m) for x in xs) * 1.4826
        return m if len(xs) >= 4 and abs(kgs[i] - m) > 3 * max(mad, 0.2) else kgs[i]

    smoothers = {
        "Gleitender Mittelwert": [st.mean(kgs[j] for j in window(i)) for i in range(n)],
        "Gewichteter Mittelwert": [wma(i) for i in range(n)],
        "Exponentielle Glättung": ema,
        "Holt": holt,
        "Gleitender Median": [st.median(kgs[j] for j in window(i)) for i in range(n)],
        "Hampel-Filter": [hampel(i) for i in range(n)],
        "Kalman-Filter": [o[0] for o in kalman(days, kgs)[0]],
    }
    retro = [None if (lr := local_regression(days, kgs, i)) is None else lr[0] for i in range(n)]
    pos = {d: i for i, d in enumerate(days)}
    year = [i for i in range(n) if days[i].year == days[-1].year]
    judged = [i for i in year if retro[i] is not None]
    print("smoother                 | lag days | deviation kg | restlessness kg/day")
    for name, s in smoothers.items():
        best = None
        for lag in range(16):
            errs = [
                (s[i] - retro[pos[d]]) ** 2
                for i in judged
                if (d := days[i] - dt.timedelta(lag)) in pos and retro[pos[d]] is not None
            ]
            rmse = math.sqrt(st.mean(errs))
            if best is None or rmse < best[1]:
                best = (lag, rmse)
        deviation = math.sqrt(st.mean((s[i] - retro[i]) ** 2 for i in judged))
        restless = st.mean(abs(s[i] - s[i - 1]) / max(1, (days[i] - days[i - 1]).days) for i in year[1:])
        print(f"{name:<24} | {best[0]:8d} | {deviation:12.2f} | {restless:.2f}")


def main(argv):
    if len(argv) < 3:
        sys.exit(__doc__)
    rows = load(argv[2])
    days, kgs = [d for d, _ in rows], [k for _, k in rows]
    if argv[1] == "fit":
        cmd_fit(days, kgs)
    elif argv[1] == "grid":
        cmd_grid(days, kgs)
    elif argv[1] == "days":
        cmd_days(days, kgs, dt.date.fromisoformat(argv[3]), dt.date.fromisoformat(argv[4]))
    elif argv[1] == "smoothers":
        cmd_smoothers(days, kgs)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv)
