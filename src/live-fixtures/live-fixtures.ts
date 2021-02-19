import FixtureModel from "../models/FixtureModel.js"
import { Fixture, FOOTBALL_API_KEY, FOOTBALL_API_BASE_URL } from "../index.js"
import schedule from "node-schedule"
import axios from "axios"
import { log } from "../utils/log.js"
import chalk from "chalk"

export async function scheduleLivePulling() {
    const fixtures = await getAllFixtureItems()
    const fixturesToday = fixtures.filter(fixture => {
        const date = new Date(fixture.fixture.timestamp * 1000)
        const today = new Date() // remove this after testing

        return date.isSameDay(today)
    })

    log.header("Matches today")
    fixturesToday.map(fixture => stringify(fixture)).forEach(match => log.info(match))

    log.header("Scheduling live pulling jobs")
    const alreadyScheduled: string[] = []
    for (const fixture of fixturesToday) {
        const identifier = `${fixture.league.id}@${fixture.fixture.timestamp}`
        if (alreadyScheduled.includes(identifier)) {
            log.info(`Already got job including ${stringify(fixture)}`)
        } else {
            await scheduleJob(fixture.league, fixture.fixture.timestamp)
            log.info(`Scheduled new job for ${stringify(fixture)}`)
            alreadyScheduled.push(identifier)
        }
    }
}

async function scheduleJob(league: any, startTime: number) {
    const action = async () => {
        log.info(`Starting live pulling for ${stringifyLeague(league)}...`)

        if (await pullLiveFixtures(league)) {
            const id = setInterval(async () => {
                if (!(await pullLiveFixtures(league))) {
                    clearInterval(id)
                    log.info(`Finished live pulling for ${stringifyLeague(league)}`)
                }
            }, 450_000)
        } else {
            log.err(`First live pull for ${stringifyLeague(league)} failed, abandoning...`)
        }
    }

    const date = new Date(startTime * 1000 + 60_000)
    const job = schedule.scheduleJob(date, action)

    if (job == null) {
        log.warn("Match has already started, instantly invoking job")
        await action()
    }
}

async function pullLiveFixtures(league: any): Promise<boolean> {
    try {
        const url = `${FOOTBALL_API_BASE_URL}/fixtures?live=all&league=${league.id}`
        const {
            data: { response },
        } = await axios.get(url, { headers: { "X-RapidAPI-Key": FOOTBALL_API_KEY } })
        log.info("Response =", response)
        return true
    } catch (e) {
        return false
    }
}

function stringify(fixture: any): string {
    const date = new Date(fixture.fixture.timestamp * 1000)

    return chalk.yellow("Match") + chalk.gray("(") + chalk.magenta(fixture.teams.home.name) +
        chalk.white(" vs ") + chalk.magenta(fixture.teams.away.name) +
        chalk.gray(" @ ") + chalk.white(date.formatClock()) +
        chalk.white(" in ") + chalk.white(fixture.league.name) + chalk.gray(")")
}

function stringifyLeague(league: any): string {
    return chalk.yellow("League") + chalk.gray("(") + chalk.magenta(league.name) +
        chalk.gray(" #") + chalk.white(league.id) + chalk.gray(")")
}

function getAllFixtureItems(): Promise<Fixture[]> {
    return FixtureModel.find().catch(err => {
        console.error("An error occurred while loading all fixture items from the database")
        console.error(err)
        return []
    })
}
