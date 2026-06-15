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

object AnimalRecognizer {
    private val labeler = ImageLabeling.getClient(
        ImageLabelerOptions.Builder().setConfidenceThreshold(0.35f).build()
    )

    // ─── Category keyword maps (actual ML Kit Knowledge Graph labels) ──────────
    // ML Kit does NOT return "dog" or "cat" directly.
    // It returns labels like: "Dog breed group", "Companion dog", "Sporting Group",
    // "Small to medium-sized cats", "Carnivore", etc.
    private val DOG_WORDS = listOf(
        "dog", "puppy", "canine", "hound", "retriever", "shepherd", "bulldog",
        "labrador", "poodle", "beagle", "boxer", "husky", "dachshund",
        "rottweiler", "spitz", "terrier", "herding", "sporting group",
        "working dog", "companion dog", "dog breed"
    )

    private val CAT_WORDS = listOf(
        "cat", "kitten", "feline", "tabby", "persian", "siamese",
        "maine coon", "small to medium-sized cat", "domestic cat",
        "cat breed", "felidae", "felinae", "wildcat"
    )

    private val BIRD_WORDS = listOf(
        "bird", "pigeon", "parrot", "owl", "eagle", "crow", "sparrow",
        "finch", "fowl", "poultry", "parakeet", "cockatiel", "robin",
        "hawk", "falcon", "feather", "beak", "perching bird",
        "songbird", "passerine", "waterfowl", "seabird"
    )

    private val COW_WORDS = listOf(
        "cow", "bull", "cattle", "bovine", "calf", "ox", "dairy", "water buffalo"
    )

    private val HORSE_WORDS = listOf(
        "horse", "pony", "equine", "stallion", "mare", "foal", "donkey", "mule"
    )

    private val MONKEY_WORDS = listOf(
        "monkey", "primate", "ape", "macaque", "langur", "baboon", "chimpanzee"
    )

    private val SNAKE_WORDS = listOf(
        "snake", "serpent", "cobra", "python", "viper", "reptile", "lizard",
        "gecko", "iguana", "chameleon", "tortoise", "turtle"
    )

    private val RABBIT_WORDS = listOf(
        "rabbit", "hare", "bunny", "lagomorph"
    )

    private val RODENT_WORDS = listOf(
        "rat", "mouse", "squirrel", "hamster", "rodent", "gerbil", "chipmunk"
    )

    private val PIG_WORDS = listOf("pig", "boar", "swine", "pork", "piglet")

    private val GOAT_WORDS = listOf("goat", "sheep", "lamb", "goatling", "ram", "ewe")

    // Generic animal words that confirm an animal is present but don't specify which
    private val GENERIC_ANIMAL_WORDS = listOf(
        "animal", "mammal", "carnivore", "herbivore", "omnivore",
        "vertebrate", "livestock", "wildlife", "stray", "fur", "paw",
        "snout", "muzzle", "claw", "tail", "whisker", "domestic animal",
        "working animal", "pet"
    )

    // Labels that mean it's a human photo — reject these
    private val HUMAN_WORDS = listOf(
        "person", "human", "face", "selfie", "man", "woman", "boy", "girl",
        "child", "baby", "people", "forehead", "nose", "mouth", "lip", "eye",
        "shoulder", "arm", "hand", "finger", "hair", "beard", "portrait",
        "fashion", "clothing", "shirt", "dress", "glasses", "smile",
        "cheek", "chin", "crowd", "audience"
    )

    private data class Category(val name: String, val emoji: String, val words: List<String>)

    private val CATEGORIES = listOf(
        Category("Dog", "🐕", DOG_WORDS),
        Category("Cat", "🐈", CAT_WORDS),
        Category("Bird", "🐦", BIRD_WORDS),
        Category("Cow", "🐄", COW_WORDS),
        Category("Horse", "🐎", HORSE_WORDS),
        Category("Monkey", "🐒", MONKEY_WORDS),
        Category("Snake / Reptile", "🐍", SNAKE_WORDS),
        Category("Rabbit", "🐇", RABBIT_WORDS),
        Category("Rodent", "🐀", RODENT_WORDS),
        Category("Pig", "🐷", PIG_WORDS),
        Category("Goat / Sheep", "🐐", GOAT_WORDS),
        Category("Animal", "🐾", GENERIC_ANIMAL_WORDS)
    )

    private fun matchScore(label: String, words: List<String>): Float {
        val lower = label.lowercase()
        return if (words.any { lower.contains(it) }) 1f else 0f
    }

    fun analyze(bitmap: Bitmap, onResult: (AnimalDetectionResult?) -> Unit) {
        val image = InputImage.fromBitmap(bitmap, 0)
        labeler.process(image)
            .addOnSuccessListener { labels ->
                // ── Step 1: Reject if strong human signal with NO animal signal ──
                val humanScore = labels.filter { lbl ->
                    HUMAN_WORDS.any { lbl.text.lowercase().contains(it) }
                }.sumOf { it.confidence.toDouble() }.toFloat()

                val anyAnimalSignal = labels.any { lbl ->
                    val lower = lbl.text.lowercase()
                    CATEGORIES.any { cat -> cat.words.any { lower.contains(it) } }
                }

                if (humanScore > 0.65f && !anyAnimalSignal) {
                    onResult(null)
                    return@addOnSuccessListener
                }

                // ── Step 2: Score each category by SUMMING confidence across all labels ──
                // This is far more accurate than picking the single top label.
                val categoryScores = CATEGORIES.associateWith { category ->
                    labels.sumOf { lbl ->
                        (matchScore(lbl.text, category.words) * lbl.confidence).toDouble()
                    }.toFloat()
                }

                // ── Step 3: Pick the category with the highest total score ──
                val best = categoryScores.entries
                    .filter { it.value > 0.20f }   // minimum confidence threshold
                    .maxByOrNull { it.value }

                if (best != null) {
                    val avgConfidence = (best.value * 100).toInt().coerceAtMost(99)
                    onResult(
                        AnimalDetectionResult(
                            label = best.key.name,
                            confidence = avgConfidence,
                            emoji = best.key.emoji
                        )
                    )
                } else {
                    onResult(null)
                }
            }
            .addOnFailureListener {
                onResult(null)
            }
    }
}
