import mongoose from "mongoose";

const FixtureSchema = new mongoose.Schema({
    leagueId: {
        type: Number,
        required: true,
    },
    items: {
        type: [Object],
        default: [],
        required: true,
    },
});

interface Fixture extends mongoose.Document {
    leagueId: number;
    items: [object];
}

export default mongoose.model<Fixture>("Fixture", FixtureSchema, "fixtures");
