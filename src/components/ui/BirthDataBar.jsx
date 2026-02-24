/**
 * Persistent birth data context bar for Steps 2–4.
 * Shows user's birth info and an "Edit Birth Data" link.
 *
 * @param {{ formData: object, onEdit: () => void }} props
 */
export default function BirthDataBar({ formData, onEdit }) {
  if (!formData) return null;

  const { name, month, day, year, hour, minute, city } = formData;

  // Format time display
  const h = Number(hour);
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const period = h >= 12 ? 'PM' : 'AM';
  const timeStr = `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;

  const dateStr = `${month}/${day}/${year}`;

  return (
    <div className="w-full bg-secondary/40 border-b border-border py-3 px-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground font-body">
          Creating artwork for:{' '}
          <span className="text-foreground font-medium">{name || 'You'}</span>
          {' · '}Born: <span className="text-foreground">{dateStr}</span>
          {' at '}<span className="text-foreground">{timeStr}</span>
          {city && <>{' in '}<span className="text-foreground">{city}</span></>}
        </p>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-xs text-primary hover:text-primary/80 transition-colors font-body tracking-wide underline underline-offset-2"
          >
            Edit Birth Data
          </button>
        )}
      </div>
    </div>
  );
}
