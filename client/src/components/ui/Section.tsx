import type { ReactNode } from 'react';

type Props = {
  id: string;
  title: string;
  /** Short line under the title — one sentence, no marketing. */
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Section({ id, title, intro, children, className = '' }: Props) {
  return (
    <section id={id} className={`section bay ${className}`} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-[clamp(2rem,6vw,4.25rem)] leading-[0.86]">
        {title}
      </h2>

      {intro && <p className="mt-5 max-w-prose text-dust/80">{intro}</p>}

      <div className="mt-[clamp(28px,5vw,56px)]">{children}</div>
    </section>
  );
}
