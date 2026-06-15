// frontend/src/hooks/useAnimalRecognition.js
//
// Runs MobileNet image classification entirely in-browser.
// No API key, no server, works offline after first model load.
//
import { useState, useCallback, useRef } from 'react';

// ─── ImageNet label → StrayCare animal category mapping ──────────────────────
// MobileNet is trained on ImageNet's 1000 classes which includes many animals.
const LABEL_TO_CATEGORY = {
    // Dogs
    'chihuahua': { species: 'Dog', label: 'Chihuahua', emoji: '🐕' },
    'japanese_spaniel': { species: 'Dog', label: 'Japanese Spaniel', emoji: '🐕' },
    'maltese_dog': { species: 'Dog', label: 'Maltese', emoji: '🐕' },
    'pekinese': { species: 'Dog', label: 'Pekinese', emoji: '🐕' },
    'shih-tzu': { species: 'Dog', label: 'Shih-Tzu', emoji: '🐕' },
    'blenheim_spaniel': { species: 'Dog', label: 'Blenheim Spaniel', emoji: '🐕' },
    'papillon': { species: 'Dog', label: 'Papillon', emoji: '🐕' },
    'toy_terrier': { species: 'Dog', label: 'Toy Terrier', emoji: '🐕' },
    'rhodesian_ridgeback': { species: 'Dog', label: 'Rhodesian Ridgeback', emoji: '🐕' },
    'afghan_hound': { species: 'Dog', label: 'Afghan Hound', emoji: '🐕' },
    'basset': { species: 'Dog', label: 'Basset Hound', emoji: '🐕' },
    'beagle': { species: 'Dog', label: 'Beagle', emoji: '🐕' },
    'bloodhound': { species: 'Dog', label: 'Bloodhound', emoji: '🐕' },
    'bluetick': { species: 'Dog', label: 'Bluetick', emoji: '🐕' },
    'black-and-tan_coonhound': { species: 'Dog', label: 'Coonhound', emoji: '🐕' },
    'walker_hound': { species: 'Dog', label: 'Walker Hound', emoji: '🐕' },
    'english_foxhound': { species: 'Dog', label: 'English Foxhound', emoji: '🐕' },
    'redbone': { species: 'Dog', label: 'Redbone', emoji: '🐕' },
    'borzoi': { species: 'Dog', label: 'Borzoi', emoji: '🐕' },
    'irish_wolfhound': { species: 'Dog', label: 'Irish Wolfhound', emoji: '🐕' },
    'italian_greyhound': { species: 'Dog', label: 'Italian Greyhound', emoji: '🐕' },
    'whippet': { species: 'Dog', label: 'Whippet', emoji: '🐕' },
    'ibizan_hound': { species: 'Dog', label: 'Ibizan Hound', emoji: '🐕' },
    'norwegian_elkhound': { species: 'Dog', label: 'Norwegian Elkhound', emoji: '🐕' },
    'otterhound': { species: 'Dog', label: 'Otterhound', emoji: '🐕' },
    'saluki': { species: 'Dog', label: 'Saluki', emoji: '🐕' },
    'scottish_deerhound': { species: 'Dog', label: 'Scottish Deerhound', emoji: '🐕' },
    'weimaraner': { species: 'Dog', label: 'Weimaraner', emoji: '🐕' },
    'staffordshire_bullterrier': { species: 'Dog', label: 'Staffordshire Bull Terrier', emoji: '🐕' },
    'american_staffordshire_terrier': { species: 'Dog', label: 'American Staffordshire Terrier', emoji: '🐕' },
    'bedlington_terrier': { species: 'Dog', label: 'Bedlington Terrier', emoji: '🐕' },
    'border_terrier': { species: 'Dog', label: 'Border Terrier', emoji: '🐕' },
    'kerry_blue_terrier': { species: 'Dog', label: 'Kerry Blue Terrier', emoji: '🐕' },
    'irish_terrier': { species: 'Dog', label: 'Irish Terrier', emoji: '🐕' },
    'norfolk_terrier': { species: 'Dog', label: 'Norfolk Terrier', emoji: '🐕' },
    'norwich_terrier': { species: 'Dog', label: 'Norwich Terrier', emoji: '🐕' },
    'yorkshire_terrier': { species: 'Dog', label: 'Yorkshire Terrier', emoji: '🐕' },
    'wire-haired_fox_terrier': { species: 'Dog', label: 'Wire Fox Terrier', emoji: '🐕' },
    'lakeland_terrier': { species: 'Dog', label: 'Lakeland Terrier', emoji: '🐕' },
    'sealyham_terrier': { species: 'Dog', label: 'Sealyham Terrier', emoji: '🐕' },
    'airedale': { species: 'Dog', label: 'Airedale Terrier', emoji: '🐕' },
    'cairn': { species: 'Dog', label: 'Cairn Terrier', emoji: '🐕' },
    'australian_terrier': { species: 'Dog', label: 'Australian Terrier', emoji: '🐕' },
    'dandie_dinmont': { species: 'Dog', label: 'Dandie Dinmont', emoji: '🐕' },
    'boston_bull': { species: 'Dog', label: 'Boston Terrier', emoji: '🐕' },
    'miniature_schnauzer': { species: 'Dog', label: 'Miniature Schnauzer', emoji: '🐕' },
    'giant_schnauzer': { species: 'Dog', label: 'Giant Schnauzer', emoji: '🐕' },
    'standard_schnauzer': { species: 'Dog', label: 'Standard Schnauzer', emoji: '🐕' },
    'scotch_terrier': { species: 'Dog', label: 'Scottish Terrier', emoji: '🐕' },
    'tibetan_terrier': { species: 'Dog', label: 'Tibetan Terrier', emoji: '🐕' },
    'silky_terrier': { species: 'Dog', label: 'Silky Terrier', emoji: '🐕' },
    'soft-coated_wheaten_terrier': { species: 'Dog', label: 'Wheaten Terrier', emoji: '🐕' },
    'west_highland_white_terrier': { species: 'Dog', label: 'Westie', emoji: '🐕' },
    'lhasa': { species: 'Dog', label: 'Lhasa Apso', emoji: '🐕' },
    'flat-coated_retriever': { species: 'Dog', label: 'Flat-coated Retriever', emoji: '🐕' },
    'curly-coated_retriever': { species: 'Dog', label: 'Curly-coated Retriever', emoji: '🐕' },
    'golden_retriever': { species: 'Dog', label: 'Golden Retriever', emoji: '🐕' },
    'labrador_retriever': { species: 'Dog', label: 'Labrador Retriever', emoji: '🐕' },
    'chesapeake_bay_retriever': { species: 'Dog', label: 'Chesapeake Bay Retriever', emoji: '🐕' },
    'german_short-haired_pointer': { species: 'Dog', label: 'German Short-haired Pointer', emoji: '🐕' },
    'vizsla': { species: 'Dog', label: 'Vizsla', emoji: '🐕' },
    'english_setter': { species: 'Dog', label: 'English Setter', emoji: '🐕' },
    'irish_setter': { species: 'Dog', label: 'Irish Setter', emoji: '🐕' },
    'gordon_setter': { species: 'Dog', label: 'Gordon Setter', emoji: '🐕' },
    'brittany_spaniel': { species: 'Dog', label: 'Brittany Spaniel', emoji: '🐕' },
    'clumber': { species: 'Dog', label: 'Clumber Spaniel', emoji: '🐕' },
    'english_springer': { species: 'Dog', label: 'English Springer Spaniel', emoji: '🐕' },
    'welsh_springer_spaniel': { species: 'Dog', label: 'Welsh Springer Spaniel', emoji: '🐕' },
    'cocker_spaniel': { species: 'Dog', label: 'Cocker Spaniel', emoji: '🐕' },
    'sussex_spaniel': { species: 'Dog', label: 'Sussex Spaniel', emoji: '🐕' },
    'irish_water_spaniel': { species: 'Dog', label: 'Irish Water Spaniel', emoji: '🐕' },
    'kuvasz': { species: 'Dog', label: 'Kuvasz', emoji: '🐕' },
    'schipperke': { species: 'Dog', label: 'Schipperke', emoji: '🐕' },
    'groenendael': { species: 'Dog', label: 'Belgian Shepherd', emoji: '🐕' },
    'malinois': { species: 'Dog', label: 'Belgian Malinois', emoji: '🐕' },
    'briard': { species: 'Dog', label: 'Briard', emoji: '🐕' },
    'kelpie': { species: 'Dog', label: 'Kelpie', emoji: '🐕' },
    'komondor': { species: 'Dog', label: 'Komondor', emoji: '🐕' },
    'old_english_sheepdog': { species: 'Dog', label: 'Old English Sheepdog', emoji: '🐕' },
    'shetland_sheepdog': { species: 'Dog', label: 'Sheltie', emoji: '🐕' },
    'collie': { species: 'Dog', label: 'Collie', emoji: '🐕' },
    'border_collie': { species: 'Dog', label: 'Border Collie', emoji: '🐕' },
    'bouvier_des_flandres': { species: 'Dog', label: 'Bouvier des Flandres', emoji: '🐕' },
    'rottweiler': { species: 'Dog', label: 'Rottweiler', emoji: '🐕' },
    'german_shepherd': { species: 'Dog', label: 'German Shepherd', emoji: '🐕' },
    'doberman': { species: 'Dog', label: 'Dobermann', emoji: '🐕' },
    'miniature_pinscher': { species: 'Dog', label: 'Miniature Pinscher', emoji: '🐕' },
    'greater_swiss_mountain_dog': { species: 'Dog', label: 'Swiss Mountain Dog', emoji: '🐕' },
    'bernese_mountain_dog': { species: 'Dog', label: 'Bernese Mountain Dog', emoji: '🐕' },
    'appenzeller': { species: 'Dog', label: 'Appenzeller', emoji: '🐕' },
    'entlebucher': { species: 'Dog', label: 'Entlebucher', emoji: '🐕' },
    'boxer': { species: 'Dog', label: 'Boxer', emoji: '🐕' },
    'bull_mastiff': { species: 'Dog', label: 'Bull Mastiff', emoji: '🐕' },
    'tibetan_mastiff': { species: 'Dog', label: 'Tibetan Mastiff', emoji: '🐕' },
    'french_bulldog': { species: 'Dog', label: 'French Bulldog', emoji: '🐕' },
    'great_dane': { species: 'Dog', label: 'Great Dane', emoji: '🐕' },
    'saint_bernard': { species: 'Dog', label: 'Saint Bernard', emoji: '🐕' },
    'eskimo_dog': { species: 'Dog', label: 'Husky', emoji: '🐕' },
    'malamute': { species: 'Dog', label: 'Malamute', emoji: '🐕' },
    'siberian_husky': { species: 'Dog', label: 'Siberian Husky', emoji: '🐕' },
    'dalmatian': { species: 'Dog', label: 'Dalmatian', emoji: '🐕' },
    'affenpinscher': { species: 'Dog', label: 'Affenpinscher', emoji: '🐕' },
    'basenji': { species: 'Dog', label: 'Basenji', emoji: '🐕' },
    'pug': { species: 'Dog', label: 'Pug', emoji: '🐕' },
    'leonberg': { species: 'Dog', label: 'Leonberger', emoji: '🐕' },
    'newfoundland': { species: 'Dog', label: 'Newfoundland', emoji: '🐕' },
    'great_pyrenees': { species: 'Dog', label: 'Great Pyrenees', emoji: '🐕' },
    'samoyed': { species: 'Dog', label: 'Samoyed', emoji: '🐕' },
    'pomeranian': { species: 'Dog', label: 'Pomeranian', emoji: '🐕' },
    'chow': { species: 'Dog', label: 'Chow Chow', emoji: '🐕' },
    'keeshond': { species: 'Dog', label: 'Keeshond', emoji: '🐕' },
    'brabancon_griffon': { species: 'Dog', label: 'Brussels Griffon', emoji: '🐕' },
    'pembroke': { species: 'Dog', label: 'Pembroke Welsh Corgi', emoji: '🐕' },
    'cardigan': { species: 'Dog', label: 'Cardigan Welsh Corgi', emoji: '🐕' },
    'toy_poodle': { species: 'Dog', label: 'Toy Poodle', emoji: '🐕' },
    'miniature_poodle': { species: 'Dog', label: 'Miniature Poodle', emoji: '🐕' },
    'standard_poodle': { species: 'Dog', label: 'Standard Poodle', emoji: '🐕' },
    'dingo': { species: 'Dog', label: 'Dingo / Mixed Dog', emoji: '🐕' },
    'dhole': { species: 'Dog', label: 'Mixed Dog', emoji: '🐕' },

    // Cats
    'tabby': { species: 'Cat', label: 'Tabby Cat', emoji: '🐈' },
    'tiger_cat': { species: 'Cat', label: 'Tiger Cat', emoji: '🐈' },
    'persian_cat': { species: 'Cat', label: 'Persian Cat', emoji: '🐈' },
    'siamese_cat': { species: 'Cat', label: 'Siamese Cat', emoji: '🐈' },
    'egyptian_cat': { species: 'Cat', label: 'Egyptian Cat', emoji: '🐈' },

    // Birds
    'cock': { species: 'Bird', label: 'Rooster', emoji: '🐦' },
    'hen': { species: 'Bird', label: 'Hen', emoji: '🐦' },
    'ostrich': { species: 'Bird', label: 'Ostrich', emoji: '🐦' },
    'brambling': { species: 'Bird', label: 'Bird', emoji: '🐦' },
    'goldfinch': { species: 'Bird', label: 'Goldfinch', emoji: '🐦' },
    'house_finch': { species: 'Bird', label: 'House Finch', emoji: '🐦' },
    'junco': { species: 'Bird', label: 'Junco', emoji: '🐦' },
    'indigo_bunting': { species: 'Bird', label: 'Bunting', emoji: '🐦' },
    'robin': { species: 'Bird', label: 'Robin', emoji: '🐦' },
    'bulbul': { species: 'Bird', label: 'Bulbul', emoji: '🐦' },
    'jay': { species: 'Bird', label: 'Jay', emoji: '🐦' },
    'magpie': { species: 'Bird', label: 'Magpie', emoji: '🐦' },
    'chickadee': { species: 'Bird', label: 'Chickadee', emoji: '🐦' },
    'water_ouzel': { species: 'Bird', label: 'Water Ouzel', emoji: '🐦' },
    'kite': { species: 'Bird', label: 'Kite', emoji: '🐦' },
    'bald_eagle': { species: 'Bird', label: 'Eagle', emoji: '🦅' },
    'vulture': { species: 'Bird', label: 'Vulture', emoji: '🐦' },
    'great_grey_owl': { species: 'Bird', label: 'Owl', emoji: '🦉' },
    'european_fire_salamander': { species: 'Other', label: 'Amphibian', emoji: '🦎' },
    'common_newt': { species: 'Other', label: 'Newt', emoji: '🦎' },
    'eft': { species: 'Other', label: 'Eft', emoji: '🦎' },
    'spotted_salamander': { species: 'Other', label: 'Salamander', emoji: '🦎' },
    'axolotl': { species: 'Other', label: 'Axolotl', emoji: '🦎' },
    'bullfrog': { species: 'Other', label: 'Frog', emoji: '🐸' },
    'tree_frog': { species: 'Other', label: 'Tree Frog', emoji: '🐸' },
    'tailed_frog': { species: 'Other', label: 'Frog', emoji: '🐸' },
    'tortoise': { species: 'Other', label: 'Tortoise', emoji: '🐢' },
    'box_turtle': { species: 'Other', label: 'Turtle', emoji: '🐢' },
    'banded_gecko': { species: 'Other', label: 'Gecko', emoji: '🦎' },
    'common_iguana': { species: 'Other', label: 'Iguana', emoji: '🦎' },
    'american_chameleon': { species: 'Other', label: 'Chameleon', emoji: '🦎' },
    'whiptail': { species: 'Other', label: 'Lizard', emoji: '🦎' },
    'agama': { species: 'Other', label: 'Agama', emoji: '🦎' },
    'frilled_lizard': { species: 'Other', label: 'Frilled Lizard', emoji: '🦎' },
    'alligator_lizard': { species: 'Other', label: 'Lizard', emoji: '🦎' },
    'gila_monster': { species: 'Other', label: 'Gila Monster', emoji: '🦎' },
    'green_lizard': { species: 'Other', label: 'Lizard', emoji: '🦎' },
    'african_chameleon': { species: 'Other', label: 'Chameleon', emoji: '🦎' },
    'komodo_dragon': { species: 'Other', label: 'Monitor Lizard', emoji: '🦎' },
    'african_crocodile': { species: 'Other', label: 'Crocodile', emoji: '🐊' },
    'american_alligator': { species: 'Other', label: 'Alligator', emoji: '🐊' },
    'triceratops': { species: 'Other', label: 'Unknown', emoji: '🦎' },
    'thunder_snake': { species: 'Other', label: 'Snake', emoji: '🐍' },
    'ringneck_snake': { species: 'Other', label: 'Snake', emoji: '🐍' },
    'hognose_snake': { species: 'Other', label: 'Snake', emoji: '🐍' },
    'green_snake': { species: 'Other', label: 'Snake', emoji: '🐍' },
    'king_snake': { species: 'Other', label: 'Snake', emoji: '🐍' },
    'garter_snake': { species: 'Other', label: 'Snake', emoji: '🐍' },
    'water_snake': { species: 'Other', label: 'Snake', emoji: '🐍' },
    'vine_snake': { species: 'Other', label: 'Snake', emoji: '🐍' },
    'night_snake': { species: 'Other', label: 'Snake', emoji: '🐍' },
    'boa_constrictor': { species: 'Other', label: 'Boa Constrictor', emoji: '🐍' },
    'rock_python': { species: 'Other', label: 'Python', emoji: '🐍' },
    'indian_cobra': { species: 'Other', label: 'Cobra', emoji: '🐍' },

    // Cows / Large animals
    'ox': { species: 'Cow', label: 'Bull / Ox', emoji: '🐂' },
    'water_buffalo': { species: 'Cow', label: 'Buffalo', emoji: '🐃' },
    'bison': { species: 'Cow', label: 'Bison', emoji: '🐃' },
    'ram': { species: 'Goat', label: 'Ram', emoji: '🐏' },
    'bighorn': { species: 'Goat', label: 'Bighorn', emoji: '🐏' },
    'ibex': { species: 'Goat', label: 'Ibex', emoji: '🐐' },
    'hartebeest': { species: 'Other', label: 'Antelope', emoji: '🦌' },
    'impala': { species: 'Other', label: 'Impala', emoji: '🦌' },
    'gazelle': { species: 'Other', label: 'Gazelle', emoji: '🦌' },
    'arabian_camel': { species: 'Other', label: 'Camel', emoji: '🐪' },
    'llama': { species: 'Other', label: 'Llama', emoji: '🦙' },
    'weasel': { species: 'Other', label: 'Weasel', emoji: '🦦' },
    'mink': { species: 'Other', label: 'Mink', emoji: '🦦' },
    'polecat': { species: 'Other', label: 'Polecat', emoji: '🦦' },
    'black-footed_ferret': { species: 'Other', label: 'Ferret', emoji: '🦦' },
    'otter': { species: 'Other', label: 'Otter', emoji: '🦦' },
    'skunk': { species: 'Other', label: 'Skunk', emoji: '🦨' },
    'badger': { species: 'Other', label: 'Badger', emoji: '🦡' },
    'armadillo': { species: 'Other', label: 'Armadillo', emoji: '🐾' },
    'three-toed_sloth': { species: 'Other', label: 'Sloth', emoji: '🦥' },
    'orangutan': { species: 'Other', label: 'Orangutan', emoji: '🦧' },
    'gorilla': { species: 'Other', label: 'Gorilla', emoji: '🦍' },
    'chimpanzee': { species: 'Other', label: 'Chimpanzee', emoji: '🐒' },
    'gibbon': { species: 'Other', label: 'Monkey', emoji: '🐒' },
    'siamang': { species: 'Other', label: 'Monkey', emoji: '🐒' },
    'guenon': { species: 'Other', label: 'Monkey', emoji: '🐒' },
    'langur': { species: 'Other', label: 'Langur', emoji: '🐒' },
    'colobus': { species: 'Other', label: 'Monkey', emoji: '🐒' },
    'proboscis_monkey': { species: 'Other', label: 'Monkey', emoji: '🐒' },
    'marmoset': { species: 'Other', label: 'Marmoset', emoji: '🐒' },
    'capuchin': { species: 'Other', label: 'Capuchin', emoji: '🐒' },
    'howler_monkey': { species: 'Other', label: 'Howler Monkey', emoji: '🐒' },
    'titi': { species: 'Other', label: 'Monkey', emoji: '🐒' },
    'spider_monkey': { species: 'Other', label: 'Spider Monkey', emoji: '🐒' },
    'squirrel_monkey': { species: 'Other', label: 'Squirrel Monkey', emoji: '🐒' },
    'madagascar_cat': { species: 'Cat', label: 'Madagascar Cat', emoji: '🐈' },
    'indri': { species: 'Other', label: 'Indri', emoji: '🐒' },
    'indian_elephant': { species: 'Other', label: 'Elephant', emoji: '🐘' },
    'african_elephant': { species: 'Other', label: 'Elephant', emoji: '🐘' },
    'lesser_panda': { species: 'Other', label: 'Red Panda', emoji: '🦝' },
    'giant_panda': { species: 'Other', label: 'Giant Panda', emoji: '🐼' },
    'barracouta': { species: 'Other', label: 'Fish', emoji: '🐟' },
    'eel': { species: 'Other', label: 'Eel', emoji: '🐟' },
    'coho': { species: 'Other', label: 'Fish', emoji: '🐟' },
    'lion': { species: 'Other', label: 'Lion', emoji: '🦁' },
    'tiger': { species: 'Other', label: 'Tiger', emoji: '🐯' },
    'cheetah': { species: 'Other', label: 'Cheetah', emoji: '🐆' },
    'leopard': { species: 'Other', label: 'Leopard', emoji: '🐆' },
    'snow_leopard': { species: 'Other', label: 'Snow Leopard', emoji: '🐆' },
    'jaguar': { species: 'Other', label: 'Jaguar', emoji: '🐆' },
    'wolf': { species: 'Dog', label: 'Wolf / Dog', emoji: '🐺' },
    'red_wolf': { species: 'Dog', label: 'Wolf / Dog', emoji: '🐺' },
    'coyote': { species: 'Dog', label: 'Coyote / Mixed Dog', emoji: '🐺' },
};

// ─── Map raw MobileNet prediction labels → our categories ────────────────────
function mapPredictionToAnimal(predictions) {
    if (!predictions || predictions.length === 0) return null;

    for (const pred of predictions) {
        const rawLabel = pred.className.toLowerCase();
        // MobileNet sometimes returns "n02085620, chihuahua" — split on comma
        const parts = rawLabel.split(',');
        for (const part of parts) {
            const key = part.trim().replace(/ /g, '_').replace(/-/g, '_');
            if (LABEL_TO_CATEGORY[key]) {
                return {
                    ...LABEL_TO_CATEGORY[key],
                    confidence: Math.round(pred.probability * 100),
                    rawLabel: pred.className,
                };
            }
            // Partial match — check if any key is a substring of the label
            for (const [mapKey, mapVal] of Object.entries(LABEL_TO_CATEGORY)) {
                if (key.includes(mapKey) || mapKey.includes(key)) {
                    return {
                        ...mapVal,
                        confidence: Math.round(pred.probability * 100),
                        rawLabel: pred.className,
                    };
                }
            }
        }
    }

    // If none of the top predictions match, return the best guess as "Other"
    const top = predictions[0];
    const cleanLabel = top.className.split(',').pop().trim();
    const words = cleanLabel.split(' ');
    const isAnimalLike = words.some(w =>
        ['dog', 'cat', 'bird', 'animal', 'pet', 'puppy', 'kitten', 'rabbit', 'cow'].includes(w.toLowerCase())
    );
    if (isAnimalLike) {
        return { species: 'Other', label: cleanLabel, emoji: '🐾', confidence: Math.round(top.probability * 100), rawLabel: top.className };
    }
    return null;  // not an animal
}

// ─── The Hook ─────────────────────────────────────────────────────────────────
export function useAnimalRecognition() {
    const [result, setResult] = useState(null);   // { species, label, emoji, confidence, rawLabel }
    const [status, setStatus] = useState('idle'); // idle | loading_model | analyzing | done | error | not_animal
    const [error, setError] = useState('');
    const modelRef = useRef(null);

    const analyze = useCallback(async (imageElement) => {
        if (!imageElement) return;

        setResult(null);
        setError('');
        setStatus('loading_model');

        try {
            // Lazy-load the model once and cache it
            if (!modelRef.current) {
                const mobilenet = await import('@tensorflow-models/mobilenet');
                // Also need tfjs backend loaded
                await import('@tensorflow/tfjs');
                modelRef.current = await mobilenet.load({ version: 2, alpha: 1.0 });
            }

            setStatus('analyzing');
            const predictions = await modelRef.current.classify(imageElement, 5);
            const animal = mapPredictionToAnimal(predictions);

            if (animal) {
                setResult(animal);
                setStatus('done');
            } else {
                setStatus('not_animal');
            }
        } catch (err) {
            console.error('Animal recognition error:', err);
            setError('Recognition failed. The image may not be clear enough.');
            setStatus('error');
        }
    }, []);

    const reset = useCallback(() => {
        setResult(null);
        setStatus('idle');
        setError('');
    }, []);

    return { result, status, error, analyze, reset };
}
