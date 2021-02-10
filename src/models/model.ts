import mongoose from "mongoose";

export type Model<Type> = Type & mongoose.Document;
