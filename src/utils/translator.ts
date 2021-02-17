import TranslationModel, { TranslationDocument } from "../models/TranslationModel.js"

let document: TranslationDocument | null = null

export async function translateTeamName(input: string): Promise<string> {
    if (document == null) {
        document = (await TranslationModel.findOne())!.toObject()
    }

    if (document![input] != null) {
        console.log(`[Translator] Translated ${input} to ${document![input]}`)
        return document![input]
    } else {
        return input
    }
}