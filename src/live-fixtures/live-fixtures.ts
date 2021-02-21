import FixtureModel from "../models/FixtureModel.js"
import { Fixture, FixtureLeague, FOOTBALL_API_KEY, FOOTBALL_API_BASE_URL } from "../index.js"
import schedule from "node-schedule"
import axios from "axios"
import { log } from "../utils/log.js"
import c from "chalk"
import * as db from "../database.js"
import { LiveFixture } from "../models/LiveFixtureModel.js"

export async function scheduleLivePulling() {
    const fixtures = await getAllFixtureItems()
    const fixturesToday = fixtures.filter(fixture => {
        const date = new Date(fixture.fixture.timestamp * 1000)
        const today = new Date()

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

async function scheduleJob(league: FixtureLeague, startTime: number) {
    const action = async () => {
        log.info(`Starting live pulling for ${stringifyLeague(league)}...`)

        if (await pullLiveFixtures(league, startTime)) {
            const id = setInterval(async () => {
                if (!(await pullLiveFixtures(league, startTime))) {
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

async function pullLiveFixtures(league: FixtureLeague, startTime: number): Promise<boolean> {
    log.header("Pulling live fixture")
    try {
        const url = `${FOOTBALL_API_BASE_URL}/fixtures?live=all&league=${league.id}`
        const { data } = await axios.get(url, { headers: { "X-RapidAPI-Key": FOOTBALL_API_KEY } })
        const response: LiveFixture[] = data.response
        if (data.errors.length > 0 || (response.length === 0 && Date.now() > startTime * 1000 + 600_000)) return false
        for (const item of response) {
            await db
                .insertLiveFixture(item)
                .then(() => log.info(`Inserted live fixture ${item.fixture.id} into database`))
                .catch(err => log.err(err))
        }
        return true
    } catch (e) {
        return false
    }
}

function stringify(fixture: Fixture): string {
    const date = new Date(fixture.fixture.timestamp * 1000)

    return (
        c.yellow("Match") +
        c.gray("(") +
        c.magenta(fixture.teams.home.name) +
        c.white(" vs ") +
        c.magenta(fixture.teams.away.name) +
        c.gray(" @ ") +
        c.white(date.formatClock()) +
        c.white(" in ") +
        c.white(fixture.league.name) +
        c.gray(")")
    )
}

function stringifyLeague(league: any): string {
    return c.yellow("League") + c.gray("(") + c.magenta(league.name) + c.gray(" #") + c.white(league.id) + c.gray(")")
}

function getAllFixtureItems(): Promise<Fixture[]> {
    return FixtureModel.find().catch(err => {
        console.error("An error occurred while loading all fixture items from the database")
        console.error(err)
        return []
    })
}
