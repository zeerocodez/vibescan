export function generateBadge(score, grade) {
  let color = '#E63B2E'; // Red (F)
  if (grade.startsWith('A')) color = '#00FF00'; // Green
  else if (grade.startsWith('B') || grade.startsWith('C')) color = '#F5A623'; // Yellow

  return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="28" role="img" aria-label="VibeAudit: ${grade}">
  <title>VibeAudit: ${grade}</title>
  <g shape-rendering="crispEdges">
    <rect width="75" height="28" fill="#111111"/>
    <rect x="75" width="45" height="28" fill="${color}"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="120" font-weight="bold">
    <text x="375" y="190" transform="scale(.1)" textLength="550">VibeAudit</text>
    <text x="975" y="190" transform="scale(.1)" textLength="250">${grade}</text>
  </g>
</svg>`;
}
