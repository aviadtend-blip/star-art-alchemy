/**
 * Persistent birth data context bar for Steps 2–4.
 * Light gray centered section above footer.
 */

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function BirthDataBar({ formData, onEdit }) {
  if (!formData) return null;

  const { name, month, day, year, hour, minute, city } = formData;

  const h = Number(hour);
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const period = h >= 12 ? 'PM' : 'AM';
  const timeStr = `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
  const monthName = MONTHS[(Number(month) - 1)] || month;
  const dateStr = `${monthName} ${day}, ${year}`;

  return (
    <div className="w-full" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-5xl mx-auto py-12 px-6 text-center">
        <p className="text-body font-body text-surface-foreground mb-2">
          Creating artwork for: {name || 'You'}
        </p>
        <p className="text-body font-body text-surface-foreground font-semibold mb-2">
          Born: {dateStr} at {timeStr}
        </p>
        {city && (
          <p className="text-body font-body text-surface-foreground mb-6">
            in {city}
          </p>
        )}

        {onEdit && (
          <button
            onClick={onEdit}
            className="link-a5 font-body text-surface-foreground"
          >
            Edit Birth Data
          </button>
        )}
      </div>
    </div>
  );
}
