import type { Difficulty } from '../game/types';

interface DifficultySelectorProps {
  selected: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

const difficulties: { key: Difficulty; icon: string; label: string; desc: string }[] = [
  { key: 'easy', icon: '😊', label: 'Easy', desc: 'Random moves' },
  { key: 'medium', icon: '🧠', label: 'Medium', desc: 'Smart plays' },
  { key: 'impossible', icon: '💀', label: 'Impossible', desc: 'Unbeatable' },
];

export function DifficultySelector({ selected, onChange }: DifficultySelectorProps) {
  return (
    <div className="difficulty-cards">
      {difficulties.map((d) => (
        <div
          key={d.key}
          className={`diff-card diff-${d.key} ${selected === d.key ? 'selected' : ''}`}
          onClick={() => onChange(d.key)}
          role="button"
          tabIndex={0}
          aria-label={`${d.label} difficulty`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onChange(d.key);
            }
          }}
        >
          <span className="diff-icon">{d.icon}</span>
          <span className="diff-label">{d.label}</span>
          <span className="diff-desc">{d.desc}</span>
        </div>
      ))}
    </div>
  );
}
