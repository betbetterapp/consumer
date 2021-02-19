import chalk from "chalk"

export namespace log {
    export function header(message: string) {
        console.log()
        console.log(prefix() + "  " + chalk.green.bold.underline(message))
    }

    export function info(...message: any[]) {
        console.log(prefix() + chalk.bgBlue.black.bold("i") + chalk.white(), ...message)
    }

    export function err(...message: any[]) {
        console.log(prefix() + chalk.bgRed.black.bold("!") + chalk.red(), ...message)
    }

    export function warn(...message: any[]) {
        console.log(prefix() + chalk.bgYellow.black.bold("!") + chalk.yellow(), ...message)
    }

    function prefix(): string {
        return chalk.grey("[") + chalk.white(new Date().formatClock(true)) + chalk.grey("] ") + chalk.reset()
    }
}