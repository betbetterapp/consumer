import mongoose from "mongoose";
import { Fixture } from "..";
import { Model } from "./model.js";
const { Schema } = mongoose;

const FixtureSchema = new Schema({
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

export default mongoose.model<Model<Fixture>>("Fixture", FixtureSchema, "fixtures");
