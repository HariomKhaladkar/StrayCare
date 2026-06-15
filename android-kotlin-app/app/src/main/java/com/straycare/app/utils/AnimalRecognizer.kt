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
        ImageLabelerOptions.Builder().setConfidenceThreshold(0.55f).build()
    )

    // Labels that CONFIRM an animal is present
    private val ANIMAL_KEYWORDS = setOf(
        "dog", "cat", "bird", "puppy", "kitten", "canine", "feline",
        "cow", "horse", "goat", "sheep", "pig", "rabbit",
        "monkey", "deer", "elephant", "fox", "snake", "reptile",
        "turtle", "lizard", "rodent", "rat", "mouse", "squirrel",
        "pigeon", "parrot", "owl", "eagle", "crow", "stray",
        "working animal", "street animal", "domestic animal",
        "paw", "snout", "muzzle", "pelt", "fur coat",
        "livestock", "poultry", "flock", "pack animal"
    )

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

    private fun isAnimalLabel(label: String): Boolean {
        val lower = label.lowercase()
        return ANIMAL_KEYWORDS.any { lower.contains(it) }
    }

    private fun isHumanLabel(label: String): Boolean {
        val lower = label.lowercase()
        return HUMAN_BLOCKLIST.any { lower.contains(it) }
    }

    private fun getEmoji(label: String): String {
        val lower = label.lowercase()
        return when {
            lower.contains("dog") || lower.contains("puppy") || lower.contains("canine") -> "🐕"
            lower.contains("cat") || lower.contains("kitten") || lower.contains("feline") -> "🐈"
            lower.contains("bird") || lower.contains("pigeon") || lower.contains("parrot")
                    || lower.contains("owl") || lower.contains("eagle") || lower.contains("crow") -> "🐦"
            lower.contains("cow") || lower.contains("bull") -> "🐄"
            lower.contains("horse") -> "🐎"
            lower.contains("goat") || lower.contains("sheep") -> "🐐"
            lower.contains("monkey") -> "🐒"
            lower.contains("snake") || lower.contains("reptile") -> "🐍"
            lower.contains("rabbit") -> "🐇"
            lower.contains("rat") || lower.contains("mouse") || lower.contains("rodent") -> "🐀"
            lower.contains("pig") -> "🐷"
            else -> "🐾"
        }
    }

    fun analyze(bitmap: Bitmap, onResult: (AnimalDetectionResult?) -> Unit) {
        val image = InputImage.fromBitmap(bitmap, 0)
        labeler.process(image)
            .addOnSuccessListener { labels ->
                // Step 1: Check if any high-confidence HUMAN label is present
                val humanLabels = labels.filter { isHumanLabel(it.text) }
                val animalLabels = labels.filter { isAnimalLabel(it.text) }

                // Step 2: If strong human signals detected with NO animal signals → reject
                val hasStrongHuman = humanLabels.any { it.confidence >= 0.60f }
                val hasAnyAnimal  = animalLabels.isNotEmpty()

                if (hasStrongHuman && !hasAnyAnimal) {
                    // Clearly a human photo — reject
                    onResult(null)
                    return@addOnSuccessListener
                }

                // Step 3: Pick best animal label that clears the confidence bar
                val bestAnimal = animalLabels
                    .filter { it.confidence >= 0.60f }
                    .maxByOrNull { it.confidence }

                if (bestAnimal != null) {
                    onResult(
                        AnimalDetectionResult(
                            label = bestAnimal.text,
                            confidence = (bestAnimal.confidence * 100).toInt(),
                            emoji = getEmoji(bestAnimal.text)
                        )
                    )
                } else {
                    onResult(null)
                }
            }
            .addOnFailureListener {
                // ML Kit failure → do NOT falsely approve
                onResult(null)
            }
    }
}
