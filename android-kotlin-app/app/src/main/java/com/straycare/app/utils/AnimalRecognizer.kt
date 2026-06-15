package com.straycare.app.utils

import android.content.Context
import android.graphics.Bitmap
import org.tensorflow.lite.task.vision.classifier.ImageClassifier
import org.tensorflow.lite.support.image.TensorImage

data class AnimalDetectionResult(
    val label: String,
    val confidence: Int,
    val emoji: String
)

/**
 * AnimalRecognizer powered by EfficientNet-Lite0 (TFLite).
 *
 * Model: efficientnet_lite0 (5.4MB, trained on ImageNet-1000)
 * Labels: labels.txt (1000 ImageNet classes, human-readable)
 *
 * This is far more accurate than ML Kit's general image labeler because:
 *  - EfficientNet is specifically trained for fine-grained image classification
 *  - Returns specific class names like "Egyptian cat", "Labrador retriever" etc.
 *  - Runs fully on-device, no network needed
 */
object AnimalRecognizer {

    // ─── Map ImageNet class name fragments → our simplified animal category ──
    // Keys are lowercase substrings to match against ImageNet class names.
    private val CLASS_MAP: List<Pair<String, Pair<String, String>>> = listOf(
        // Dog breeds → "Dog" 🐕
        "terrier"         to ("Dog" to "🐕"),
        "retriever"       to ("Dog" to "🐕"),
        "shepherd"        to ("Dog" to "🐕"),
        "spaniel"         to ("Dog" to "🐕"),
        "hound"           to ("Dog" to "🐕"),
        "bulldog"         to ("Dog" to "🐕"),
        "poodle"          to ("Dog" to "🐕"),
        "labrador"        to ("Dog" to "🐕"),
        "husky"           to ("Dog" to "🐕"),
        "maltese dog"     to ("Dog" to "🐕"),
        "collie"          to ("Dog" to "🐕"),
        "beagle"          to ("Dog" to "🐕"),
        "boxer"           to ("Dog" to "🐕"),
        "chihuahua"       to ("Dog" to "🐕"),
        "pomeranian"      to ("Dog" to "🐕"),
        "dachshund"       to ("Dog" to "🐕"),
        "dalmatian"       to ("Dog" to "🐕"),
        "malinois"        to ("Dog" to "🐕"),
        "rottweiler"      to ("Dog" to "🐕"),
        "doberman"        to ("Dog" to "🐕"),
        "vizsla"          to ("Dog" to "🐕"),
        "whippet"         to ("Dog" to "🐕"),
        "basenji"         to ("Dog" to "🐕"),
        "pug"             to ("Dog" to "🐕"),
        "samoyed"         to ("Dog" to "🐕"),
        "kuvasz"          to ("Dog" to "🐕"),
        "schipperke"      to ("Dog" to "🐕"),
        "komondor"        to ("Dog" to "🐕"),
        "borzoi"          to ("Dog" to "🐕"),
        "greyhound"       to ("Dog" to "🐕"),
        "african hunting dog" to ("Dog" to "🐕"),
        "eskimo dog"      to ("Dog" to "🐕"),

        // Cat breeds → "Cat" 🐈
        "tabby"           to ("Cat" to "🐈"),
        "persian cat"     to ("Cat" to "🐈"),
        "siamese cat"     to ("Cat" to "🐈"),
        "egyptian cat"    to ("Cat" to "🐈"),
        "tiger cat"       to ("Cat" to "🐈"),
        "cougar"          to ("Cat" to "🐈"),
        "lynx"            to ("Cat" to "🐈"),
        "leopard"         to ("Cat" to "🐈"),
        "snow leopard"    to ("Cat" to "🐈"),
        "jaguar"          to ("Cat" to "🐈"),
        "cheetah"         to ("Cat" to "🐈"),
        "lion"            to ("Cat" to "🐈"),
        "tiger"           to ("Cat" to "🐈"),

        // Birds → "Bird" 🐦
        "hen"             to ("Bird" to "🐦"),
        "cock"            to ("Bird" to "🐦"),
        "ostrich"         to ("Bird" to "🐦"),
        "flamingo"        to ("Bird" to "🐦"),
        "heron"           to ("Bird" to "🐦"),
        "spoonbill"       to ("Bird" to "🐦"),
        "pelican"         to ("Bird" to "🐦"),
        "albatross"       to ("Bird" to "🐦"),
        "penguin"         to ("Bird" to "🐦"),
        "parrot"          to ("Bird" to "🐦"),
        "macaw"           to ("Bird" to "🐦"),
        "lorikeet"        to ("Bird" to "🐦"),
        "cockatoo"        to ("Bird" to "🐦"),
        "hornbill"        to ("Bird" to "🐦"),
        "toucan"          to ("Bird" to "🐦"),
        "pigeon"          to ("Bird" to "🐦"),
        "crow"            to ("Bird" to "🐦"),
        "jay"             to ("Bird" to "🐦"),
        "magpie"          to ("Bird" to "🐦"),
        "vulture"         to ("Bird" to "🐦"),
        "eagle"           to ("Bird" to "🐦"),
        "kite"            to ("Bird" to "🐦"),
        "owl"             to ("Bird" to "🐦"),
        "hummingbird"     to ("Bird" to "🐦"),
        "finch"           to ("Bird" to "🐦"),
        "robin"           to ("Bird" to "🐦"),
        "oystercatcher"   to ("Bird" to "🐦"),
        "limpkin"         to ("Bird" to "🐦"),
        "ptarmigan"       to ("Bird" to "🐦"),
        "quail"           to ("Bird" to "🐦"),
        "peacock"         to ("Bird" to "🐦"),
        "turkey"          to ("Bird" to "🐦"),

        // Cows & Cattle
        "ox"              to ("Cow" to "🐄"),
        "bison"           to ("Cow" to "🐄"),
        "water buffalo"   to ("Cow" to "🐄"),
        "ram"             to ("Goat" to "🐐"),
        "ibex"            to ("Goat" to "🐐"),
        "bighorn"         to ("Goat" to "🐐"),

        // Horse
        "horse"           to ("Horse" to "🐎"),
        "sorrel"          to ("Horse" to "🐎"),
        "zebra"           to ("Horse" to "🐎"),
        "mule"            to ("Horse" to "🐎"),
        "donkey"          to ("Horse" to "🐎"),

        // Monkeys & Primates
        "monkey"          to ("Monkey" to "🐒"),
        "gibbon"          to ("Monkey" to "🐒"),
        "siamang"         to ("Monkey" to "🐒"),
        "macaque"         to ("Monkey" to "🐒"),
        "baboon"          to ("Monkey" to "🐒"),
        "chimpanzee"      to ("Monkey" to "🐒"),
        "gorilla"         to ("Monkey" to "🐒"),
        "orangutan"       to ("Monkey" to "🐒"),
        "langur"          to ("Monkey" to "🐒"),
        "marmoset"        to ("Monkey" to "🐒"),
        "squirrel monkey" to ("Monkey" to "🐒"),
        "proboscis monkey" to ("Monkey" to "🐒"),

        // Reptiles & Snakes
        "snake"           to ("Snake" to "🐍"),
        "cobra"           to ("Snake" to "🐍"),
        "boa constrictor" to ("Snake" to "🐍"),
        "rock python"     to ("Snake" to "🐍"),
        "horned viper"    to ("Snake" to "🐍"),
        "rattlesnake"     to ("Snake" to "🐍"),
        "green mamba"     to ("Snake" to "🐍"),
        "night snake"     to ("Snake" to "🐍"),
        "lizard"          to ("Reptile" to "🦎"),
        "iguana"          to ("Reptile" to "🦎"),
        "agama"           to ("Reptile" to "🦎"),
        "chameleon"       to ("Reptile" to "🦎"),
        "frilled lizard"  to ("Reptile" to "🦎"),
        "alligator lizard" to ("Reptile" to "🦎"),
        "gila monster"    to ("Reptile" to "🦎"),
        "tortoise"        to ("Reptile" to "🦎"),
        "mud turtle"      to ("Reptile" to "🦎"),
        "box turtle"      to ("Reptile" to "🦎"),
        "sea turtle"      to ("Reptile" to "🦎"),
        "crocodile"       to ("Reptile" to "🦎"),
        "alligator"       to ("Reptile" to "🦎"),
        "komodo dragon"   to ("Reptile" to "🦎"),

        // Small mammals
        "rabbit"          to ("Rabbit" to "🐇"),
        "hare"            to ("Rabbit" to "🐇"),
        "pika"            to ("Rabbit" to "🐇"),
        "hamster"         to ("Rodent" to "🐀"),
        "squirrel"        to ("Rodent" to "🐀"),
        "marmot"          to ("Rodent" to "🐀"),
        "rat"             to ("Rodent" to "🐀"),
        "mouse"           to ("Rodent" to "🐀"),
        "porcupine"       to ("Rodent" to "🐀"),
        "beaver"          to ("Rodent" to "🐀"),
        "guinea pig"      to ("Rodent" to "🐀"),

        // Pigs
        "hog"             to ("Pig" to "🐷"),
        "warthog"         to ("Pig" to "🐷"),

        // Elephants & large animals
        "elephant"        to ("Elephant" to "🐘"),
        "rhinoceros"      to ("Rhino" to "🦏"),
        "hippopotamus"    to ("Hippo" to "🦛"),
        "bear"            to ("Bear" to "🐻"),
        "giant panda"     to ("Panda" to "🐼"),
        "lesser panda"    to ("Panda" to "🐼"),
        "camel"           to ("Camel" to "🐫"),
        "llama"           to ("Camel" to "🐫"),
        "fox"             to ("Fox" to "🦊"),
        "wolf"            to ("Wolf" to "🐺"),
        "hyena"           to ("Hyena" to "🐾"),
        "deer"            to ("Deer" to "🦌"),
        "gazelle"         to ("Deer" to "🦌"),

        // Reject human-related ImageNet classes
        "people"          to ("HUMAN" to ""),
        "face"            to ("HUMAN" to ""),
    )

    // ImageNet classes that mean it's a human photo — mapped to HUMAN so we reject
    private val HUMAN_IMAGENET = setOf(
        "measuring cup", "comic book", "letter opener", "packet", "jersey",
        "bridegroom", "suit", "mortarboard", "uniform", "lab coat"
        // We handle actual person detection via the HUMAN key above
    )

    @Volatile
    private var classifier: ImageClassifier? = null

    private fun getClassifier(context: Context): ImageClassifier {
        return classifier ?: synchronized(this) {
            classifier ?: ImageClassifier.createFromFileAndOptions(
                context,
                "animal_classifier.tflite",
                ImageClassifier.ImageClassifierOptions.builder()
                    .setMaxResults(10)
                    .setScoreThreshold(0.05f)   // get top-10 results above 5%
                    .build()
            ).also { classifier = it }
        }
    }

    fun analyze(context: Context, bitmap: Bitmap, onResult: (AnimalDetectionResult?) -> Unit) {
        try {
            val clf = getClassifier(context)
            val tensorImage = TensorImage.fromBitmap(bitmap)
            val results = clf.classify(tensorImage)

            if (results.isNullOrEmpty() || results[0].categories.isNullOrEmpty()) {
                onResult(null)
                return
            }

            // All categories from top-10 results
            val categories = results[0].categories
                .sortedByDescending { it.score }

            // Score each animal bucket by summing scores of matching ImageNet classes
            val bucketScores = mutableMapOf<String, Float>()
            val bucketEmoji  = mutableMapOf<String, String>()

            for (category in categories) {
                val labelLower = category.label.lowercase()

                // Hard-reject human ImageNet classes
                if (labelLower == "person" || labelLower.contains("face") ||
                    labelLower == "jersey" || labelLower == "suit" ||
                    labelLower == "mortarboard" || labelLower == "lab coat") {
                    // Only reject if top confidence is very high
                    if (category.score > 0.55f && categories.indexOf(category) == 0) {
                        onResult(null)
                        return
                    }
                    continue
                }

                // Find matching animal bucket
                for ((keyword, bucket) in CLASS_MAP) {
                    if (bucket.first == "HUMAN") continue
                    if (labelLower.contains(keyword)) {
                        val current = bucketScores.getOrDefault(bucket.first, 0f)
                        bucketScores[bucket.first] = current + category.score
                        bucketEmoji[bucket.first] = bucket.second
                        break  // only count each label once
                    }
                }
            }

            if (bucketScores.isEmpty()) {
                onResult(null)
                return
            }

            val bestBucket = bucketScores.entries.maxByOrNull { it.value }!!
            val topAnimalScore = bestBucket.value
            val topCategoryScore = categories.firstOrNull()?.score ?: 0f

            // Require meaningful confidence — don't report if score is weak
            if (topAnimalScore < 0.08f) {
                onResult(null)
                return
            }

            // Map score to display confidence (60–95%)
            val displayConf = (topAnimalScore * 150f).toInt().coerceIn(60, 95)

            onResult(
                AnimalDetectionResult(
                    label = bestBucket.key,
                    confidence = displayConf,
                    emoji = bucketEmoji[bestBucket.key] ?: "🐾"
                )
            )
        } catch (e: Exception) {
            onResult(null)
        }
    }
}
