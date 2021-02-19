import FixtureModel from "../models/FixtureModel.js"
import { Fixture } from "../index.js"

export async function scheduleLivePulling() {
    console.log("== Scheduling live pulling ==")

    const fixtures = await getAllFixtureItems()
    const fixturesToday = fixtures.filter(fixture => {
        const date = new Date(fixture.fixture.timestamp * 1000)
        const today = new Date(1613826538000) // remove this after testing

        return date.isSameDay(today)
    })

    const groupedByLeague = groupItemBy(fixturesToday, "league.id")

    let groupedByLeagueAndDate: object = {}
    Object.keys(groupedByLeague).forEach(fixture => {
        console.log("One fixture:", fixture)
        groupedByLeagueAndDate[fixture] = groupedByLeague[fixture].sort((a, b) => {
            return a.fixture.timestamp - b.fixture.timestamp
        })
    })

    console.log(groupedByLeagueAndDate)

    console.log(fixturesToday.map(fixture => `${fixture.teams.home.name} vs ${fixture.teams.away.name}`).join("\n"))
}

function groupItemBy(array: any, property: any) {
    var hash = {},
        props = property.split(".")
    for (var i = 0; i < array.length; i++) {
        var key = props.reduce(function (acc: any, prop: any) {
            return acc && acc[prop]
        }, array[i])
        if (!hash[key]) hash[key] = []
        hash[key].push(array[i])
    }
    return hash
}

function getAllFixtureItems(): Promise<Fixture[]> {
    return FixtureModel.find().catch(err => {
        console.error("An error occurred while loading all fixture items from the database")
        console.error(err)
        return []
    })
}
