/**
 * Persistent birth data context bar for Steps 2–4.
 * Dark bar spanning full width at the bottom of the page.
 */
export default function BirthDataBar({ formData, onEdit }) {
  if (!formData) return null;

  const { name, month, day, year, hour, minute, city } = formData;

  const h = Number(hour);
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const period = h >= 12 ? 'PM' : 'AM';
  const timeStr = `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
  const dateStr = `${month}/${day}/${year}`;

  return (
    <div className="w-full bg-background border-t border-border py-3 px-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <p className="text-body-sm text-muted-foreground">
          Creating artwork for:{' '}
          <span className="text-foreground">{name || 'You'}</span>
          {' · '}Born: <span className="text-foreground">{dateStr}</span>
          {' at '}<span className="text-foreground">{timeStr}</span>
          {city && <>{' in '}<span className="text-foreground">{city}</span></>}
        </p>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-subtitle text-primary hover:text-primary/80 transition-colors tracking-wide"
          >
            Edit Birth Data
          </button>
        )}
      </div>
    </div>
  );
}
