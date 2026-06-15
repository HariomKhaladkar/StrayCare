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
        ImageLabelerOptions.Builder().setConfidenceThreshold(0.40f).build()
    )

    // ─────────────────────────────────────────────────────────────────────────
    // ML Kit uses Google Knowledge-Graph labels. These are the actual strings
    // it returns for animals. Keep this comprehensive.
    // ─────────────────────────────────────────────────────────────────────────
    private val DOG_KEYWORDS = setOf(
        "dog", "puppy", "canine", "hound", "pup",
        "dog breed", "dog breed group", "sporting group", "herding group",
        "toy group", "terrier", "working dog", "companion dog",
        "retriever", "shepherd", "bulldog", "labrador", "poodle",
        "beagle", "boxer", "husky", "dachshund", "rottweiler",
        "spitz", "maltese", "shih tzu"
    )

    private val CAT_KEYWORDS = setOf(
        "cat", "kitten", "feline", "tabby", "kitty",
        "cat breed", "small to medium-sized cats",
        "domestic short-haired cat", "domestic long-haired cat",
        "whiskers", "persian", "siamese", "maine coon"
    )

    private val BIRD_KEYWORDS = setOf(
        "bird", "pigeon", "parrot", "owl", "eagle", "crow",
        "sparrow", "finch", "fowl", "poultry", "parakeet",
        "cockatiel", "robin", "hawk", "falcon", "kite",
        "feather", "beak", "talon", "perching bird"
    )

    private val COW_KEYWORDS = setOf(
        "cow", "bull", "cattle", "bovine", "calf", "ox",
        "dairy cow", "water buffalo"
    )

    private val HORSE_KEYWORDS = setOf(
        "horse", "pony", "equine", "stallion", "mare", "foal",
        "donkey", "mule"
    )

    private val OTHER_ANIMAL_KEYWORDS = setOf(
        "goat", "sheep", "pig", "rabbit", "hare",
        "monkey", "primate", "deer", "fox", "wolf",
        "snake", "reptile", "lizard", "turtle", "tortoise",
        "rodent", "rat", "mouse", "squirrel", "hamster",
        "elephant", "bear", "camel", "animal", "mammal",
        "carnivore", "herbivore", "omnivore",
        "stray", "wildlife", "livestock",
        "paw", "snout", "muzzle", "fur", "claw",
        "working animal", "domestic animal"
    )

    private val ALL_ANIMAL_KEYWORDS: Set<String> =
        DOG_KEYWORDS + CAT_KEYWORDS + BIRD_KEYWORDS + COW_KEYWORDS +
        HORSE_KEYWORDS + OTHER_ANIMAL_KEYWORDS

    // Labels that DISQUALIFY the image — these mean it's a human photo
    private val HUMAN_BLOCKLIST = setOf(
        "person", "human", "face", "selfie", "skin", "head",
        "man", "woman", "boy", "girl", "child", "baby", "people",
        "forehead", "nose", "mouth", "lip", "eye", "eyebrow",
        "shoulder", "arm", "hand", "finger", "hair", "beard",
        "portrait", "fashion", "clothing", "shirt", "dress",
        "glasses", "smile", "cheek", "chin", "jaw", "neck",
        "crowd", "audience", "spectator"
    )

    private fun matchesAny(text: String, keywords: Set<String>): Boolean {
        val lower = text.lowercase()
        return keywords.any { lower.contains(it) }
    }

    private fun getCategory(label: String): String {
        val lower = label.lowercase()
        return when {
            DOG_KEYWORDS.any { lower.contains(it) } -> "Dog"
            CAT_KEYWORDS.any { lower.contains(it) } -> "Cat"
            BIRD_KEYWORDS.any { lower.contains(it) } -> "Bird"
            COW_KEYWORDS.any { lower.contains(it) } -> "Cow"
            HORSE_KEYWORDS.any { lower.contains(it) } -> "Horse"
            else -> label  // Return the actual label for other animals
        }
    }

    private fun getEmoji(category: String): String {
        return when {
            category.equals("Dog", ignoreCase = true) -> "🐕"
            category.equals("Cat", ignoreCase = true) -> "🐈"
            category.equals("Bird", ignoreCase = true) -> "🐦"
            category.equals("Cow", ignoreCase = true) -> "🐄"
            category.equals("Horse", ignoreCase = true) -> "🐎"
            category.lowercase().contains("goat") || category.lowercase().contains("sheep") -> "🐐"
            category.lowercase().contains("monkey") || category.lowercase().contains("primate") -> "🐒"
            category.lowercase().contains("snake") || category.lowercase().contains("reptile") -> "🐍"
            category.lowercase().contains("rabbit") || category.lowercase().contains("hare") -> "🐇"
            category.lowercase().contains("rat") || category.lowercase().contains("mouse") || category.lowercase().contains("rodent") -> "🐀"
            category.lowercase().contains("pig") -> "🐷"
            else -> "🐾"
        }
    }

    fun analyze(bitmap: Bitmap, onResult: (AnimalDetectionResult?) -> Unit) {
        val image = InputImage.fromBitmap(bitmap, 0)
        labeler.process(image)
            .addOnSuccessListener { labels ->
                // Step 1: Reject if strong human signals AND no animal signals
                val humanLabels = labels.filter { matchesAny(it.text, HUMAN_BLOCKLIST) }
                val animalLabels = labels.filter { matchesAny(it.text, ALL_ANIMAL_KEYWORDS) }

                val hasStrongHuman = humanLabels.any { it.confidence >= 0.70f }
                val hasAnyAnimal = animalLabels.isNotEmpty()

                if (hasStrongHuman && !hasAnyAnimal) {
                    onResult(null)
                    return@addOnSuccessListener
                }

                // Step 2: Pick the best-confidence animal label
                val bestAnimal = animalLabels
                    .filter { it.confidence >= 0.45f }
                    .maxByOrNull { it.confidence }

                if (bestAnimal != null) {
                    val category = getCategory(bestAnimal.text)
                    onResult(
                        AnimalDetectionResult(
                            label = category,
                            confidence = (bestAnimal.confidence * 100).toInt(),
                            emoji = getEmoji(category)
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
