import { ChevronUp } from 'lucide-react';

/**
 * Reusable FAQ accordion section.
 * @param {{ items: { q: string, a: string }[], title?: string }} props
 */
export default function FAQSection({ items, title = 'Frequently asked questions' }) {
  return (
    <section className="bg-surface pt-[120px] pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-a2 text-center text-surface-foreground mb-[30px]">{title}</h2>
        <div className="divide-y divide-surface-border">
          {items.map((faq) => (
            <details
              key={faq.q}
              className="group cursor-pointer rounded-[2px] [&_p]:grid [&_p]:grid-rows-[1fr] [&_p]:transition-[grid-template-rows,opacity] [&_p]:duration-300 [&:not([open])_p]:grid-rows-[0fr] [&:not([open])_p]:opacity-0"
            >
              <summary className="text-a5 text-surface-foreground uppercase tracking-wide list-none flex items-center justify-between py-6">
                <span>{faq.q}</span>
                <ChevronUp className="w-5 h-5 text-surface-muted transition-transform duration-300 group-open:rotate-0 rotate-180" />
              </summary>
              <p className="text-body text-surface-muted pb-6 -mt-2 overflow-hidden">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
