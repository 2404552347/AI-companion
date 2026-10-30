export const DEFAULT_TIME_ZONE = 'Asia/Hong_Kong'

export function getDateStringInTimeZone(
  date: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE
): string {
  const format = (zone: string) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date)
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))

    return `${values.year}-${values.month}-${values.day}`
  }

  try {
    return format(timeZone)
  } catch (error) {
    if (!(error instanceof RangeError)) throw error
    return format(DEFAULT_TIME_ZONE)
  }
}
