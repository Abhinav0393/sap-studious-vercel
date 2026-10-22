/* shared/projects.architecture.js — project data for architecture.html (the Interiors page will get its own file, projects.interiors.js).
   Adding a project = adding ONE object to this array (and its image files). Nothing else.

   Schema (fields marked * are additions to the brief, all optional):
     slug, collection ("architecture"|"interiors"), title, typology (filter category), location, year, area,
     featured (featured projects are the slider slides, one slide each, using cover.hero), featuredOrder, cover {grid, hero, alt, position*}, images [{src, alt, width, height, widths*}],
     description ("\n" separates paragraphs), credits {client, location, year, area, team, status*},
     type*   building type shown beside the typology (e.g. "4BHK Villa")
     status* e.g. "Ongoing"
   Image objects: `src` is the path WITHOUT size suffix or extension; files are <src>-<width>.webp / .jpg
   for every number in `widths`; width/height are the intrinsic size of the largest file.
   Missing facts are null and are simply not shown on the page — never invent project facts. */
(window.SAP_PROJECTS = window.SAP_PROJECTS || []).push.apply(window.SAP_PROJECTS, [
 {
  "slug": "bhumireddy-mansion",
  "collection": "architecture",
  "title": "Bhumireddy Mansion",
  "typology": "Residential",
  "type": "4BHK Villa",
  "status": "Ongoing",
  "location": "Proddatur",
  "year": null,
  "area": "4,856 sq.ft.",
  "featured": true,
  "featuredOrder": 1,
  "cover": {
   "grid": {
    "src": "assets/images/architecture/bhumireddy-mansion/elevation-01",
    "widths": [800, 1600, 1920],
    "alt": "Three-quarter view of the neoclassical front elevation with columns, arched balconies and a landscaped forecourt",
    "width": 1920,
    "height": 1080
   },
   "hero": {
    "src": "assets/images/architecture/bhumireddy-mansion/elevation-01",
    "widths": [800, 1600, 1920],
    "alt": "Three-quarter view of the neoclassical front elevation with columns, arched balconies and a landscaped forecourt",
    "width": 1920,
    "height": 1080
   },
   "alt": "Three-quarter view of the neoclassical front elevation with columns, arched balconies and a landscaped forecourt",
   "position": "center 50%"
  },
  "images": [
   {
    "src": "assets/images/architecture/bhumireddy-mansion/elevation-01",
    "widths": [800, 1600, 1920],
    "alt": "Three-quarter view of the neoclassical front elevation with columns, arched balconies and a landscaped forecourt",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/architecture/bhumireddy-mansion/elevation-02",
    "widths": [800, 1600, 1920],
    "alt": "Front elevation with a double-height arched window, planted balconies and the entrance gate",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/architecture/bhumireddy-mansion/elevation-03",
    "widths": [800, 1600, 1920],
    "alt": "Side elevation with a tall arched window, a textured stone panel and palm trees",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/architecture/bhumireddy-mansion/plan-ground",
    "widths": [800, 980],
    "alt": "Ground floor plan of Bhumireddy Mansion",
    "width": 980,
    "height": 1080
   },
   {
    "src": "assets/images/architecture/bhumireddy-mansion/plan-first",
    "widths": [800, 967],
    "alt": "First floor plan of Bhumireddy Mansion",
    "width": 967,
    "height": 1080
   }
  ],
  "description": "Bhumi Reddy Mansion is an ongoing 4,856 sq.ft. 4BHK villa in Proddatur that reinterprets neoclassical architecture through a contemporary lens. The residence combines classical columns, arched openings, ornamental detailing, strong vertical volumes, and refined moulded profiles with a restrained palette of textured stone and lime-wash finishes. A dramatic double-height foyer, landscaped balconies, and carefully integrated greenery add depth and soften the formal character of the facade. The result is a grand yet refined residence that brings together classical elegance, contemporary restraint, and timeless architectural character.",
  "credits": {
   "client": null,
   "location": "Proddatur",
   "year": null,
   "area": "4,856 sq.ft.",
   "status": "Ongoing",
   "team": null
  }
 },
 {
  "slug": "manoj-residence",
  "collection": "architecture",
  "title": "Manoj Residence",
  "typology": "Residential",
  "type": "3BHK Villa",
  "status": "Ongoing",
  "location": "Proddatur",
  "year": null,
  "area": "2,206 sq.ft.",
  "featured": true,
  "featuredOrder": 2,
  "cover": {
   "grid": {
    "src": "assets/images/architecture/manoj-residence/elevation-01",
    "widths": [800, 1600, 1920],
    "alt": "Front elevation of the contemporary villa with stone, plaster and timber surfaces and planted balconies",
    "width": 1920,
    "height": 1281
   },
   "hero": {
    "src": "assets/images/architecture/manoj-residence/elevation-01",
    "widths": [800, 1600, 1920],
    "alt": "Front elevation of the contemporary villa with stone, plaster and timber surfaces and planted balconies",
    "width": 1920,
    "height": 1281
   },
   "alt": "Front elevation of the contemporary villa with stone, plaster and timber surfaces and planted balconies",
   "position": "center 50%"
  },
  "images": [
   {
    "src": "assets/images/architecture/manoj-residence/elevation-01",
    "widths": [800, 1600, 1920],
    "alt": "Front elevation of the contemporary villa with stone, plaster and timber surfaces and planted balconies",
    "width": 1920,
    "height": 1281
   },
   {
    "src": "assets/images/architecture/manoj-residence/interior-01",
    "widths": [800, 1600],
    "alt": "Living room with the open staircase, TV wall and low seating",
    "width": 1600,
    "height": 900
   },
   {
    "src": "assets/images/architecture/manoj-residence/interior-02",
    "widths": [800, 1600],
    "alt": "Double-height living room with a floating staircase and a stone feature wall",
    "width": 1600,
    "height": 900
   },
   {
    "src": "assets/images/architecture/manoj-residence/interior-03",
    "widths": [800, 1600],
    "alt": "Living room and kitchen seen from the entrance, with a timber door and track lighting",
    "width": 1600,
    "height": 900
   },
   {
    "src": "assets/images/architecture/manoj-residence/interior-04",
    "widths": [800, 1600],
    "alt": "Kitchen and dining table behind timber-framed glazed doors",
    "width": 1600,
    "height": 900
   },
   {
    "src": "assets/images/architecture/manoj-residence/interior-05",
    "widths": [800, 1600],
    "alt": "Dining area with a patterned floor, linked to the living room and kitchen",
    "width": 1600,
    "height": 900
   },
   {
    "src": "assets/images/architecture/manoj-residence/interior-06",
    "widths": [800, 1600],
    "alt": "Puja niche framed by timber screens under a tall clerestory window",
    "width": 1600,
    "height": 900
   },
   {
    "src": "assets/images/architecture/manoj-residence/interior-07",
    "widths": [800, 1600],
    "alt": "Bedroom with timber panelling, a wall light and built-in storage",
    "width": 1600,
    "height": 900
   },
   {
    "src": "assets/images/architecture/manoj-residence/interior-08",
    "widths": [800, 1600],
    "alt": "Bedroom with warm lamps, a window seat and a lit shelving niche",
    "width": 1600,
    "height": 900
   },
   {
    "src": "assets/images/architecture/manoj-residence/interior-09",
    "widths": [800, 1448],
    "alt": "Bedroom with a stone-textured headboard wall and sliding wardrobe",
    "width": 1448,
    "height": 1080
   },
   {
    "src": "assets/images/architecture/manoj-residence/interior-10",
    "widths": [800, 1184],
    "alt": "Bathroom with a floating vanity and a green-tiled rain shower",
    "width": 1184,
    "height": 1080
   },
   {
    "src": "assets/images/architecture/manoj-residence/plan-01",
    "widths": [800, 1600],
    "alt": "Floor plan drawing sheet 1 of Manoj Residence",
    "width": 1600,
    "height": 2263
   },
   {
    "src": "assets/images/architecture/manoj-residence/plan-02",
    "widths": [800, 1600],
    "alt": "Floor plan drawing sheet 2 of Manoj Residence",
    "width": 1600,
    "height": 2263
   }
  ],
  "description": "Manoj Residence is a 2,206 sq.ft. contemporary 3BHK villa in Proddatur, designed as a complete architectural project with a focus on clean geometry, material warmth, and a strong connection with the outdoors.\nThe facade brings together large planes of textured stone, crisp plastered surfaces, warm wood accents, and deep roof overhangs to create a balanced contemporary expression. Carefully integrated greenery across the balconies and landscape softens the architecture while adding a tropical character to the residence.\nInside, the planning is organised around a spacious living area with a visually connected staircase and double-height volume, creating a sense of openness and vertical continuity. The ground floor brings together the living, dining, kitchen, puja, and master bedroom, while the first floor accommodates the master bedroom, children's bedroom, and a private lounge with balconies.\nThe interiors continue the architectural language through warm wood tones, soft neutral finishes, natural textures, and carefully framed openings that bring daylight and landscape into the home. The result is a contemporary family residence that balances simplicity, warmth, functionality, and a strong sense of place.",
  "credits": {
   "client": null,
   "location": "Proddatur",
   "year": null,
   "area": "2,206 sq.ft.",
   "status": "Ongoing",
   "team": null
  }
 },
 {
  "slug": "ravi-teja-residence",
  "collection": "architecture",
  "title": "Ravi Teja Residence",
  "typology": "Residential",
  "type": "4BHK Villa",
  "status": "Ongoing",
  "location": "Proddatur",
  "year": null,
  "area": "3,441 sq.ft.",
  "featured": true,
  "featuredOrder": 3,
  "cover": {
   "grid": {
    "src": "assets/images/architecture/ravi-teja-residence/elevation-01",
    "widths": [800, 1103],
    "alt": "Townhouse elevation with timber screens, concrete fins and a skylight, seen from the street after rain",
    "width": 1103,
    "height": 1426
   },
   "hero": {
    "src": "assets/images/architecture/ravi-teja-residence/elevation-01",
    "widths": [800, 1103],
    "alt": "Townhouse elevation with timber screens, concrete fins and a skylight, seen from the street after rain",
    "width": 1103,
    "height": 1426
   },
   "alt": "Townhouse elevation with timber screens, concrete fins and a skylight, seen from the street after rain",
   "position": "center 30%"
  },
  "images": [
   {
    "src": "assets/images/architecture/ravi-teja-residence/elevation-01",
    "widths": [800, 1103],
    "alt": "Townhouse elevation with timber screens, concrete fins and a skylight, seen from the street after rain",
    "width": 1103,
    "height": 1426
   },
   {
    "src": "assets/images/architecture/ravi-teja-residence/elevation-02",
    "widths": [800, 944],
    "alt": "Vertical townhouse elevation with planted balconies and timber screens in daylight",
    "width": 944,
    "height": 1665
   },
   {
    "src": "assets/images/architecture/ravi-teja-residence/plan-01",
    "widths": [800, 1600],
    "alt": "Plan drawing sheet 1 of Ravi Teja Residence",
    "width": 1600,
    "height": 2263
   },
   {
    "src": "assets/images/architecture/ravi-teja-residence/plan-02",
    "widths": [800, 1600],
    "alt": "Plan drawing sheet 2 of Ravi Teja Residence",
    "width": 1600,
    "height": 2263
   },
   {
    "src": "assets/images/architecture/ravi-teja-residence/plan-03",
    "widths": [800, 1600],
    "alt": "Plan drawing sheet 3 of Ravi Teja Residence",
    "width": 1600,
    "height": 2263
   }
  ],
  "description": "Ravi Teja Residence is an ongoing 3,441 sq.ft. 4BHK villa in Proddatur, designed as a contemporary urban home with a focus on privacy, natural light, and climatic responsiveness. Clean architectural volumes are layered with warm wooden screens, aluminium louvers, concrete fins, and planted balconies to create depth and texture across the facade. Carefully positioned openings, voids, and a skylight bring natural light into the vertically organised interior, while the screening elements filter sunlight and provide privacy. The result is a contemporary residence that balances clean geometry, warmth, greenery, and functional design.",
  "credits": {
   "client": null,
   "location": "Proddatur",
   "year": null,
   "area": "3,441 sq.ft.",
   "status": "Ongoing",
   "team": null
  }
 }
]);
