interface StartEndDates {
    firstDayDate: Date
    lastDayDate: Date
}

// returns first and last date of the week
export default function getStartLastDateOfTheWeek(from: Date): StartEndDates {
    const dayOfWeek = from.getUTCDay()
    const diffToSunday = from.getUTCDate() - dayOfWeek

    const firstDay = new Date(from)
    firstDay.setUTCDate(diffToSunday)
    firstDay.setUTCHours(0, 0, 0, 0)

    const lastDay = new Date(from)
    lastDay.setUTCDate(diffToSunday + 6)
    lastDay.setUTCHours(23, 59, 59, 999)

    return { firstDayDate: firstDay, lastDayDate: lastDay }
}
