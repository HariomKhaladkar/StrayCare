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
 * AnimalRecognizer — reliable animal-only detection.
 *
 * Two-phase approach:
 *  Phase 1 — HUMAN GATE: if ML Kit sees ANY human-related label
 *             above a very LOW confidence (0.40), hard-reject immediately.
 *             No exceptions, no "but there's also an animal" bypass.
 *
 *  Phase 2 — ANIMAL SCORING: weighted-keyword voting across all labels.
 *             Each category's score = sum(label_confidence × keyword_weight).
 *             Winner must exceed a minimum score or we return null.
 */
object AnimalRecognizer {

    private val labeler = ImageLabeling.getClient(
        ImageLabelerOptions.Builder().setConfidenceThreshold(0.30f).build()
    )

    // ─── Human labels — if ANY of these appear above threshold, HARD REJECT ──
    // Keep this list conservative (only unambiguously human things).
    private val HUMAN_LABELS = setOf(
        "person", "human", "face", "man", "woman", "boy", "girl",
        "child", "baby", "selfie", "portrait", "people", "crowd",
        "forehead", "nose", "mouth", "eye", "eyebrow", "ear",
        "chin", "cheek", "neck", "shoulder", "arm", "hand",
        "finger", "hair", "beard", "mustache", "skin", "lip"
    )

    // Confidence above which a human label triggers hard reject
    private const val HUMAN_REJECT_THRESHOLD = 0.40f

    // ─── Animal categories with weighted keywords ─────────────────────────────
    // Each Kw(word, weight): higher weight = stronger species signal.
    // Weights: 3.0 = exact species name, 2.0 = species-specific, 1.5 = breed/group
    private data class Kw(val word: String, val weight: Float)

    private data class AnimalCategory(
        val name: String,
        val emoji: String,
        val keywords: List<Kw>
    )

    private val CATEGORIES = listOf(
        AnimalCategory("Dog", "🐕", listOf(
            Kw("dog", 3.0f), Kw("puppy", 3.0f), Kw("canine", 2.5f),
            Kw("hound", 2.0f), Kw("retriever", 2.0f), Kw("shepherd", 2.0f),
            Kw("bulldog", 2.0f), Kw("labrador", 2.0f), Kw("poodle", 2.0f),
            Kw("beagle", 2.0f), Kw("boxer", 2.0f), Kw("husky", 2.0f),
            Kw("terrier", 1.5f), Kw("companion dog", 2.5f), Kw("dog breed", 2.0f),
            Kw("herding group", 1.5f), Kw("working dog", 1.5f),
            Kw("sporting group", 1.5f), Kw("toy group", 1.5f),
            Kw("dachshund", 2.0f), Kw("rottweiler", 2.0f), Kw("spitz", 2.0f)
        )),
        AnimalCategory("Cat", "🐈", listOf(
            Kw("cat", 3.0f), Kw("kitten", 3.0f), Kw("feline", 2.5f),
            Kw("tabby", 2.5f), Kw("persian", 2.0f), Kw("siamese", 2.0f),
            Kw("felidae", 2.0f), Kw("felinae", 2.0f), Kw("maine coon", 2.0f),
            Kw("small to medium-sized cat", 2.5f), Kw("domestic cat", 2.5f),
            Kw("cat breed", 2.0f), Kw("wildcat", 1.5f)
        )),
        AnimalCategory("Bird", "🐦", listOf(
            Kw("bird", 3.0f), Kw("pigeon", 2.5f), Kw("parrot", 2.5f),
            Kw("owl", 2.5f), Kw("eagle", 2.5f), Kw("crow", 2.5f),
            Kw("sparrow", 2.0f), Kw("fowl", 2.0f), Kw("poultry", 2.0f),
            Kw("parakeet", 2.0f), Kw("beak", 2.0f), Kw("feather", 1.5f),
            Kw("hawk", 2.0f), Kw("falcon", 2.0f), Kw("songbird", 2.0f),
            Kw("waterfowl", 2.0f), Kw("perching bird", 2.0f)
        )),
        AnimalCategory("Cow", "🐄", listOf(
            Kw("cow", 3.0f), Kw("cattle", 2.5f), Kw("bovine", 2.5f),
            Kw("bull", 2.5f), Kw("calf", 2.0f), Kw("water buffalo", 2.5f),
            Kw("dairy cattle", 2.5f)
        )),
        AnimalCategory("Horse", "🐎", listOf(
            Kw("horse", 3.0f), Kw("pony", 2.5f), Kw("equine", 2.5f),
            Kw("stallion", 2.5f), Kw("mare", 2.5f), Kw("donkey", 2.5f),
            Kw("mule", 2.0f), Kw("foal", 2.0f)
        )),
        AnimalCategory("Monkey", "🐒", listOf(
            Kw("monkey", 3.0f), Kw("primate", 2.5f), Kw("ape", 2.5f),
            Kw("macaque", 2.5f), Kw("langur", 2.5f), Kw("baboon", 2.5f),
            Kw("chimpanzee", 2.5f)
        )),
        AnimalCategory("Snake", "🐍", listOf(
            Kw("snake", 3.0f), Kw("serpent", 2.5f), Kw("cobra", 2.5f),
            Kw("python", 2.5f), Kw("viper", 2.5f)
        )),
        AnimalCategory("Reptile", "🦎", listOf(
            Kw("lizard", 3.0f), Kw("reptile", 2.5f), Kw("gecko", 2.5f),
            Kw("iguana", 2.5f), Kw("chameleon", 2.5f),
            Kw("tortoise", 2.5f), Kw("turtle", 2.5f)
        )),
        AnimalCategory("Rabbit", "🐇", listOf(
            Kw("rabbit", 3.0f), Kw("hare", 2.5f), Kw("bunny", 2.5f)
        )),
        AnimalCategory("Rodent", "🐀", listOf(
            Kw("rat", 3.0f), Kw("mouse", 3.0f), Kw("squirrel", 2.5f),
            Kw("hamster", 2.5f), Kw("rodent", 2.5f), Kw("chipmunk", 2.0f)
        )),
        AnimalCategory("Pig", "🐷", listOf(
            Kw("pig", 3.0f), Kw("swine", 2.5f), Kw("boar", 2.5f), Kw("piglet", 2.5f)
        )),
        AnimalCategory("Goat", "🐐", listOf(
            Kw("goat", 3.0f), Kw("sheep", 3.0f), Kw("lamb", 2.5f),
            Kw("ram", 2.0f), Kw("ewe", 2.0f)
        ))
    )

    // Minimum weighted score required to report a detection.
    // This prevents weak/accidental matches from being reported.
    private const val MIN_SCORE_THRESHOLD = 0.80f

    private fun labelScore(labelText: String, keywords: List<Kw>): Float {
        val lower = labelText.lowercase()
        // Only take the highest weight keyword that matches (avoid double-counting)
        return keywords.filter { lower.contains(it.word) }.maxOfOrNull { it.weight } ?: 0f
    }

    fun analyze(bitmap: Bitmap, onResult: (AnimalDetectionResult?) -> Unit) {
        val image = InputImage.fromBitmap(bitmap, 0)
        labeler.process(image)
            .addOnSuccessListener { labels ->
                if (labels.isEmpty()) { onResult(null); return@addOnSuccessListener }

                // ── PHASE 1: HARD HUMAN GATE ──────────────────────────────────────
                // If ML Kit returns ANY human-indicating label above threshold → reject.
                // This is unconditional — no "but there's also an animal" bypass.
                val strongestHumanLabel = labels
                    .filter { lbl ->
                        val lower = lbl.text.lowercase()
                        HUMAN_LABELS.any { lower.contains(it) }
                    }
                    .maxByOrNull { it.confidence }

                if (strongestHumanLabel != null && strongestHumanLabel.confidence >= HUMAN_REJECT_THRESHOLD) {
                    onResult(null)
                    return@addOnSuccessListener
                }

                // ── PHASE 2: WEIGHTED ANIMAL SCORING ─────────────────────────────
                // For each category: sum(label_confidence × best_matching_keyword_weight)
                val categoryScores = CATEGORIES.map { category ->
                    val score = labels.sumOf { lbl ->
                        (labelScore(lbl.text, category.keywords) * lbl.confidence).toDouble()
                    }.toFloat()
                    category to score
                }

                val best = categoryScores
                    .filter { (_, score) -> score >= MIN_SCORE_THRESHOLD }
                    .maxByOrNull { (_, score) -> score }

                if (best == null) {
                    onResult(null)
                    return@addOnSuccessListener
                }

                val (category, score) = best

                // Compute honest confidence: normalize score by max possible score
                // (if every label matched at weight 3.0 × 1.0 confidence).
                // Then map to a 60–95% display range so we never show 100%.
                val maxPossible = labels.sumOf { it.confidence.toDouble() }.toFloat() * 3.0f
                val rawPercent = if (maxPossible > 0) (score / maxPossible) * 100f else 0f
                val displayConfidence = rawPercent.toInt().coerceIn(60, 95)

                onResult(
                    AnimalDetectionResult(
                        label = category.name,
                        confidence = displayConfidence,
                        emoji = category.emoji
                    )
                )
            }
            .addOnFailureListener { onResult(null) }
    }
}
