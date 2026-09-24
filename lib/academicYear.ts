export function getAcademicYear(): string {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  
  // If it's before June (month index 5), it's part of the previous academic year
  if (currentMonth < 5) {
    return `${currentYear - 1}-${currentYear.toString().slice(2)}`;
  }
  return `${currentYear}-${(currentYear + 1).toString().slice(2)}`;
}
