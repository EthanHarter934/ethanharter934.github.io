import Reveal from './Reveal';

export default function SectionHeader({ label, title }) {
  return (
    <div className="section-head">
      <Reveal y={14}>
        <p className="section-eyebrow">{label}</p>
      </Reveal>
      <Reveal delay={0.08} y={20}>
        <h2 className="section-title">{title}</h2>
      </Reveal>
    </div>
  );
}
