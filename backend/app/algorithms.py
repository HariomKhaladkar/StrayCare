# app/algorithms.py
import math
import random
from typing import List, Dict, Any

# ═══════════════════════════════════════════════════════════════
#  FEATURE 2: PET MATCHMAKER (already existed, kept intact)
# ═══════════════════════════════════════════════════════════════

def calculate_pet_match(pet, profile: dict) -> int:
    """
    Calculates a compatibility match percentage (10-99%) between a pet and an adopter's lifestyle profile.
    """
    score = 60  # Base starting score

    pet_size = (pet.size or "").lower()
    pet_species = (pet.species or "").lower()
    pet_age = (pet.age or "").lower()

    space = profile.get("living_space", "house").lower()
    activity = profile.get("activity_level", "medium").lower()
    kids = profile.get("has_kids", False)

    # --- Space Logic ---
    if space == "apartment":
        if pet_species == "cat":
            score += 15
        elif pet_species == "dog":
            if pet_size == "small":
                score += 10
            elif pet_size == "large":
                score -= 30  # Large dogs struggle in apartments
    elif space == "house":
        if pet_species == "dog" and pet_size == "large":
            score += 15  # Houses are great for large dogs

    # --- Activity Level Logic ---
    if activity == "low":
        if pet_age in ["senior", "older"]:
            score += 20
        elif pet_age in ["baby", "puppy", "kitten", "young"]:
            score -= 20
        if pet_species == "cat":
            score += 5
    elif activity == "high":
        if pet_species == "dog":
            if pet_age in ["adult", "young"]:
                score += 15
            elif pet_age == "senior":
                score -= 15

    # --- Kids Logic ---
    if kids:
        if pet_size == "large" and pet_age not in ["senior"]:
            score -= 10
        if pet_species == "dog" and pet_size in ["medium", "large"]:
            score += 5

    # Random tiny perturbation to prevent massive ties and make percentages look dynamic/organic
    organic_variance = (pet.id % 5) - 2
    score += organic_variance

    final_score = max(15, min(99, score))
    return final_score


# ═══════════════════════════════════════════════════════════════
#  FEATURE 1: SMART NGO DISPATCH  (Haversine + weighted scoring)
# ═══════════════════════════════════════════════════════════════

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great-circle distance between two GPS coordinates
    using the Haversine formula. Returns distance in kilometres.
    """
    R = 6371.0  # Earth radius in km

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c  # distance in km


def rank_ngos_for_case(case_lat: float, case_lon: float, ngos: List[Any], active_case_counts: Dict[int, int]) -> List[Dict]:
    """
    Ranks all verified NGOs for a given case location using a weighted score:
      - Proximity (50 pts): lower distance = higher score
      - Caseload  (30 pts): fewer active cases = higher score
      - Base bonus (20 pts): all verified NGOs start with 20 pts
    
    Returns a sorted list of NGO recommendations with distance and scores.
    """
    PROXIMITY_WEIGHT = 50
    CASELOAD_WEIGHT = 30
    BASE_SCORE = 20
    MAX_SENSIBLE_DISTANCE_KM = 200  # cap distance for scoring (beyond this, score drops sharply)

    results = []

    # We need lat/lng per NGO — use a default centroid if not available
    # In a real system NGOs would register their address/coordinates.
    # Since we don't have NGO lat/lng in the DB, we'll use the test NGO's
    # location as Pune, India and perturb slightly per NGO id as a demo.
    DEFAULT_LAT = 18.5204   # Pune, India
    DEFAULT_LON = 73.8567

    for ngo in ngos:
        # Derive a pseudo-location from ngo.id (demo — in prod NGOs register coordinates)
        seed = ngo.id % 7
        ngo_lat = DEFAULT_LAT + (seed - 3) * 0.05
        ngo_lon = DEFAULT_LON + (seed - 3) * 0.07

        dist_km = haversine_distance(case_lat, case_lon, ngo_lat, ngo_lon)

        # --- Proximity Score (0-50) ---
        # Max 50 pts at 0 km, 0 pts at MAX_SENSIBLE_DISTANCE_KM
        proximity_score = max(0, PROXIMITY_WEIGHT * (1 - dist_km / MAX_SENSIBLE_DISTANCE_KM))

        # --- Caseload Score (0-30) ---
        # Max 30 pts at 0 active cases, 0 pts at 10+ active cases
        active_count = active_case_counts.get(ngo.id, 0)
        caseload_score = max(0, CASELOAD_WEIGHT * (1 - active_count / 10))

        total_score = BASE_SCORE + proximity_score + caseload_score

        results.append({
            "ngo_id": ngo.id,
            "ngo_name": ngo.name,
            "ngo_email": ngo.email,
            "distance_km": round(dist_km, 2),
            "active_cases": active_count,
            "proximity_score": round(proximity_score, 1),
            "caseload_score": round(caseload_score, 1),
            "total_score": round(total_score, 1),
        })

    # Sort by total_score descending (best match first)
    results.sort(key=lambda x: x["total_score"], reverse=True)
    return results


# ═══════════════════════════════════════════════════════════════
#  FEATURE 3: CASE SEVERITY TRIAGING  (NLP keyword scoring)
# ═══════════════════════════════════════════════════════════════

# Keyword → severity point mapping
_CRITICAL_KEYWORDS = [
    "bleeding", "blood", "unconscious", "hit by car", "run over", "paralyzed",
    "broken bone", "seizure", "seized", "not breathing", "dying", "dead",
    "crushed", "severe injury", "critical", "emergency", "maggots", "mauled",
    "road accident", "fractured", "neck injury", "head injury"
]

_HIGH_KEYWORDS = [
    "injured", "wound", "attacked", "poisoned", "trapped", "can't move",
    "cannot move", "limb", "bite", "bitten", "infection", "vomiting blood",
    "shivering", "convulsing", "whimpering", "hit", "accident", "pain", "screaming"
]

_MODERATE_KEYWORDS = [
    "limping", "sick", "thin", "malnourished", "hungry", "lost", "stray",
    "dirty", "mange", "scabies", "eye infection", "vomiting", "diarrhea",
    "lethargic", "weak", "abandoned", "scared", "shaking", "cold"
]


def calculate_severity_score(description: str) -> Dict[str, Any]:
    """
    Analyses the case description text using weighted keyword matching to
    assign an emergency severity score and label.

    Returns:
        {
            "score": int,
            "label": "Critical" | "High" | "Moderate" | "Low",
            "color": "#hex",
            "matched_keywords": [str]
        }
    """
    text = description.lower()
    score = 0
    matched_keywords = []

    for kw in _CRITICAL_KEYWORDS:
        if kw in text:
            score += 100
            matched_keywords.append(kw)

    for kw in _HIGH_KEYWORDS:
        if kw in text:
            score += 60
            matched_keywords.append(kw)

    for kw in _MODERATE_KEYWORDS:
        if kw in text:
            score += 30
            matched_keywords.append(kw)

    # Determine label and color
    if score >= 100:
        label = "Critical"
        color = "#ef4444"   # red
    elif score >= 60:
        label = "High"
        color = "#f97316"   # orange
    elif score >= 30:
        label = "Moderate"
        color = "#eab308"   # yellow
    else:
        label = "Low"
        color = "#22c55e"   # green

    return {
        "score": score,
        "label": label,
        "color": color,
        "matched_keywords": list(set(matched_keywords))
    }


# ═══════════════════════════════════════════════════════════════
#  FEATURE 4: ZONE RED HOTSPOT MAP  (K-Means Clustering)
# ═══════════════════════════════════════════════════════════════

def _euclidean_distance(p1: Dict, p2: Dict) -> float:
    """Simple Euclidean distance on lat/lon for clustering purposes."""
    return math.sqrt((p1["lat"] - p2["lat"]) ** 2 + (p1["lon"] - p2["lon"]) ** 2)


def _assign_clusters(points: List[Dict], centroids: List[Dict]) -> List[int]:
    """Assigns each point to the nearest centroid. Returns list of cluster indices."""
    assignments = []
    for p in points:
        closest = min(range(len(centroids)), key=lambda i: _euclidean_distance(p, centroids[i]))
        assignments.append(closest)
    return assignments


def _compute_centroids(points: List[Dict], assignments: List[int], k: int) -> List[Dict]:
    """Recomputes centroid positions as the mean of all assigned points."""
    new_centroids = []
    for i in range(k):
        cluster_points = [p for p, a in zip(points, assignments) if a == i]
        if cluster_points:
            avg_lat = sum(p["lat"] for p in cluster_points) / len(cluster_points)
            avg_lon = sum(p["lon"] for p in cluster_points) / len(cluster_points)
            new_centroids.append({"lat": avg_lat, "lon": avg_lon})
        else:
            # Empty cluster — keep old centroid
            new_centroids.append(new_centroids[i] if i < len(new_centroids) else points[0])
    return new_centroids


def cluster_case_hotspots(cases: List[Dict], k: int = 5, max_iterations: int = 20) -> List[Dict]:
    """
    Runs K-Means clustering on a list of {lat, lon, ...} case dicts.
    Returns a list of cluster centers with case counts and risk levels.

    Risk level is mapped from cluster size:
      - >= 10 cases: "Critical Zone"
      - >= 5 cases:  "High Zone"
      - >= 2 cases:  "Moderate Zone"
      - 1 case:      "Low Zone"
    """
    if not cases:
        return []

    # Filter out cases without valid coordinates
    points = [{"lat": c["lat"], "lon": c["lon"], "id": c.get("id")} for c in cases
              if c.get("lat") is not None and c.get("lon") is not None]

    if len(points) == 0:
        return []

    # If fewer points than k, reduce k
    k = min(k, len(points))

    # --- Initialise centroids using random points (K-Means++) style seed ---
    random.seed(42)  # Fixed seed for reproducibility
    centroid_indices = random.sample(range(len(points)), k)
    centroids = [{"lat": points[i]["lat"], "lon": points[i]["lon"]} for i in centroid_indices]

    assignments = []
    for _ in range(max_iterations):
        new_assignments = _assign_clusters(points, centroids)
        if new_assignments == assignments:
            break  # Converged
        assignments = new_assignments
        centroids = _compute_centroids(points, assignments, k)

    # Build result: each cluster -> center lat/lon + count + risk level
    results = []
    for i, centroid in enumerate(centroids):
        count = assignments.count(i)
        if count == 0:
            continue

        if count >= 10:
            risk = "Critical Zone"
            color = "#ef4444"
            radius = 800
        elif count >= 5:
            risk = "High Zone"
            color = "#f97316"
            radius = 500
        elif count >= 2:
            risk = "Moderate Zone"
            color = "#eab308"
            radius = 300
        else:
            risk = "Low Zone"
            color = "#22c55e"
            radius = 150

        results.append({
            "lat": round(centroid["lat"], 6),
            "lon": round(centroid["lon"], 6),
            "case_count": count,
            "risk_level": risk,
            "color": color,
            "radius_m": radius,
        })

    # Sort by case_count desc (most dangerous zones first)
    results.sort(key=lambda x: x["case_count"], reverse=True)
    return results
