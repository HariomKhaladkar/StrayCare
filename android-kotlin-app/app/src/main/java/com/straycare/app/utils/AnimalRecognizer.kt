package com.straycare.app.utils

import android.graphics.Bitmap
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.label.ImageLabeling
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions

data class AnimalDetectionResult(
    val label: String,
    val confidence: Int,
    val emoji: String
)

/**
 * AnimalRecognizer uses ML Kit Image Labeling.
 *
 * Strategy:
 *  1. Run ML Kit with a LOW confidence threshold so we get many labels.
 *  2. For each returned label, score it against each animal category using
 *     a weighted keyword map (exact match > prefix > substring).
 *  3. Sum scores per category across ALL labels — this "voting" approach
 *     is far more reliable than picking the single top label.
 *  4. Reject if high-confidence human labels appear with NO animal labels.
 */
object AnimalRecognizer {

    private val labeler = ImageLabeling.getClient(
        ImageLabelerOptions.Builder().setConfidenceThreshold(0.30f).build()
    )

    // ─── Each entry: Pair(keyword, weight)
    // Higher weight = stronger signal for that category.
    // "exact" labels (like "Dog") get weight 3.0; generic get 1.0.
    private data class Kw(val word: String, val weight: Float = 1.0f)

    private val CATS = listOf(
        // Animal categories
        Pair("Dog",     listOf(Kw("dog", 3f), Kw("puppy", 3f), Kw("canine", 2f),
                               Kw("hound", 2f), Kw("retriever", 2f), Kw("shepherd", 2f),
                               Kw("bulldog", 2f), Kw("labrador", 2f), Kw("poodle", 2f),
                               Kw("beagle", 2f), Kw("boxer", 2f), Kw("husky", 2f),
                               Kw("terrier", 1.5f), Kw("sporting group", 1.5f),
                               Kw("herding group", 1.5f), Kw("working dog", 1.5f),
                               Kw("companion dog", 2f), Kw("dog breed", 2f),
                               Kw("dachshund", 2f), Kw("spitz", 2f), Kw("rottweiler", 2f))),

        Pair("Cat",     listOf(Kw("cat", 3f), Kw("kitten", 3f), Kw("feline", 2f),
                               Kw("tabby", 2f), Kw("persian", 2f), Kw("siamese", 2f),
                               Kw("felidae", 2f), Kw("felinae", 2f), Kw("maine coon", 2f),
                               Kw("small to medium-sized cat", 2f),
                               Kw("domestic short-haired cat", 2f),
                               Kw("domestic long-haired cat", 2f),
                               Kw("cat breed", 2f), Kw("wildcat", 1.5f))),

        Pair("Bird",    listOf(Kw("bird", 3f), Kw("pigeon", 2f), Kw("parrot", 2f),
                               Kw("owl", 2f), Kw("eagle", 2f), Kw("crow", 2f),
                               Kw("sparrow", 2f), Kw("fowl", 1.5f), Kw("poultry", 1.5f),
                               Kw("parakeet", 2f), Kw("beak", 1.5f), Kw("feather", 1f),
                               Kw("hawk", 2f), Kw("falcon", 2f), Kw("robin", 2f),
                               Kw("songbird", 2f), Kw("waterfowl", 2f),
                               Kw("perching bird", 2f), Kw("passerine", 2f))),

        Pair("Cow",     listOf(Kw("cow", 3f), Kw("cattle", 2f), Kw("bovine", 2f),
                               Kw("bull", 2f), Kw("calf", 2f), Kw("dairy", 1.5f),
                               Kw("water buffalo", 2f))),

        Pair("Horse",   listOf(Kw("horse", 3f), Kw("pony", 2f), Kw("equine", 2f),
                               Kw("stallion", 2f), Kw("mare", 2f), Kw("donkey", 2f),
                               Kw("mule", 2f), Kw("foal", 2f))),

        Pair("Monkey",  listOf(Kw("monkey", 3f), Kw("primate", 2f), Kw("ape", 2f),
                               Kw("macaque", 2f), Kw("langur", 2f), Kw("baboon", 2f))),

        Pair("Snake",   listOf(Kw("snake", 3f), Kw("serpent", 2f), Kw("cobra", 2f),
                               Kw("python", 2f), Kw("viper", 2f))),

        Pair("Reptile", listOf(Kw("lizard", 3f), Kw("reptile", 2f), Kw("gecko", 2f),
                               Kw("iguana", 2f), Kw("chameleon", 2f),
                               Kw("tortoise", 2f), Kw("turtle", 2f))),

        Pair("Rabbit",  listOf(Kw("rabbit", 3f), Kw("hare", 2f), Kw("bunny", 2f))),

        Pair("Rodent",  listOf(Kw("rat", 3f), Kw("mouse", 3f), Kw("squirrel", 2f),
                               Kw("hamster", 2f), Kw("rodent", 2f), Kw("chipmunk", 2f))),

        Pair("Pig",     listOf(Kw("pig", 3f), Kw("swine", 2f), Kw("boar", 2f),
                               Kw("piglet", 2f))),

        Pair("Goat",    listOf(Kw("goat", 3f), Kw("sheep", 3f), Kw("lamb", 2f),
                               Kw("ram", 2f), Kw("ewe", 2f))),
    )

    private val EMOJI = mapOf(
        "Dog" to "🐕", "Cat" to "🐈", "Bird" to "🐦", "Cow" to "🐄",
        "Horse" to "🐎", "Monkey" to "🐒", "Snake" to "🐍", "Reptile" to "🦎",
        "Rabbit" to "🐇", "Rodent" to "🐀", "Pig" to "🐷", "Goat" to "🐐"
    )

    // Human signals — if these appear with high confidence and no animals, reject.
    private val HUMAN_WORDS = listOf(
        "person", "human", "man", "woman", "boy", "girl", "child", "baby",
        "face", "selfie", "portrait", "crowd", "people", "audience",
        "forehead", "nose", "mouth", "shoulder", "hand", "hair", "beard"
    )

    private fun scoreLabel(labelText: String, keywords: List<Kw>): Float {
        val lower = labelText.lowercase()
        return keywords.filter { lower.contains(it.word) }.sumOf { it.weight.toDouble() }.toFloat()
    }

    fun analyze(bitmap: Bitmap, onResult: (AnimalDetectionResult?) -> Unit) {
        val image = InputImage.fromBitmap(bitmap, 0)
        labeler.process(image)
            .addOnSuccessListener { labels ->
                if (labels.isEmpty()) { onResult(null); return@addOnSuccessListener }

                // Reject: strong human signal AND no animal signal
                val humanScore = labels
                    .filter { lbl -> HUMAN_WORDS.any { lbl.text.lowercase().contains(it) } }
                    .sumOf { it.confidence.toDouble() }.toFloat()

                val hasAnimalHint = labels.any { lbl ->
                    val lower = lbl.text.lowercase()
                    CATS.any { (_, kws) -> kws.any { lower.contains(it.word) } }
                }

                if (humanScore > 0.75f && !hasAnimalHint) {
                    onResult(null)
                    return@addOnSuccessListener
                }

                // Score each category: sum (label_confidence × keyword_weight) across ALL labels
                val scores = CATS.map { (catName, kws) ->
                    val totalScore = labels.sumOf { lbl ->
                        (scoreLabel(lbl.text, kws) * lbl.confidence).toDouble()
                    }.toFloat()
                    catName to totalScore
                }

                val best = scores.filter { it.second > 0.25f }.maxByOrNull { it.second }

                if (best != null) {
                    // Confidence = capped at 98 so it never shows 100
                    val conf = ((best.second / labels.maxOf { it.confidence }) * 95).toInt().coerceIn(50, 98)
                    onResult(
                        AnimalDetectionResult(
                            label = best.first,
                            confidence = conf,
                            emoji = EMOJI[best.first] ?: "🐾"
                        )
                    )
                } else {
                    onResult(null)
                }
            }
            .addOnFailureListener { onResult(null) }
    }
}
