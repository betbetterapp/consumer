import mongoose, { mongo } from "mongoose";
const { Schema } = mongoose;

const LeagueSchema = new Schema({
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },

    type: {
        type: String,
        required: true,
    },
    logo: {
        type: String,
        required: true,
    },
    country: {
        type: Object,
        required: true,
    },
    currentSeason: {
        type: Object,
        required: true,
    },
    lastUpdated: {
        type: Date,
        default: new Date(),
    },
});

interface League extends mongoose.Document {
    id: number;
    name: string;
    type: string;
    logo: string;
    country: object;
    currentSeason: object;
}

export default mongoose.model<League>("League", LeagueSchema, "leagues");
