from datetime import datetime, date, timedelta, timezone
from models import *
import uuid

# Generate unique IDs
def gen_id():
    return str(uuid.uuid4())

# Helper to convert date to string
def date_to_str(d):
    if isinstance(d, datetime):
        return d.date().isoformat()
    elif isinstance(d, date):
        return d.isoformat()
    return d

# Current professional (demo account)
CURRENT_PROFESSIONAL_ID = "pro-lea-dubois"
CURRENT_PROFESSIONAL_PASSWORD = "demo123"  # Hashed version will be stored

# Professional
demo_professional = {
    "id": CURRENT_PROFESSIONAL_ID,
    "first_name": "Léa",
    "last_name": "Dubois",
    "profession": "Éducatrice spécialisée",
    "specialty": "Accompagnement TSA",
    "email": "lea.dubois@passerelle.fr",
    "phone": "06 12 34 56 78",
    "avatar_url": "https://images.unsplash.com/photo-1733685318562-c726472bc1db?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHwzfHxmcmllbmRseSUyMHRoZXJhcGlzdCUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDB8fHx8MTc3Mjg5NzU2NHww&ixlib=rb-4.1.0&q=85",
    "description": "Éducatrice spécialisée libérale, spécialisée dans l'accompagnement des enfants avec TSA",
    "has_passerelle_account": True,
    "created_at": datetime.now(timezone.utc),
    "updated_at": datetime.now(timezone.utc),
    "password_hash": ""  # Will be set during initialization
}

# Other professionals
other_professionals = [
    {
        "id": "pro-marie-laurent",
        "first_name": "Marie",
        "last_name": "Laurent",
        "profession": "Orthophoniste",
        "specialty": "Troubles du langage",
        "email": "marie.laurent@passerelle.fr",
        "phone": "06 23 45 67 89",
        "avatar_url": "https://images.unsplash.com/photo-1703798462992-3d0a0cb44682?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHwyfHxmcmllbmRseSUyMHRoZXJhcGlzdCUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDB8fHx8MTc3Mjg5NzU2NHww&ixlib=rb-4.1.0&q=85",
        "description": "Orthophoniste spécialisée en troubles du langage chez l'enfant",
        "has_passerelle_account": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    },
    {
        "id": "pro-thomas-moreau",
        "first_name": "Thomas",
        "last_name": "Moreau",
        "profession": "Psychomotricien",
        "specialty": None,
        "email": "thomas.moreau@passerelle.fr",
        "phone": None,
        "avatar_url": None,
        "description": None,
        "has_passerelle_account": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    },
    {
        "id": "pro-sophie-bernard",
        "first_name": "Sophie",
        "last_name": "Bernard",
        "profession": "Psychologue",
        "specialty": "Neuropsychologie",
        "email": "sophie.bernard@exemple.fr",
        "phone": None,
        "avatar_url": None,
        "description": None,
        "has_passerelle_account": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
]

# Parents
parents = [
    {
        "id": "parent-claire-martin",
        "first_name": "Claire",
        "last_name": "Martin",
        "email": "claire.martin@email.fr",
        "phone": "06 34 56 78 90",
        "relationship_to_child": "Mère",
        "avatar_url": None
    },
    {
        "id": "parent-julie-petit",
        "first_name": "Julie",
        "last_name": "Petit",
        "email": "julie.petit@email.fr",
        "phone": "06 45 67 89 01",
        "relationship_to_child": "Mère",
        "avatar_url": None
    },
    {
        "id": "parent-david-rousseau",
        "first_name": "David",
        "last_name": "Rousseau",
        "email": "david.rousseau@email.fr",
        "phone": "06 56 78 90 12",
        "relationship_to_child": "Père",
        "avatar_url": None
    },
    {
        "id": "parent-laura-blanc",
        "first_name": "Laura",
        "last_name": "Blanc",
        "email": "laura.blanc@email.fr",
        "phone": "06 67 89 01 23",
        "relationship_to_child": "Mère",
        "avatar_url": None
    }
]

# Children
children = [
    {
        "id": "child-lucas-martin",
        "first_name": "Lucas",
        "last_name": "Martin",
        "birth_date": "2017-03-15",
        "age": 7,
        "photo_url": "https://images.unsplash.com/photo-1508431640151-f2217ef26c31?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGRpdmVyc2UlMjBjaGlsZCUyMHBsYXlpbmd8ZW58MHx8fHwxNzcyODk3NTY1fDA&ixlib=rb-4.1.0&q=85",
        "address": "15 rue des Lilas, 75015 Paris",
        "housing_type": "Appartement",
        "own_bedroom": True,
        "siblings_count": 1,
        "parents_separated": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    },
    {
        "id": "child-emma-petit",
        "first_name": "Emma",
        "last_name": "Petit",
        "birth_date": "2018-07-22",
        "age": 6,
        "photo_url": "https://images.unsplash.com/photo-1769505313275-c8c9eb934811?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwzfHxoYXBweSUyMGRpdmVyc2UlMjBjaGlsZCUyMHBsYXlpbmd8ZW58MHx8fHwxNzcyODk3NTY1fDA&ixlib=rb-4.1.0&q=85",
        "address": "8 avenue Victor Hugo, 92100 Boulogne-Billancourt",
        "housing_type": "Maison",
        "own_bedroom": True,
        "siblings_count": 0,
        "parents_separated": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    },
    {
        "id": "child-noah-rousseau",
        "first_name": "Noah",
        "last_name": "Rousseau",
        "birth_date": "2016-11-08",
        "age": 8,
        "photo_url": "https://images.unsplash.com/photo-1759831268463-6809e1d67d27?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwyfHxoYXBweSUyMGRpdmVyc2UlMjBjaGlsZCUyMHBsYXlpbmd8ZW58MHx8fHwxNzcyODk3NTY1fDA&ixlib=rb-4.1.0&q=85",
        "address": "25 rue du Commerce, 75015 Paris",
        "housing_type": "Appartement",
        "own_bedroom": False,
        "siblings_count": 2,
        "parents_separated": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    },
    {
        "id": "child-lea-blanc",
        "first_name": "Léa",
        "last_name": "Blanc",
        "birth_date": "2019-02-14",
        "age": 5,
        "photo_url": None,
        "address": "42 boulevard Raspail, 75006 Paris",
        "housing_type": "Appartement",
        "own_bedroom": True,
        "siblings_count": 1,
        "parents_separated": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
]

# Child-Parent relationships (for reference)
child_parent_map = {
    "child-lucas-martin": "parent-claire-martin",
    "child-emma-petit": "parent-julie-petit",
    "child-noah-rousseau": "parent-david-rousseau",
    "child-lea-blanc": "parent-laura-blanc"
}

# Child Schooling
children_schooling = [
    {
        "id": gen_id(),
        "child_id": "child-lucas-martin",
        "is_schooled_or_institution": True,
        "schooling_description": "Scolarisé en CE1 avec accompagnement AESH",
        "school_name": "École élémentaire Jules Ferry",
        "schooling_type": "Scolarisation ordinaire avec AESH"
    },
    {
        "id": gen_id(),
        "child_id": "child-emma-petit",
        "is_schooled_or_institution": True,
        "schooling_description": "Scolarisée en grande section de maternelle",
        "school_name": "École maternelle Saint-Exupéry",
        "schooling_type": "Scolarisation ordinaire"
    },
    {
        "id": gen_id(),
        "child_id": "child-noah-rousseau",
        "is_schooled_or_institution": True,
        "schooling_description": "Scolarisé en CE2 avec dispositif ULIS",
        "school_name": "École élémentaire Pasteur",
        "schooling_type": "ULIS"
    },
    {
        "id": gen_id(),
        "child_id": "child-lea-blanc",
        "is_schooled_or_institution": True,
        "schooling_description": "Scolarisée en moyenne section",
        "school_name": "École maternelle Les Peupliers",
        "schooling_type": "Scolarisation ordinaire"
    }
]

# Child-Professional Links
child_professional_links = [
    # Lucas Martin
    {"id": gen_id(), "child_id": "child-lucas-martin", "professional_id": CURRENT_PROFESSIONAL_ID, "role_label": "Éducatrice spécialisée", "active": True},
    {"id": gen_id(), "child_id": "child-lucas-martin", "professional_id": "pro-marie-laurent", "role_label": "Orthophoniste", "active": True},
    {"id": gen_id(), "child_id": "child-lucas-martin", "professional_id": "pro-thomas-moreau", "role_label": "Psychomotricien", "active": True},
    # Emma Petit
    {"id": gen_id(), "child_id": "child-emma-petit", "professional_id": CURRENT_PROFESSIONAL_ID, "role_label": "Éducatrice spécialisée", "active": True},
    {"id": gen_id(), "child_id": "child-emma-petit", "professional_id": "pro-marie-laurent", "role_label": "Orthophoniste", "active": True},
    # Noah Rousseau
    {"id": gen_id(), "child_id": "child-noah-rousseau", "professional_id": CURRENT_PROFESSIONAL_ID, "role_label": "Éducatrice spécialisée", "active": True},
    {"id": gen_id(), "child_id": "child-noah-rousseau", "professional_id": "pro-sophie-bernard", "role_label": "Psychologue", "active": True},
    # Léa Blanc
    {"id": gen_id(), "child_id": "child-lea-blanc", "professional_id": CURRENT_PROFESSIONAL_ID, "role_label": "Éducatrice spécialisée", "active": True},
]

# Medical Profiles
medical_profiles = [
    {
        "id": gen_id(),
        "child_id": "child-lucas-martin",
        "treatment_active": False,
        "treatment_details": None,
        "orthophonist_active": True,
        "orthophonist_frequency": "2 fois par semaine",
        "psychologist_active": False,
        "psychologist_frequency": None,
        "psychomotor_active": True,
        "psychomotor_frequency": "1 fois par semaine",
        "occupational_therapist_active": False,
        "occupational_therapist_frequency": None,
        "sessad_active": False,
        "sessad_frequency": None,
        "other_professionals": "Éducatrice spécialisée 3 fois par semaine"
    },
    {
        "id": gen_id(),
        "child_id": "child-emma-petit",
        "treatment_active": False,
        "treatment_details": None,
        "orthophonist_active": True,
        "orthophonist_frequency": "1 fois par semaine",
        "psychologist_active": False,
        "psychologist_frequency": None,
        "psychomotor_active": False,
        "psychomotor_frequency": None,
        "occupational_therapist_active": False,
        "occupational_therapist_frequency": None,
        "sessad_active": False,
        "sessad_frequency": None,
        "other_professionals": "Éducatrice spécialisée 2 fois par semaine"
    },
    {
        "id": gen_id(),
        "child_id": "child-noah-rousseau",
        "treatment_active": True,
        "treatment_details": "Traitement pour trouble de l'attention",
        "orthophonist_active": False,
        "orthophonist_frequency": None,
        "psychologist_active": True,
        "psychologist_frequency": "1 fois toutes les 2 semaines",
        "psychomotor_active": False,
        "psychomotor_frequency": None,
        "occupational_therapist_active": False,
        "occupational_therapist_frequency": None,
        "sessad_active": True,
        "sessad_frequency": "Suivi hebdomadaire",
        "other_professionals": "Éducatrice spécialisée 3 fois par semaine"
    },
    {
        "id": gen_id(),
        "child_id": "child-lea-blanc",
        "treatment_active": False,
        "treatment_details": None,
        "orthophonist_active": False,
        "orthophonist_frequency": None,
        "psychologist_active": False,
        "psychologist_frequency": None,
        "psychomotor_active": False,
        "psychomotor_frequency": None,
        "occupational_therapist_active": False,
        "occupational_therapist_frequency": None,
        "sessad_active": False,
        "sessad_frequency": None,
        "other_professionals": "Éducatrice spécialisée 2 fois par semaine"
    }
]

# Communication Profiles
communication_profiles = [
    {
        "id": gen_id(),
        "child_id": "child-lucas-martin",
        "communication_type": "verbal",
        "alternative_communication_details": None,
        "comprehension_level": "Bonne compréhension des consignes simples",
        "notes": "Langage verbal en développement, phrases courtes"
    },
    {
        "id": gen_id(),
        "child_id": "child-emma-petit",
        "communication_type": "alternatif",
        "alternative_communication_details": "Utilisation de pictogrammes PECS",
        "comprehension_level": "Compréhension variable selon le contexte",
        "notes": "Communication principalement par gestes et pictogrammes"
    },
    {
        "id": gen_id(),
        "child_id": "child-noah-rousseau",
        "communication_type": "verbal",
        "alternative_communication_details": None,
        "comprehension_level": "Très bonne compréhension",
        "notes": "S'exprime bien oralement, vocabulaire riche"
    },
    {
        "id": gen_id(),
        "child_id": "child-lea-blanc",
        "communication_type": "non_verbal",
        "alternative_communication_details": "Début d'utilisation de tablette de communication",
        "comprehension_level": "Compréhension des consignes simples avec support visuel",
        "notes": "Communication non verbale, quelques vocalises"
    }
]

# Goals
goals = [
    {
        "id": gen_id(),
        "child_id": "child-lucas-martin",
        "autonomy": "Développer l'autonomie dans les gestes du quotidien (habillage, repas)",
        "toilet_training": "Acquisition de la propreté diurne en cours",
        "socialization": "Favoriser les interactions avec les pairs",
        "emotions": "Apprendre à identifier et exprimer ses émotions",
        "language_communication": "Enrichir le vocabulaire et construire des phrases complexes",
        "motor_skills": "Améliorer la motricité fine",
        "environment_support": "Aménagement de l'environnement scolaire",
        "other_goals": None
    },
    {
        "id": gen_id(),
        "child_id": "child-emma-petit",
        "autonomy": "Développer l'autonomie au repas",
        "toilet_training": "Propreté diurne acquise, travail sur la propreté nocturne",
        "socialization": "Initier le contact avec les autres enfants",
        "emotions": "Travail sur la régulation émotionnelle",
        "language_communication": "Développer la communication par pictogrammes",
        "motor_skills": None,
        "environment_support": "Environnement structuré et prévisible",
        "other_goals": "Améliorer la tolérance aux changements"
    },
    {
        "id": gen_id(),
        "child_id": "child-noah-rousseau",
        "autonomy": "Autonomie globalement acquise",
        "toilet_training": "Propreté acquise",
        "socialization": "Développer les compétences sociales et la gestion des conflits",
        "emotions": "Mieux gérer la frustration",
        "language_communication": "Travail sur la pragmatique du langage",
        "motor_skills": None,
        "environment_support": None,
        "other_goals": "Améliorer l'attention et la concentration"
    },
    {
        "id": gen_id(),
        "child_id": "child-lea-blanc",
        "autonomy": "Début du travail sur l'autonomie au repas",
        "toilet_training": "Début de l'apprentissage de la propreté",
        "socialization": "Tolérer la présence d'autres enfants",
        "emotions": "Identifier les émotions de base",
        "language_communication": "Développer la communication alternative",
        "motor_skills": "Améliorer la motricité globale",
        "environment_support": "Environnement calme et sécurisant",
        "other_goals": None
    }
]

# Additional Info
additional_infos = [
    {
        "id": gen_id(),
        "child_id": "child-lucas-martin",
        "interests": "Dinosaures, trains",
        "passions": "Tout ce qui roule",
        "favorite_character": "Cars",
        "food_notes": "Mange varié",
        "allergies": "Aucune",
        "habits": "Aime les routines stables",
        "special_situations": None,
        "free_notes": "Sensible aux bruits forts"
    },
    {
        "id": gen_id(),
        "child_id": "child-emma-petit",
        "interests": "Animaux, dessins animés",
        "passions": "Les chats",
        "favorite_character": "Peppa Pig",
        "food_notes": "Sélective, préfère les textures lisses",
        "allergies": "Allergie aux arachides",
        "habits": "Besoin de transitions prévisibles",
        "special_situations": "Peut avoir des crises lors de changements imprévus",
        "free_notes": "Apaisée par la musique douce"
    },
    {
        "id": gen_id(),
        "child_id": "child-noah-rousseau",
        "interests": "Jeux vidéo, lecture",
        "passions": "Minecraft",
        "favorite_character": "Mario",
        "food_notes": "Bon appétit",
        "allergies": "Aucune",
        "habits": "Aime les moments calmes",
        "special_situations": None,
        "free_notes": "Très curieux, pose beaucoup de questions"
    },
    {
        "id": gen_id(),
        "child_id": "child-lea-blanc",
        "interests": "Bulles, lumières",
        "passions": "Les objets qui tournent",
        "favorite_character": None,
        "food_notes": "Très sélective, textures mixées uniquement",
        "allergies": "Aucune",
        "habits": "Besoin de beaucoup de repos",
        "special_situations": "Hypersensibilité sensorielle",
        "free_notes": "Apaisée par les balancoires"
    }
]

# Family Contacts
family_contacts = [
    {
        "id": gen_id(),
        "child_id": "child-lucas-martin",
        "parent1_name": "Claire Martin",
        "parent1_phone": "06 34 56 78 90",
        "parent1_email": "claire.martin@email.fr",
        "parent2_name": "Pierre Martin",
        "parent2_phone": "06 78 90 12 34",
        "parent2_email": "pierre.martin@email.fr"
    },
    {
        "id": gen_id(),
        "child_id": "child-emma-petit",
        "parent1_name": "Julie Petit",
        "parent1_phone": "06 45 67 89 01",
        "parent1_email": "julie.petit@email.fr",
        "parent2_name": "Marc Petit",
        "parent2_phone": "06 89 01 23 45",
        "parent2_email": "marc.petit@email.fr"
    },
    {
        "id": gen_id(),
        "child_id": "child-noah-rousseau",
        "parent1_name": "David Rousseau",
        "parent1_phone": "06 56 78 90 12",
        "parent1_email": "david.rousseau@email.fr",
        "parent2_name": "Sophie Rousseau",
        "parent2_phone": "06 90 12 34 56",
        "parent2_email": "sophie.rousseau@email.fr"
    },
    {
        "id": gen_id(),
        "child_id": "child-lea-blanc",
        "parent1_name": "Laura Blanc",
        "parent1_phone": "06 67 89 01 23",
        "parent1_email": "laura.blanc@email.fr",
        "parent2_name": "Thomas Blanc",
        "parent2_phone": "06 01 23 45 67",
        "parent2_email": "thomas.blanc@email.fr"
    }
]

# Weekly Schedules for children
now = datetime.now(timezone.utc)
weekly_schedules = [
    # Lucas - Lundi
    {"id": gen_id(), "child_id": "child-lucas-martin", "day_of_week": "lundi", "start_time": "08:30", "end_time": "16:30", "label": "École", "category": "ecole", "notes": None, "related_professional_id": None, "location": "École Jules Ferry"},
    {"id": gen_id(), "child_id": "child-lucas-martin", "day_of_week": "lundi", "start_time": "17:00", "end_time": "18:00", "label": "Éducatrice spécialisée", "category": "soin", "notes": None, "related_professional_id": CURRENT_PROFESSIONAL_ID, "location": "Domicile"},
    # Lucas - Mardi
    {"id": gen_id(), "child_id": "child-lucas-martin", "day_of_week": "mardi", "start_time": "08:30", "end_time": "16:30", "label": "École", "category": "ecole", "notes": None, "related_professional_id": None, "location": "École Jules Ferry"},
    {"id": gen_id(), "child_id": "child-lucas-martin", "day_of_week": "mardi", "start_time": "17:00", "end_time": "17:45", "label": "Orthophoniste", "category": "soin", "notes": None, "related_professional_id": "pro-marie-laurent", "location": "Cabinet"},
    # Lucas - Mercredi
    {"id": gen_id(), "child_id": "child-lucas-martin", "day_of_week": "mercredi", "start_time": "10:00", "end_time": "10:45", "label": "Psychomotricien", "category": "soin", "notes": None, "related_professional_id": "pro-thomas-moreau", "location": "Cabinet"},
    {"id": gen_id(), "child_id": "child-lucas-martin", "day_of_week": "mercredi", "start_time": "14:00", "end_time": "15:00", "label": "Éducatrice spécialisée", "category": "soin", "notes": None, "related_professional_id": CURRENT_PROFESSIONAL_ID, "location": "Domicile"},
    # Lucas - Jeudi
    {"id": gen_id(), "child_id": "child-lucas-martin", "day_of_week": "jeudi", "start_time": "08:30", "end_time": "16:30", "label": "École", "category": "ecole", "notes": None, "related_professional_id": None, "location": "École Jules Ferry"},
    {"id": gen_id(), "child_id": "child-lucas-martin", "day_of_week": "jeudi", "start_time": "17:00", "end_time": "17:45", "label": "Orthophoniste", "category": "soin", "notes": None, "related_professional_id": "pro-marie-laurent", "location": "Cabinet"},
    # Lucas - Vendredi
    {"id": gen_id(), "child_id": "child-lucas-martin", "day_of_week": "vendredi", "start_time": "08:30", "end_time": "16:30", "label": "École", "category": "ecole", "notes": None, "related_professional_id": None, "location": "École Jules Ferry"},
    {"id": gen_id(), "child_id": "child-lucas-martin", "day_of_week": "vendredi", "start_time": "17:00", "end_time": "18:00", "label": "Éducatrice spécialisée", "category": "soin", "notes": None, "related_professional_id": CURRENT_PROFESSIONAL_ID, "location": "Domicile"},
    
    # Emma - Lundi
    {"id": gen_id(), "child_id": "child-emma-petit", "day_of_week": "lundi", "start_time": "08:45", "end_time": "16:00", "label": "École", "category": "ecole", "notes": None, "related_professional_id": None, "location": "École Saint-Exupéry"},
    # Emma - Mardi
    {"id": gen_id(), "child_id": "child-emma-petit", "day_of_week": "mardi", "start_time": "08:45", "end_time": "16:00", "label": "École", "category": "ecole", "notes": None, "related_professional_id": None, "location": "École Saint-Exupéry"},
    {"id": gen_id(), "child_id": "child-emma-petit", "day_of_week": "mardi", "start_time": "16:30", "end_time": "17:30", "label": "Éducatrice spécialisée", "category": "soin", "notes": None, "related_professional_id": CURRENT_PROFESSIONAL_ID, "location": "Domicile"},
    # Emma - Mercredi
    {"id": gen_id(), "child_id": "child-emma-petit", "day_of_week": "mercredi", "start_time": "09:30", "end_time": "10:15", "label": "Orthophoniste", "category": "soin", "notes": None, "related_professional_id": "pro-marie-laurent", "location": "Cabinet"},
    # Emma - Jeudi
    {"id": gen_id(), "child_id": "child-emma-petit", "day_of_week": "jeudi", "start_time": "08:45", "end_time": "16:00", "label": "École", "category": "ecole", "notes": None, "related_professional_id": None, "location": "École Saint-Exupéry"},
    {"id": gen_id(), "child_id": "child-emma-petit", "day_of_week": "jeudi", "start_time": "16:30", "end_time": "17:30", "label": "Éducatrice spécialisée", "category": "soin", "notes": None, "related_professional_id": CURRENT_PROFESSIONAL_ID, "location": "Domicile"},
    # Emma - Vendredi
    {"id": gen_id(), "child_id": "child-emma-petit", "day_of_week": "vendredi", "start_time": "08:45", "end_time": "16:00", "label": "École", "category": "ecole", "notes": None, "related_professional_id": None, "location": "École Saint-Exupéry"},
]

# Appointments (upcoming and recent)
today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
appointments = [
    # Today
    {
        "id": gen_id(),
        "child_id": "child-emma-petit",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "title": "Séance éducative",
        "appointment_type": "Éducation spécialisée",
        "start_datetime": today.replace(hour=16, minute=30),
        "end_datetime": today.replace(hour=17, minute=30),
        "location": "Domicile",
        "notes": None,
        "status": "planifie"
    },
    # Tomorrow
    {
        "id": gen_id(),
        "child_id": "child-lucas-martin",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "title": "Séance éducative",
        "appointment_type": "Éducation spécialisée",
        "start_datetime": (today + timedelta(days=1)).replace(hour=17, minute=0),
        "end_datetime": (today + timedelta(days=1)).replace(hour=18, minute=0),
        "location": "Domicile",
        "notes": None,
        "status": "planifie"
    },
    # In 2 days
    {
        "id": gen_id(),
        "child_id": "child-lucas-martin",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "title": "Séance éducative",
        "appointment_type": "Éducation spécialisée",
        "start_datetime": (today + timedelta(days=2)).replace(hour=14, minute=0),
        "end_datetime": (today + timedelta(days=2)).replace(hour=15, minute=0),
        "location": "Domicile",
        "notes": None,
        "status": "planifie"
    },
    # In 3 days
    {
        "id": gen_id(),
        "child_id": "child-emma-petit",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "title": "Séance éducative",
        "appointment_type": "Éducation spécialisée",
        "start_datetime": (today + timedelta(days=3)).replace(hour=16, minute=30),
        "end_datetime": (today + timedelta(days=3)).replace(hour=17, minute=30),
        "location": "Domicile",
        "notes": None,
        "status": "planifie"
    },
    # In 5 days
    {
        "id": gen_id(),
        "child_id": "child-lucas-martin",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "title": "Séance éducative",
        "appointment_type": "Éducation spécialisée",
        "start_datetime": (today + timedelta(days=5)).replace(hour=17, minute=0),
        "end_datetime": (today + timedelta(days=5)).replace(hour=18, minute=0),
        "location": "Domicile",
        "notes": None,
        "status": "planifie"
    },
    # Last week (completed)
    {
        "id": gen_id(),
        "child_id": "child-noah-rousseau",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "title": "Séance éducative",
        "appointment_type": "Éducation spécialisée",
        "start_datetime": (today - timedelta(days=3)).replace(hour=15, minute=0),
        "end_datetime": (today - timedelta(days=3)).replace(hour=16, minute=0),
        "location": "Domicile",
        "notes": None,
        "status": "termine"
    }
]

# Conversations
conversations = [
    {
        "id": "conv-lucas",
        "child_id": "child-lucas-martin",
        "parent_id": "parent-claire-martin",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "last_message_at": datetime.now(timezone.utc) - timedelta(hours=2),
        "created_at": datetime.now(timezone.utc) - timedelta(days=30)
    },
    {
        "id": "conv-emma",
        "child_id": "child-emma-petit",
        "parent_id": "parent-julie-petit",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "last_message_at": datetime.now(timezone.utc) - timedelta(hours=5),
        "created_at": datetime.now(timezone.utc) - timedelta(days=25)
    },
    {
        "id": "conv-noah",
        "child_id": "child-noah-rousseau",
        "parent_id": "parent-david-rousseau",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "last_message_at": datetime.now(timezone.utc) - timedelta(days=1),
        "created_at": datetime.now(timezone.utc) - timedelta(days=20)
    },
    {
        "id": "conv-lea",
        "child_id": "child-lea-blanc",
        "parent_id": "parent-laura-blanc",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "last_message_at": datetime.now(timezone.utc) - timedelta(days=3),
        "created_at": datetime.now(timezone.utc) - timedelta(days=15)
    }
]

# Messages
messages = [
    # Conversation Lucas
    {"id": gen_id(), "conversation_id": "conv-lucas", "sender_type": "parent", "sender_id": "parent-claire-martin", "content": "Bonjour Léa, Lucas a très bien travaillé cette semaine. Il progresse vraiment !", "has_attachment": False, "created_at": datetime.now(timezone.utc) - timedelta(hours=3), "read_at": datetime.now(timezone.utc) - timedelta(hours=2, minutes=30)},
    {"id": gen_id(), "conversation_id": "conv-lucas", "sender_type": "professional", "sender_id": CURRENT_PROFESSIONAL_ID, "content": "Merci pour ce retour ! Oui, je vois aussi de beaux progrès. Il est de plus en plus à l'aise avec les consignes.", "has_attachment": False, "created_at": datetime.now(timezone.utc) - timedelta(hours=2), "read_at": None},
    # Conversation Emma
    {"id": gen_id(), "conversation_id": "conv-emma", "sender_type": "professional", "sender_id": CURRENT_PROFESSIONAL_ID, "content": "Bonjour Julie, voici le compte rendu de la séance d'aujourd'hui.", "has_attachment": True, "created_at": datetime.now(timezone.utc) - timedelta(hours=6), "read_at": datetime.now(timezone.utc) - timedelta(hours=5, minutes=30)},
    {"id": gen_id(), "conversation_id": "conv-emma", "sender_type": "parent", "sender_id": "parent-julie-petit", "content": "Merci beaucoup ! Je vais le lire ce soir.", "has_attachment": False, "created_at": datetime.now(timezone.utc) - timedelta(hours=5), "read_at": None},
    # Conversation Noah
    {"id": gen_id(), "conversation_id": "conv-noah", "sender_type": "parent", "sender_id": "parent-david-rousseau", "content": "Bonjour, pourrions-nous décaler la séance de mercredi prochain ?", "has_attachment": False, "created_at": datetime.now(timezone.utc) - timedelta(days=1), "read_at": None},
    # Conversation Léa
    {"id": gen_id(), "conversation_id": "conv-lea", "sender_type": "professional", "sender_id": CURRENT_PROFESSIONAL_ID, "content": "Bonjour Laura, Léa était très apaisée aujourd'hui. Les bulles fonctionnent toujours aussi bien !", "has_attachment": False, "created_at": datetime.now(timezone.utc) - timedelta(days=3), "read_at": datetime.now(timezone.utc) - timedelta(days=3, hours=-2)},
    {"id": gen_id(), "conversation_id": "conv-lea", "sender_type": "parent", "sender_id": "parent-laura-blanc", "content": "C'est super ! Merci pour votre accompagnement.", "has_attachment": False, "created_at": datetime.now(timezone.utc) - timedelta(days=3, hours=-1), "read_at": datetime.now(timezone.utc) - timedelta(days=2)}
]

# Professional Conversations
professional_conversations = [
    {
        "id": "pro-conv-1",
        "child_id": "child-lucas-martin",
        "professional_1_id": CURRENT_PROFESSIONAL_ID,
        "professional_2_id": "pro-marie-laurent",
        "last_message_at": datetime.now(timezone.utc) - timedelta(days=2),
        "created_at": datetime.now(timezone.utc) - timedelta(days=20)
    },
    {
        "id": "pro-conv-2",
        "child_id": "child-emma-petit",
        "professional_1_id": CURRENT_PROFESSIONAL_ID,
        "professional_2_id": "pro-marie-laurent",
        "last_message_at": datetime.now(timezone.utc) - timedelta(days=5),
        "created_at": datetime.now(timezone.utc) - timedelta(days=15)
    }
]

# Professional Messages
professional_messages = [
    {"id": gen_id(), "professional_conversation_id": "pro-conv-1", "sender_professional_id": "pro-marie-laurent", "content": "Bonjour Léa, Lucas progresse bien en orthophonie. On pourrait se coordonner sur le vocabulaire ?", "has_attachment": False, "created_at": datetime.now(timezone.utc) - timedelta(days=3), "read_at": datetime.now(timezone.utc) - timedelta(days=2, minutes=30)},
    {"id": gen_id(), "professional_conversation_id": "pro-conv-1", "sender_professional_id": CURRENT_PROFESSIONAL_ID, "content": "Excellente idée ! Je travaille justement sur les mots du quotidien. On peut se faire une liste commune ?", "has_attachment": False, "created_at": datetime.now(timezone.utc) - timedelta(days=2), "read_at": None},
    {"id": gen_id(), "professional_conversation_id": "pro-conv-2", "sender_professional_id": CURRENT_PROFESSIONAL_ID, "content": "Bonjour Marie, Emma utilise de plus en plus ses pictogrammes à la maison. C'est encourageant !", "has_attachment": False, "created_at": datetime.now(timezone.utc) - timedelta(days=5), "read_at": None}
]

# Documents
documents = [
    {
        "id": gen_id(),
        "child_id": "child-lucas-martin",
        "uploaded_by_type": "professional",
        "uploaded_by_id": CURRENT_PROFESSIONAL_ID,
        "related_professional_id": CURRENT_PROFESSIONAL_ID,
        "related_conversation_id": None,
        "related_professional_conversation_id": None,
        "related_invoice_id": None,
        "category": "compte_rendu",
        "title": "Compte rendu séance du 20 janvier",
        "file_name": "CR_Lucas_20jan.pdf",
        "file_url": "/documents/cr_lucas_20jan.pdf",
        "mime_type": "application/pdf",
        "size": 245600,
        "uploaded_at": datetime.now(timezone.utc) - timedelta(days=2)
    },
    {
        "id": gen_id(),
        "child_id": "child-emma-petit",
        "uploaded_by_type": "professional",
        "uploaded_by_id": CURRENT_PROFESSIONAL_ID,
        "related_professional_id": CURRENT_PROFESSIONAL_ID,
        "related_conversation_id": "conv-emma",
        "related_professional_conversation_id": None,
        "related_invoice_id": None,
        "category": "compte_rendu",
        "title": "Compte rendu séance du 18 janvier",
        "file_name": "CR_Emma_18jan.pdf",
        "file_url": "/documents/cr_emma_18jan.pdf",
        "mime_type": "application/pdf",
        "size": 189400,
        "uploaded_at": datetime.now(timezone.utc) - timedelta(hours=6)
    },
    {
        "id": gen_id(),
        "child_id": "child-lucas-martin",
        "uploaded_by_type": "parent",
        "uploaded_by_id": "parent-claire-martin",
        "related_professional_id": None,
        "related_conversation_id": None,
        "related_professional_conversation_id": None,
        "related_invoice_id": None,
        "category": "ordonnance",
        "title": "Ordonnance Dr. Durand",
        "file_name": "Ordonnance_Lucas_Durand.pdf",
        "file_url": "/documents/ordonnance_lucas.pdf",
        "mime_type": "application/pdf",
        "size": 98200,
        "uploaded_at": datetime.now(timezone.utc) - timedelta(days=10)
    },
    {
        "id": gen_id(),
        "child_id": "child-noah-rousseau",
        "uploaded_by_type": "professional",
        "uploaded_by_id": CURRENT_PROFESSIONAL_ID,
        "related_professional_id": CURRENT_PROFESSIONAL_ID,
        "related_conversation_id": None,
        "related_professional_conversation_id": None,
        "related_invoice_id": None,
        "category": "bilan",
        "title": "Bilan éducatif Noah - Janvier 2025",
        "file_name": "Bilan_Noah_jan2025.pdf",
        "file_url": "/documents/bilan_noah_jan2025.pdf",
        "mime_type": "application/pdf",
        "size": 456800,
        "uploaded_at": datetime.now(timezone.utc) - timedelta(days=5)
    }
]

# Invoices
invoices = [
    {
        "id": "inv-001",
        "child_id": "child-lucas-martin",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "parent_id": "parent-claire-martin",
        "invoice_number": "FAC-2025-001",
        "issue_date": (datetime.now(timezone.utc) - timedelta(days=15)).date().isoformat(),
        "sent_date": (datetime.now(timezone.utc) - timedelta(days=15)).date().isoformat(),
        "amount_total": 240.0,
        "amount_paid": 240.0,
        "amount_remaining": 0.0,
        "status": "payee",
        "payment_date": (datetime.now(timezone.utc) - timedelta(days=8)).date().isoformat(),
        "last_partial_payment_date": None,
        "payment_method": "Virement",
        "pdf_document_id": None,
        "notes": "Séances de décembre 2024",
        "created_at": datetime.now(timezone.utc) - timedelta(days=15)
    },
    {
        "id": "inv-002",
        "child_id": "child-emma-petit",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "parent_id": "parent-julie-petit",
        "invoice_number": "FAC-2025-002",
        "issue_date": (datetime.now(timezone.utc) - timedelta(days=10)).date().isoformat(),
        "sent_date": (datetime.now(timezone.utc) - timedelta(days=10)).date().isoformat(),
        "amount_total": 320.0,
        "amount_paid": 160.0,
        "amount_remaining": 160.0,
        "status": "partiellement_payee",
        "payment_date": None,
        "last_partial_payment_date": (datetime.now(timezone.utc) - timedelta(days=3)).date().isoformat(),
        "payment_method": "Chèque",
        "pdf_document_id": None,
        "notes": "Séances de janvier 2025 - Paiement partiel reçu",
        "created_at": datetime.now(timezone.utc) - timedelta(days=10)
    },
    {
        "id": "inv-003",
        "child_id": "child-noah-rousseau",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "parent_id": "parent-david-rousseau",
        "invoice_number": "FAC-2025-003",
        "issue_date": (datetime.now(timezone.utc) - timedelta(days=5)).date().isoformat(),
        "sent_date": (datetime.now(timezone.utc) - timedelta(days=5)).date().isoformat(),
        "amount_total": 240.0,
        "amount_paid": 0.0,
        "amount_remaining": 240.0,
        "status": "en_attente_paiement",
        "payment_date": None,
        "last_partial_payment_date": None,
        "payment_method": None,
        "pdf_document_id": None,
        "notes": "Séances de janvier 2025",
        "created_at": datetime.now(timezone.utc) - timedelta(days=5)
    },
    {
        "id": "inv-004",
        "child_id": "child-lea-blanc",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "parent_id": "parent-laura-blanc",
        "invoice_number": "FAC-2024-012",
        "issue_date": (datetime.now(timezone.utc) - timedelta(days=45)).date().isoformat(),
        "sent_date": (datetime.now(timezone.utc) - timedelta(days=45)).date().isoformat(),
        "amount_total": 160.0,
        "amount_paid": 0.0,
        "amount_remaining": 160.0,
        "status": "impayee",
        "payment_date": None,
        "last_partial_payment_date": None,
        "payment_method": None,
        "pdf_document_id": None,
        "notes": "Séances de novembre 2024 - Impayée",
        "created_at": datetime.now(timezone.utc) - timedelta(days=45)
    }
]

# Contracts
contracts = [
    {
        "id": "contract-lucas-001",
        "child_id": "child-lucas-martin",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "parent_id": "parent-claire-martin",
        "start_date": (datetime.now(timezone.utc) - timedelta(days=90)).date().isoformat(),
        "end_date": None,
        "billing_mode": "par_seance",
        "session_price": 60.0,
        "hourly_rate": None,
        "sessions_per_week": None,
        "sessions_per_month": None,
        "session_duration_minutes": None,
        "notes": "Séances d'éducation spécialisée - 3 fois par semaine",
        "active": True,
        "created_at": datetime.now(timezone.utc) - timedelta(days=90),
        "updated_at": datetime.now(timezone.utc) - timedelta(days=90)
    },
    {
        "id": "contract-emma-001",
        "child_id": "child-emma-petit",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "parent_id": "parent-julie-petit",
        "start_date": (datetime.now(timezone.utc) - timedelta(days=60)).date().isoformat(),
        "end_date": None,
        "billing_mode": "tarif_horaire",
        "session_price": None,
        "hourly_rate": 40.0,
        "sessions_per_week": 2,
        "sessions_per_month": 8,
        "session_duration_minutes": 90,
        "notes": "Séances d'éducation spécialisée - 2 fois par semaine, 1h30 par séance",
        "active": True,
        "created_at": datetime.now(timezone.utc) - timedelta(days=60),
        "updated_at": datetime.now(timezone.utc) - timedelta(days=60)
    },
    {
        "id": "contract-noah-001",
        "child_id": "child-noah-rousseau",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "parent_id": "parent-david-rousseau",
        "start_date": (datetime.now(timezone.utc) - timedelta(days=120)).date().isoformat(),
        "end_date": None,
        "billing_mode": "par_seance",
        "session_price": 60.0,
        "hourly_rate": None,
        "sessions_per_week": None,
        "sessions_per_month": None,
        "session_duration_minutes": None,
        "notes": "Séances d'éducation spécialisée - 3 fois par semaine",
        "active": True,
        "created_at": datetime.now(timezone.utc) - timedelta(days=120),
        "updated_at": datetime.now(timezone.utc) - timedelta(days=120)
    }
]


# Quotes
quotes = [
    {
        "id": "quote-001",
        "child_id": "child-lea-blanc",
        "professional_id": CURRENT_PROFESSIONAL_ID,
        "parent_id": "parent-laura-blanc",
        "quote_number": "DEV-2025-001",
        "issue_date": datetime.now(timezone.utc).date().isoformat(),
        "validity_date": (datetime.now(timezone.utc) + timedelta(days=30)).date().isoformat(),
        "billing_mode": "par_seance",
        "session_price": 60.0,
        "hourly_rate": None,
        "sessions_per_week": None,
        "sessions_per_month": 8,
        "session_duration_minutes": None,
        "estimated_monthly_amount": 480.0,
        "description": "Devis pour accompagnement éducatif - 2 séances par semaine",
        "status": "envoye",
        "converted_to_contract_id": None,
        "created_at": datetime.now(timezone.utc) - timedelta(days=5),
        "updated_at": datetime.now(timezone.utc) - timedelta(days=5)
    }
]

