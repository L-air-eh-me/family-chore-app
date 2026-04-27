const STREAK_GOAL_DAYS = 7;

type EvaluateDayResult = {
  hasRequiredChores: boolean;
  completedRequiredChores: boolean;
};

type BuildSevenDayStreakOptions = {
  targetDate: string;
  evaluateDay: (date: string) => EvaluateDayResult;
  maxLookbackDays?: number;
};

function shiftDateString(dateString: string, deltaDays: number) {
  const date = new Date(`${dateString}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
}

export function buildSevenDayStreak({
  targetDate,
  evaluateDay,
  maxLookbackDays = 60
}: BuildSevenDayStreakOptions) {
  const today = evaluateDay(targetDate);

  let priorSuccessfulDays = 0;
  let cursor = shiftDateString(targetDate, -1);

  for (let offset = 0; offset < maxLookbackDays; offset += 1) {
    const result = evaluateDay(cursor);

    if (!result.hasRequiredChores) {
      cursor = shiftDateString(cursor, -1);
      continue;
    }

    if (!result.completedRequiredChores) {
      break;
    }

    priorSuccessfulDays += 1;
    cursor = shiftDateString(cursor, -1);
  }

  let streakDays = 0;

  if (today.hasRequiredChores && today.completedRequiredChores) {
    streakDays = (priorSuccessfulDays % STREAK_GOAL_DAYS) + 1;
  } else {
    streakDays = priorSuccessfulDays % STREAK_GOAL_DAYS;
  }

  return {
    streakDays,
    streakPercent: Math.round((streakDays / STREAK_GOAL_DAYS) * 100)
  };
}
