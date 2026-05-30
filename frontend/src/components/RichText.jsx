import Highlight from './Highlight';

export default function RichText({ segments }) {
  return (
    <>
      {segments.map((segment, index) => {
        if (typeof segment === 'string') {
          return <span key={index}>{segment}</span>;
        }
        if (segment.highlight) {
          return <Highlight key={index}>{segment.highlight}</Highlight>;
        }
        return null;
      })}
    </>
  );
}
