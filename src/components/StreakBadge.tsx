interface StreakBadgeProps {
  streak: number;
  playerName: string;
}

export function StreakBadge({ streak, playerName }: StreakBadgeProps) {
  if (streak < 2) return null;

  const intensity = streak >= 10 ? 'streak-fire' : streak >= 5 ? 'streak-hot' : '';

  const fireEmojis =
    streak >= 10 ? '🔥🔥🔥' : streak >= 5 ? '🔥🔥' : streak >= 3 ? '🔥' : '⚡';

  return (
    <div className={`streak-badge ${intensity}`}>
      <span>{fireEmojis}</span>
      <span className="streak-count">{streak}</span>
      <span className="streak-label">{playerName}'s streak</span>
    </div>
  );
}
