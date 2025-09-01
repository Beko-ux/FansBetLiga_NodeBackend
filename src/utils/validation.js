// Transforme les erreurs Zod en format "Laravel-like"
export function zodToLaravelErrors(zerr) {
  const errors = {};
  for (const issue of zerr.issues) {
    const key = issue.path?.[0] ?? 'error';
    if (!errors[key]) errors[key] = [];
    errors[key].push(issue.message);
  }
  return { errors };
}
