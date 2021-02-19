import FixtureModel from "../models/FixtureModel.js"
import { Fixture, FOOTBALL_API_KEY, FOOTBALL_API_BASE_URL } from "../index.js"
import schedule from "node-schedule"
import axios from "axios"

export async function scheduleLivePulling() {
    console.log("=== Scheduling live pulling ===")

    const fixtures = await getAllFixtureItems()
    const fixturesToday = fixtures.filter(fixture => {
        const date = new Date(fixture.fixture.timestamp * 1000)
        const today = new Date() // remove this after testing

        return date.isSameDay(today)
    })

    console.log("== Matches today ===")
    console.log("> " + fixturesToday.map(fixture => stringify(fixture)).join("\n> "))

    console.log("== Scheduling jobs ===")
    const alreadyScheduled: string[] = []
    fixturesToday.forEach(fixture => {
        const identifier = `${fixture.league.id}@${fixture.fixture.timestamp}`
        if (alreadyScheduled.includes(identifier)) {
            console.log(`> Already got scheduled job for ${stringify(fixture)}`)
        } else {
            scheduleJob(fixture.league.id, fixture.fixture.timestamp)
            console.log(`> Scheduled new job for ${stringify(fixture)}`)
            alreadyScheduled.push(identifier)
        }
    })
}

function scheduleJob(leagueId: number, startTime: number) {
    const date = new Date(startTime * 1000 + 60_000)

    schedule.scheduleJob(date, async () => {
        console.log(`> Starting live pulling for league ${leagueId}...`)

        if (await pullLiveFixtures(leagueId)) {
            const id = setInterval(async () => {
                if (!(await pullLiveFixtures(leagueId))) {
                    clearInterval(id)
                    console.log(`> Finished live pulling for league ${leagueId}`)
                }
            }, 450_000)
        } else {
            console.log(`! First live pull for league ${leagueId} failed, abandoning...`)
        }
    })
}

async function pullLiveFixtures(leagueId: number): Promise<boolean> {
    try {
        const url = `${FOOTBALL_API_BASE_URL}/fixtures?live=all&league=${leagueId}`
        const {
            data: { response },
        } = await axios.get(url, { headers: { "X-RapidAPI-Key": FOOTBALL_API_KEY } })
        console.log("Response =", response)
        return true
    } catch (e) {
        return false
    }
}

function stringify(fixture: any): string {
    const date = new Date(fixture.fixture.timestamp * 1000)
    const hh = date.getHours().toPrecision(2)
    const mm = date.getMinutes().toPrecision(2)
    return `Match(\"${fixture.teams.home.name}\" vs \"${fixture.teams.away.name}\" @ ${hh}:${mm} in ${fixture.league.name})`
}

function getAllFixtureItems(): Promise<Fixture[]> {
    return FixtureModel.find().catch(err => {
        console.error("An error occurred while loading all fixture items from the database")
        console.error(err)
        return []
    })
}
