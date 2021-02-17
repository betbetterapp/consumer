export {}

declare global {
    interface Date {
        addDays(days: number): Date;

        parse(): String;

        isSameDay(other: Date): boolean;
    }
}

Date.prototype.addDays = function(days: number): Date {
    const date = new Date(this.valueOf())
    date.setDate(date.getDate() + days)
    return date
}

Date.prototype.parse = function(): String {
    const date = new Date(this)
    const ye = new Intl.DateTimeFormat("en", { year: "numeric" }).format(date)
    const mo = new Intl.DateTimeFormat("en", { month: "2-digit" }).format(date)
    const da = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date)
    return `${ye}-${mo}-${da}`
}

Date.prototype.isSameDay = function(b: Date): boolean {
    return this.getDate() === b.getDate() && this.getMonth() == b.getMonth() && this.getFullYear() == b.getFullYear()
}