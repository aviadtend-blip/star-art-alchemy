/**
 * Persistent birth data context bar for Steps 2–4.
 * Light gray section above footer with birth info and edit link.
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
    <div className="w-full border-t border-surface-border" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Blue left accent */}
      <div className="border-l-4 border-primary/40">
        <div className="max-w-5xl mx-auto py-8 md:py-6 px-6">
          {/* Desktop: single line */}
          <p className="hidden md:block text-body text-surface-foreground font-body mb-1.5">
            Creating artwork for: {name || 'You'}, Born: {dateStr} at {timeStr}{city ? ` in ${city}` : ''}
          </p>

          {/* Mobile: centered, multi-line */}
          <div className="md:hidden text-center space-y-1">
            <p className="text-body text-surface-foreground font-body">
              Creating artwork for: {name || 'You'}
            </p>
            <p className="text-body text-surface-foreground font-body font-semibold">
              Born: {dateStr} at {timeStr}
            </p>
            {city && (
              <p className="text-body text-surface-foreground font-body">
                in {city}
              </p>
            )}
          </div>

          {onEdit && (
            <button
              onClick={onEdit}
              className="text-body text-surface-foreground font-body underline hover:opacity-70 transition-opacity mt-3 md:mt-1.5 block md:inline"
              style={{ textUnderlineOffset: '3px' }}
            >
              Edit Birth Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
