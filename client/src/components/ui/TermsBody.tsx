import { TERMS_FOOTER, TERMS_INTRO, TERMS_SECTIONS, TERMS_UPDATED } from '../../config/terms';
import { CONFIG } from '../../config/tournament';

/** The terms document itself, rendered from config/terms.ts. */
export function TermsBody() {
  return (
    <div className="terms">
      <p className="terms-meta">
        Last updated {TERMS_UPDATED} · Organiser: {CONFIG.organiser} · {CONFIG.contact.email}
      </p>

      {TERMS_INTRO.map((text) => (
        <p key={text} className="terms-intro">
          {text}
        </p>
      ))}

      {TERMS_SECTIONS.map((section) => (
        <section key={section.n} className="terms-section">
          <h3>
            <span className="terms-n">{section.n}.</span> {section.title}
          </h3>

          {section.blocks.map((block, i) => {
            if (block.kind === 'p') return <p key={i}>{block.text}</p>;

            if (block.kind === 'list')
              return (
                <ul key={i}>
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              );

            return (
              <table key={i} className="terms-table">
                <thead>
                  <tr>
                    <th scope="col">{block.head[0]}</th>
                    <th scope="col">{block.head[1]}</th>
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map(([left, right]) => (
                    <tr key={left}>
                      <th scope="row">{left}</th>
                      <td>{right}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })}
        </section>
      ))}

      <p className="terms-foot">{TERMS_FOOTER}</p>
    </div>
  );
}
