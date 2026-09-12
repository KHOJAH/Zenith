import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCurrentInterval,
  stepDateInterval,
  isCurrentPeriod,
  canStepNext,
  formatSalaryCycleLabel,
  formatDateRangeLabel,
} from '../src/utils/dateInterval.ts';
import { getSalaryCycleDates } from '../src/utils/salary.ts';

describe('Date Interval Suite', () => {
  test('getCurrentInterval creates expected presets', () => {
    const salary27 = getCurrentInterval('salary_cycle', 27);
    assert.equal(salary27.id, 'salary_cycle');
    assert.ok(salary27.startDate);
    assert.ok(salary27.endDate);
    assert.ok(salary27.label);

    const curMonth = getCurrentInterval('current_month');
    assert.equal(curMonth.id, 'current_month');
    const curMonthStart = new Date(curMonth.startDate);
    assert.equal(curMonthStart.getDate(), 1);

    const last30 = getCurrentInterval('last_30_days');
    assert.equal(last30.id, 'last_30_days');
    assert.equal(last30.label, 'Last 30 Days');
    const l30Start = new Date(last30.startDate);
    const l30End = new Date(last30.endDate);
    const l30Days = Math.round((l30End.getTime() - l30Start.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(l30Days, 30, 'Last 30 days must span 30 full days');

    const last7 = getCurrentInterval('last_7_days');
    assert.equal(last7.id, 'last_7_days');
    assert.equal(last7.label, 'Last 7 Days');
    const l7Start = new Date(last7.startDate);
    const l7End = new Date(last7.endDate);
    const l7Days = Math.round((l7End.getTime() - l7Start.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(l7Days, 7, 'Last 7 days must span 7 full days');
  });

  test('Salary Cycle - Stepping prev and next roundtrip', () => {
    const curr = getCurrentInterval('salary_cycle', 27);
    const prev = stepDateInterval(curr, 'prev', 27);
    assert.notEqual(prev.startDate, curr.startDate);

    const backToCurr = stepDateInterval(prev, 'next', 27);
    assert.equal(new Date(backToCurr.startDate).getDate(), new Date(curr.startDate).getDate());
    assert.equal(new Date(backToCurr.startDate).getMonth(), new Date(curr.startDate).getMonth());
    assert.equal(new Date(backToCurr.startDate).getFullYear(), new Date(curr.startDate).getFullYear());
    assert.equal(backToCurr.label, curr.label);
    assert.equal(isCurrentPeriod(backToCurr, 27), true);
  });

  test('Salary Cycle - Variable month lengths (Feb, 30d, 31d, payday 31)', () => {
    // Start at 31 Jan 2026
    const jan31 = {
      id: 'salary_cycle',
      label: '31 Jan – 28 Feb',
      startDate: new Date(2026, 0, 31, 0, 0, 0, 0).toISOString(),
      endDate: new Date(2026, 1, 28, 23, 59, 59, 999).toISOString(),
    };

    // Step to February cycle
    const febCycle = stepDateInterval(jan31, 'next', 31);
    const febStart = new Date(febCycle.startDate);
    const febEnd = new Date(febCycle.endDate);
    assert.equal(febStart.getMonth(), 1, 'Feb month index');
    assert.equal(febStart.getDate(), 28, 'Feb 2026 has 28 days');
    assert.equal(febEnd.getMonth(), 2, 'March month index');
    assert.equal(febEnd.getDate(), 30, 'Day before 31 March is 30');

    // Step to March cycle
    const marCycle = stepDateInterval(febCycle, 'next', 31);
    const marStart = new Date(marCycle.startDate);
    const marEnd = new Date(marCycle.endDate);
    assert.equal(marStart.getMonth(), 2, 'March month index');
    assert.equal(marStart.getDate(), 31, 'March has 31 days');
    assert.equal(marEnd.getMonth(), 3, 'April month index');
    assert.equal(marEnd.getDate(), 30, 'April has 30 days, so day 30');

    // Step back to Feb
    const backToFeb = stepDateInterval(marCycle, 'prev', 31);
    assert.equal(new Date(backToFeb.startDate).getMonth(), 1);
    assert.equal(new Date(backToFeb.startDate).getDate(), 28);
  });

  test('Salary Cycle - Year boundary (Dec to Jan)', () => {
    const decCycle = {
      id: 'salary_cycle',
      label: '27 Dec – 26 Jan',
      startDate: new Date(2025, 11, 27, 0, 0, 0, 0).toISOString(),
      endDate: new Date(2026, 0, 26, 23, 59, 59, 999).toISOString(),
    };

    const nextCycle = stepDateInterval(decCycle, 'next', 27);
    const nextStart = new Date(nextCycle.startDate);
    const nextEnd = new Date(nextCycle.endDate);
    assert.equal(nextStart.getFullYear(), 2026);
    assert.equal(nextStart.getMonth(), 0);
    assert.equal(nextStart.getDate(), 27);
    assert.equal(nextEnd.getFullYear(), 2026);
    assert.equal(nextEnd.getMonth(), 1);
    assert.equal(nextEnd.getDate(), 26);

    const prevCycle = stepDateInterval(decCycle, 'prev', 27);
    const prevStart = new Date(prevCycle.startDate);
    const prevEnd = new Date(prevCycle.endDate);
    assert.equal(prevStart.getFullYear(), 2025);
    assert.equal(prevStart.getMonth(), 10); // Nov
    assert.equal(prevStart.getDate(), 27);
    assert.equal(prevEnd.getFullYear(), 2025);
    assert.equal(prevEnd.getMonth(), 11); // Dec
    assert.equal(prevEnd.getDate(), 26);
  });

  test('Calendar Month - Stepping and roundtrip', () => {
    const cur = getCurrentInterval('current_month');
    const prev = stepDateInterval(cur, 'prev');
    assert.equal(isCurrentPeriod(prev), false);

    const back = stepDateInterval(prev, 'next');
    assert.equal(back.label, cur.label);
    assert.equal(isCurrentPeriod(back), true);
  });

  test('Last 30 Days - Stepping and roundtrip returns to current', () => {
    const cur = getCurrentInterval('last_30_days');
    assert.equal(isCurrentPeriod(cur), true);
    assert.equal(cur.label, 'Last 30 Days');

    const prev = stepDateInterval(cur, 'prev');
    assert.equal(isCurrentPeriod(prev), false);
    assert.notEqual(prev.label, 'Last 30 Days');

    const back = stepDateInterval(prev, 'next');
    assert.equal(isCurrentPeriod(back), true, 'Must be recognized as current period after roundtrip');
    assert.equal(back.label, 'Last 30 Days', 'Label must revert to Last 30 Days');
  });

  test('Last 7 Days - Stepping and roundtrip returns to current', () => {
    const cur = getCurrentInterval('last_7_days');
    assert.equal(isCurrentPeriod(cur), true);
    assert.equal(cur.label, 'Last 7 Days');

    const prev = stepDateInterval(cur, 'prev');
    assert.equal(isCurrentPeriod(prev), false);
    assert.notEqual(prev.label, 'Last 7 Days');

    const back = stepDateInterval(prev, 'next');
    assert.equal(isCurrentPeriod(back), true, 'Must be recognized as current period after roundtrip');
    assert.equal(back.label, 'Last 7 Days', 'Label must revert to Last 7 Days');
  });

  test('Boundary: canStepNext allows +1 future cycle and blocks beyond +1', () => {
    const curSalary = getCurrentInterval('salary_cycle', 27);
    assert.equal(canStepNext(curSalary, 27), true, 'Current salary cycle can step next to +1');

    const next1Salary = stepDateInterval(curSalary, 'next', 27);
    assert.equal(canStepNext(next1Salary, 27), false, '+1 salary cycle CANNOT step next');

    const prevSalary = stepDateInterval(curSalary, 'prev', 27);
    assert.equal(canStepNext(prevSalary, 27), true, 'Past salary cycle can step next');

    const curMonth = getCurrentInterval('current_month');
    assert.equal(canStepNext(curMonth), true, 'Current month can step next to +1');
    const next1Month = stepDateInterval(curMonth, 'next');
    assert.equal(canStepNext(next1Month), false, '+1 month CANNOT step next');

    const cur30 = getCurrentInterval('last_30_days');
    assert.equal(canStepNext(cur30), true, 'Current 30 days can step next to +1');
    const next1_30 = stepDateInterval(cur30, 'next');
    assert.equal(canStepNext(next1_30), false, '+1 30 days CANNOT step next');
  });

  test('Label formatting handles year boundary correctly', () => {
    const crossYear = formatSalaryCycleLabel(
      new Date(2025, 11, 27),
      new Date(2026, 0, 26)
    );
    assert.equal(crossYear, '27 Dec 2025 – 26 Jan 2026');

    const pastYear = formatSalaryCycleLabel(
      new Date(2024, 5, 27),
      new Date(2024, 6, 26)
    );
    assert.equal(pastYear, '27 Jun – 26 Jul 2024');
  });

  test('All paydays 1 through 31 step forward and backward cleanly', () => {
    for (let day = 1; day <= 31; day++) {
      const cur = getCurrentInterval('salary_cycle', day);
      assert.equal(isCurrentPeriod(cur, day), true);

      // Step back 3 months
      const prev1 = stepDateInterval(cur, 'prev', day);
      const prev2 = stepDateInterval(prev1, 'prev', day);
      const prev3 = stepDateInterval(prev2, 'prev', day);
      assert.equal(isCurrentPeriod(prev3, day), false);

      // Step forward 3 months
      const back2 = stepDateInterval(prev3, 'next', day);
      const back1 = stepDateInterval(back2, 'next', day);
      const back0 = stepDateInterval(back1, 'next', day);
      assert.equal(isCurrentPeriod(back0, day), true, `Day ${day} must return to current period`);
      assert.equal(back0.label, cur.label);
    }
  });

  test('Leap year February 29 payday handling', () => {
    // 2024 was a leap year
    const feb2024Start = new Date(2024, 1, 29, 0, 0, 0, 0);
    const feb2024End = new Date(2024, 2, 28, 23, 59, 59, 999);
    const feb2024 = {
      id: 'salary_cycle',
      label: '29 Feb 2024 – 28 Mar 2024',
      startDate: feb2024Start.toISOString(),
      endDate: feb2024End.toISOString(),
    };

    const mar2024 = stepDateInterval(feb2024, 'next', 29);
    const marStart = new Date(mar2024.startDate);
    assert.equal(marStart.getMonth(), 2);
    assert.equal(marStart.getDate(), 29);

    const backToFeb = stepDateInterval(mar2024, 'prev', 29);
    const backStart = new Date(backToFeb.startDate);
    assert.equal(backStart.getMonth(), 1);
    assert.equal(backStart.getDate(), 29, '2024 Feb has 29 days');
  });

  test('Custom interval stepping and boundary', () => {
    const custom = {
      id: 'custom',
      label: '1 Sep – 10 Sep',
      startDate: new Date(2026, 8, 1, 0, 0, 0, 0).toISOString(),
      endDate: new Date(2026, 8, 10, 23, 59, 59, 999).toISOString(),
    };
    const prevCustom = stepDateInterval(custom, 'prev');
    assert.ok(new Date(prevCustom.startDate).getTime() < new Date(custom.startDate).getTime());
    const nextCustom = stepDateInterval(custom, 'next');
    assert.ok(new Date(nextCustom.startDate).getTime() > new Date(custom.startDate).getTime());
    assert.equal(typeof canStepNext(custom), 'boolean');
  });
});
