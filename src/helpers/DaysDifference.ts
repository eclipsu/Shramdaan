export default function dateDiffInDays(a: Date, b: Date): number {
    const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
    const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
    return Math.floor((utcB - utcA) / (1000 * 60 * 60 * 24))
}
