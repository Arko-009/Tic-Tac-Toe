import type { CellValue, Player } from '../game/types';

interface CellProps {
  value: CellValue;
  index: number;
  isWinning: boolean;
  isDisabled: boolean;
  currentPlayer: Player;
  onClick: (index: number) => void;
  onHover: () => void;
}

export function Cell({ value, index, isWinning, isDisabled, currentPlayer, onClick, onHover }: CellProps) {
  const filled = value !== null;

  const cellClass = [
    'cell',
    filled ? 'cell-filled' : '',
    isDisabled && !filled ? 'cell-disabled' : '',
    isWinning ? 'cell-winning' : '',
    value === 'X' ? 'cell-x' : value === 'O' ? 'cell-o' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cellClass}
      onClick={() => !filled && !isDisabled && onClick(index)}
      onMouseEnter={onHover}
      role="button"
      aria-label={`Cell ${index + 1}${value ? `, ${value}` : ', empty'}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!filled && !isDisabled) onClick(index);
        }
      }}
    >
      {value === 'X' && <XMark animate={!isWinning} />}
      {value === 'O' && <OMark animate={!isWinning} />}
      {!filled && !isDisabled && (
        <div className="cell-preview">
          {currentPlayer === 'X' ? <XMark animate={false} /> : <OMark animate={false} />}
        </div>
      )}
    </div>
  );
}

function XMark({ animate }: { animate: boolean }) {
  return (
    <svg className={`cell-mark cell-mark-x ${animate ? 'animate' : ''}`} viewBox="0 0 100 100">
      <line x1="20" y1="20" x2="80" y2="80" />
      <line x1="80" y1="20" x2="20" y2="80" />
    </svg>
  );
}

function OMark({ animate }: { animate: boolean }) {
  return (
    <svg className={`cell-mark cell-mark-o ${animate ? 'animate' : ''}`} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="30" />
    </svg>
  );
}
