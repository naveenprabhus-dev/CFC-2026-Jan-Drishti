/**
 * Localization helper functions for domain entities, statuses, categories, and severities
 */

export function getStatusLabel(status: string | undefined | null, t: (key: string, params?: any) => string): string {
  if (!status) return '';
  const normalizedKey = `status_${status.toUpperCase().replace(/[\s-]+/g, '_')}`;
  const translated = t(normalizedKey);
  if (translated && translated !== normalizedKey) {
    return translated;
  }
  return status.replace(/_/g, ' ');
}

export function getCategoryLabel(category: string | undefined | null, t: (key: string, params?: any) => string): string {
  if (!category) return '';
  const normalizedKey = `cat_${category.toUpperCase().replace(/[\s-]+/g, '_')}`;
  const translated = t(normalizedKey);
  if (translated && translated !== normalizedKey) {
    return translated;
  }
  return category.replace(/_/g, ' ');
}

export function getSeverityLabel(severity: string | undefined | null, t: (key: string, params?: any) => string): string {
  if (!severity) return '';
  const normalizedKey = `severity_${severity.toUpperCase()}`;
  const translated = t(normalizedKey);
  if (translated && translated !== normalizedKey) {
    return translated;
  }
  return severity;
}

export function getDepartmentLabel(dept: string | undefined | null, t: (key: string, params?: any) => string): string {
  if (!dept) return '';
  const d = dept.toLowerCase();
  if (d.includes('public works') || d.includes('pwd')) {
    return t('deptPWD') || dept;
  }
  if (d.includes('highways')) {
    return t('deptHighways') || dept;
  }
  if (d.includes('water') || d.includes('sewerage')) {
    return t('deptWaterSewerage') || dept;
  }
  if (d.includes('municipal') || d.includes('corporation')) {
    return t('deptMunicipal') || dept;
  }
  return dept;
}
