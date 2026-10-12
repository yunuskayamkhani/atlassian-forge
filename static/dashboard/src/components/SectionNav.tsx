const SECTIONS = [
  { href: '#pull-requests', label: 'Pull Requests' },
  { href: '#commit-activity', label: 'Commit Activity' },
  { href: '#pipeline-health', label: 'Pipeline Health' },
  { href: '#deployments', label: 'Deployments' },
  { href: '#developer-activity', label: 'Developer Activity' }
];

export function SectionNav() {
  return (
    <nav className="section-nav" aria-label="Dashboard sections">
      {SECTIONS.map((section) => (
        <a key={section.href} href={section.href}>
          {section.label}
        </a>
      ))}
    </nav>
  );
}
