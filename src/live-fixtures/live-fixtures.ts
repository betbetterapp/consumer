import FixtureModel from "../models/FixtureModel.js";
import { Fixture } from "../index.js";

export async function scheduleLivePulling() {
    console.log("== Scheduling live pulling ==")

    const fixtures = await getAllFixtureItems()
    const fixturesToday = fixtures.filter(fixture => {
        const date = new Date(fixture.fixture.timestamp * 1000)
        const today = new Date(1613826538000)

        return date.isSameDay(today)
    })

    console.log(fixturesToday.map(fixture => `${fixture.teams.home.name} vs ${fixture.teams.away.name}`).join("\n"))
}

function getAllFixtureItems(): Promise<Fixture[]> {
    return FixtureModel.find()
        .catch(err => {
            console.error("An error occurred while loading all fixture items from the database")
            console.error(err);
            return []
        })
}