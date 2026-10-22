/* shared/projects.js — All project data for interiors.html.
   Adding a project = adding ONE object to this array (and its image files). Nothing else.

   Schema (fields marked * are additions to the brief, all optional):
     slug, collection ("architecture"|"interiors"), title, typology (filter category), location, year, area,
     featured (featured projects are the slider slides, one slide each, using cover.hero), featuredOrder, cover {grid, hero, alt, position*}, images [{src, alt, width, height, widths*}],
     description ("\n" separates paragraphs), credits {client, location, year, area, team, status*},
     type*   building type shown beside the typology (e.g. "4BHK Villa")
     status* e.g. "Ongoing"
   Image objects: `src` is the path WITHOUT size suffix or extension; files are <src>-<width>.webp / .jpg
   for every number in `widths`; width/height are the intrinsic size of the largest file.
   Missing facts are null and render as a visible [PLACEHOLDER] — never invent project facts. */
window.SAP_PROJECTS = [
 {
  "slug": "gopi-krishna-enclave",
  "collection": "interiors",
  "title": "Gopi Krishna Enclave",
  "typology": "Residential",
  "type": null,
  "status": "Completed",
  "location": "Hyderabad",
  "year": null,
  "area": "3,436 sq.ft.",
  "featured": true,
  "featuredOrder": 1,
  "cover": {
   "grid": {
    "src": "assets/images/interiors/gopi-krishna-enclave/living-01",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Living room with cream curved sofas, green drapes and a brass pendant",
    "width": 1920,
    "height": 1080
   },
   "hero": {
    "src": "assets/images/interiors/gopi-krishna-enclave/living-04",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Living room with a floating white staircase, a green tiled wall and traditional timber sofas",
    "width": 1920,
    "height": 1080
   },
   "alt": "Living room with a floating white staircase, a green tiled wall and traditional timber sofas",
   "position": "center 50%"
  },
  "images": [
   {
    "src": "assets/images/interiors/gopi-krishna-enclave/living-01",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Living room with cream curved sofas, green drapes and a brass pendant",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/gopi-krishna-enclave/living-02",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Living room with an arched mural TV wall and a black chandelier",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/gopi-krishna-enclave/living-03",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Double-height living room with a green tiled feature wall, patterned stair risers and a chandelier",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/gopi-krishna-enclave/living-04",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Living room with a floating white staircase, a green tiled wall and traditional timber sofas",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/gopi-krishna-enclave/kitchen-01",
    "widths": [
     800,
     1364
    ],
    "alt": "Kitchen with light timber and cream cabinetry, a central island and under-cabinet lighting",
    "width": 1364,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/gopi-krishna-enclave/puja-01",
    "widths": [
     800,
     951
    ],
    "alt": "Puja room entrance with carved timber doors, a timber frame and a terracotta floor",
    "width": 951,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/gopi-krishna-enclave/puja-02",
    "widths": [
     720
    ],
    "alt": "Puja niche with an arched mural, timber columns and a stone-topped storage unit",
    "width": 720,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/gopi-krishna-enclave/bedroom-01",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Bedroom with a timber and fabric wardrobe wall and a sage green bed",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/gopi-krishna-enclave/bedroom-02",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Bedroom with a floating timber bed, a green headboard and a fabric-panelled wardrobe",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/gopi-krishna-enclave/bedroom-03",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Bedroom with a maroon and floral wardrobe wall and a lit pendant beside the bed",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/gopi-krishna-enclave/bedroom-04",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Bedroom with a floral and maroon wardrobe wall and a wall-mounted TV",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/gopi-krishna-enclave/bedroom-05",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Bedroom with dark wardrobes, an olive green headboard wall and a marble-pattern panel",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/gopi-krishna-enclave/bedroom-06",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Bedroom with a dark fabric wardrobe wall and a bookshelf niche beside the window",
    "width": 1920,
    "height": 1080
   }
  ],
  "description": "Gopi Krishna Enclave is a 3,436 sq.ft. residential interior project in Hyderabad that brings together traditional character and contemporary warmth. The common areas embrace a distinctly traditional design language, creating a sense of familiarity and cultural identity, while the private spaces introduce warmer contrasts, contemporary materials, and refined detailing. The deliberate transition between the two creates a layered and personal interior experience—where tradition defines the shared spaces and contemporary warmth shapes the private ones.",
  "credits": {
   "client": null,
   "location": "Hyderabad",
   "year": null,
   "area": "3,436 sq.ft.",
   "status": "Completed",
   "team": null
  }
 },
 {
  "slug": "ganachari-kumar-residence",
  "collection": "interiors",
  "title": "Ganachari Kumar Residence",
  "typology": "Residential",
  "type": null,
  "status": "Ongoing",
  "location": "Proddatur",
  "year": null,
  "area": "3,815 sq.ft.",
  "featured": true,
  "featuredOrder": 2,
  "cover": {
   "grid": {
    "src": "assets/images/interiors/ganachari-kumar-residence/living-03",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Living area with a cream sectional, a green armchair, black coffee tables and a glass partition",
    "width": 1920,
    "height": 1080
   },
   "hero": {
    "src": "assets/images/interiors/ganachari-kumar-residence/living-01",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Double-height living room with cream sofas, green chairs and a wall-mounted TV beside the lift",
    "width": 1920,
    "height": 1080
   },
   "alt": "Double-height living room with cream sofas, green chairs and a wall-mounted TV beside the lift",
   "position": "center 50%"
  },
  "images": [
   {
    "src": "assets/images/interiors/ganachari-kumar-residence/foyer-01",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Entry foyer with a cream sofa, a green armchair, full-height glass partitions and a display shelf",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/ganachari-kumar-residence/living-01",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Double-height living room with cream sofas, green chairs and a wall-mounted TV beside the lift",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/ganachari-kumar-residence/living-02",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Living room TV wall with timber doors, open display shelving and a floating stair above",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/ganachari-kumar-residence/living-03",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Living area with a cream sectional, a green armchair, black coffee tables and a glass partition",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/ganachari-kumar-residence/living-04",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Living room seen from the stair with a TV wall, a red artwork and a timber console",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/ganachari-kumar-residence/living-05",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Living room with a tall timber TV wall, open shelving and a floating staircase",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/ganachari-kumar-residence/living-06",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Timber console with a red abstract artwork between two timber doors",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/ganachari-kumar-residence/living-07",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Living area seen from the upper level through a glass balustrade",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/ganachari-kumar-residence/lounge-01",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Upper lounge with a curved sofa, a coffered timber ceiling and a sculptural pendant",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/ganachari-kumar-residence/lounge-02",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Upper lounge with a curved sofa, a patterned armchair and a glass balustrade",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/ganachari-kumar-residence/lounge-03",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Upper lounge with a carved mural wall, a curved sofa and a coffered timber ceiling",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/ganachari-kumar-residence/lounge-04",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Upper lounge with a round sofa, black framed glazing and a cloud-shaped pendant",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/ganachari-kumar-residence/lounge-05",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Lounge corner with a timber book shelf, a curved sofa and a round coffee table",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/ganachari-kumar-residence/bedroom-01",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Master bedroom with a floating bed, a tall wardrobe wall and a grid window",
    "width": 1920,
    "height": 1440
   },
   {
    "src": "assets/images/interiors/ganachari-kumar-residence/bedroom-02",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Master bedroom with a fabric-panelled wardrobe, a timber bed head and a pendant light",
    "width": 1920,
    "height": 1440
   },
   {
    "src": "assets/images/interiors/ganachari-kumar-residence/bedroom-03",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Master bedroom wardrobe wall with a floating bed and a bedside pendant",
    "width": 1920,
    "height": 1440
   },
   {
    "src": "assets/images/interiors/ganachari-kumar-residence/bedroom-04",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Master bedroom with three framed artworks above a floating bed and a timber door",
    "width": 1920,
    "height": 1440
   }
  ],
  "description": "Ganachari Kumar Residence is a contemporary residential interior designed around a refined balance of materiality, proportion, and spatial expression. The 3,815 sq.ft. home combines warm wood tones, soft neutral finishes, textured surfaces, and subtle green accents to create an inviting yet sophisticated atmosphere.\nThe double-height living area forms the heart of the residence, with a sculptural statement wall featuring a contemporary interpretation of seven galloping horses. Complemented by a carefully curated foyer vista, full-height mirrors, stone textures, and integrated display elements, the space creates a strong sense of volume and grandeur while retaining warmth.\nThe master bedroom adopts a calmer, more intimate palette with detailed wooden elements, textured finishes, integrated wardrobes, and soft ambient lighting. The upper-level lounge continues the contemporary language through layered volumes, custom furniture, sculptural lighting, and carefully framed views.\nA dedicated pooja room introduces a more traditional expression through intricate wood detailing, devotional elements, warm lighting, and patterned flooring, creating a distinct spiritual character within the otherwise contemporary home.\nThe overall design brings together contemporary elegance, traditional references, and thoughtful material detailing, creating a residence that feels sophisticated, personal, and timeless.",
  "credits": {
   "client": null,
   "location": "Proddatur",
   "year": null,
   "area": "3,815 sq.ft.",
   "status": "Ongoing",
   "team": null
  }
 },
 {
  "slug": "subba-reddy-villa",
  "collection": "interiors",
  "title": "Subba Reddy Villa",
  "typology": "Residential",
  "type": null,
  "status": "Ongoing",
  "location": "Proddatur",
  "year": null,
  "area": "3,098 sq.ft.",
  "featured": true,
  "featuredOrder": 3,
  "cover": {
   "grid": {
    "src": "assets/images/interiors/subba-reddy-villa/living-05",
    "widths": [
     800,
     1600
    ],
    "alt": "Living room with a panelled wall, a statement floor lamp and a staircase with a glass balustrade",
    "width": 1600,
    "height": 1066
   },
   "hero": {
    "src": "assets/images/interiors/subba-reddy-villa/living-02",
    "widths": [
     800,
     1600
    ],
    "alt": "Living room with a cream sectional, a panelled feature wall and a tall floor lamp",
    "width": 1600,
    "height": 1067
   },
   "alt": "Living room with a cream sectional, a panelled feature wall and a tall floor lamp",
   "position": "center 50%"
  },
  "images": [
   {
    "src": "assets/images/interiors/subba-reddy-villa/living-01",
    "widths": [
     800,
     1600
    ],
    "alt": "Living room with a timber TV unit, a cream sectional and a stone-panelled wall",
    "width": 1600,
    "height": 1067
   },
   {
    "src": "assets/images/interiors/subba-reddy-villa/living-02",
    "widths": [
     800,
     1600
    ],
    "alt": "Living room with a cream sectional, a panelled feature wall and a tall floor lamp",
    "width": 1600,
    "height": 1067
   },
   {
    "src": "assets/images/interiors/subba-reddy-villa/living-03",
    "widths": [
     800,
     1600
    ],
    "alt": "Living room with a wall-mounted TV on a timber unit and track lighting",
    "width": 1600,
    "height": 1067
   },
   {
    "src": "assets/images/interiors/subba-reddy-villa/living-04",
    "widths": [
     800,
     1600
    ],
    "alt": "Living room with a timber TV unit, a staircase and a blue accent chair",
    "width": 1600,
    "height": 1066
   },
   {
    "src": "assets/images/interiors/subba-reddy-villa/living-05",
    "widths": [
     800,
     1600
    ],
    "alt": "Living room with a panelled wall, a statement floor lamp and a staircase with a glass balustrade",
    "width": 1600,
    "height": 1066
   },
   {
    "src": "assets/images/interiors/subba-reddy-villa/kitchen-01",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Kitchen with an L-shaped counter, glass display shelves and a timber dining table",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/subba-reddy-villa/kitchen-02",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Kitchen and dining area with a tall refrigerator, a timber table and framed botanical prints",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/subba-reddy-villa/bedroom-01",
    "widths": [
     800
    ],
    "alt": "Dark bedroom with a black marble feature wall, a dark wardrobe and a coved ceiling light",
    "width": 800,
    "height": 634
   },
   {
    "src": "assets/images/interiors/subba-reddy-villa/bedroom-02",
    "widths": [
     800
    ],
    "alt": "Dark bedroom with a window seat, a marble-look wall and a coved ceiling light",
    "width": 800,
    "height": 639
   },
   {
    "src": "assets/images/interiors/subba-reddy-villa/bedroom-03",
    "widths": [
     800
    ],
    "alt": "Dark bedroom with a wall-mounted TV, a leather chair and a lit ceiling edge",
    "width": 800,
    "height": 640
   },
   {
    "src": "assets/images/interiors/subba-reddy-villa/bedroom-04",
    "widths": [
     800
    ],
    "alt": "Bedroom with a pink upholstered bed, a dark textured wall and a glass wardrobe",
    "width": 800,
    "height": 600
   },
   {
    "src": "assets/images/interiors/subba-reddy-villa/bedroom-05",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Bedroom with a stone-grey bed, a terracotta artwork and a blind window",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/subba-reddy-villa/bedroom-06",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Bedroom shown from two angles, with a bed bench, a framed artwork and warm cove lighting",
    "width": 1920,
    "height": 1080
   },
   {
    "src": "assets/images/interiors/subba-reddy-villa/bedroom-07",
    "widths": [
     800,
     1600,
     1920
    ],
    "alt": "Bedroom with a timber wardrobe, a carved wall panel and a woven pendant",
    "width": 1920,
    "height": 1357
   }
  ],
  "description": "Subba Reddy Villa is a 3,098 sq.ft. residence in Proddatur designed around a minimalist and refined interior language. Clean lines, soft neutral tones, and selective wood laminate detailing create a warm and uncluttered atmosphere throughout the home. The bedrooms take on a deeper, more intimate character through dark tones, layered textures, and controlled lighting, adding contrast to the lighter communal spaces. The result is a minimal yet warm contemporary home that balances simplicity, functionality, and character.",
  "credits": {
   "client": null,
   "location": "Proddatur",
   "year": null,
   "area": "3,098 sq.ft.",
   "status": "Ongoing",
   "team": null
  }
 },
 {
  "slug": "harshitha-nivas",
  "collection": "interiors",
  "title": "Harshitha Nivas",
  "typology": "Residential",
  "type": null,
  "status": "Completed",
  "location": "Proddatur",
  "year": null,
  "area": "3,640 sq.ft.",
  "featured": false,
  "featuredOrder": null,
  "cover": {
   "grid": {
    "src": "assets/images/interiors/harshitha-nivas/living-02",
    "widths": [
     800,
     1480
    ],
    "alt": "Living room with a grey sectional sofa, green armchairs and a slatted timber screen",
    "width": 1480,
    "height": 1084
   },
   "hero": {
    "src": "assets/images/interiors/harshitha-nivas/living-02",
    "widths": [
     800,
     1480
    ],
    "alt": "Living room with a grey sectional sofa, green armchairs and a slatted timber screen",
    "width": 1480,
    "height": 1084
   },
   "alt": "Living room with a grey sectional sofa, green armchairs and a slatted timber screen",
   "position": "center 50%"
  },
  "images": [
   {
    "src": "assets/images/interiors/harshitha-nivas/living-01",
    "widths": [
     800,
     1451
    ],
    "alt": "Living room TV wall with timber shelving and marble flooring",
    "width": 1451,
    "height": 1060
   },
   {
    "src": "assets/images/interiors/harshitha-nivas/living-02",
    "widths": [
     800,
     1480
    ],
    "alt": "Living room with a grey sectional sofa, green armchairs and a slatted timber screen",
    "width": 1480,
    "height": 1084
   },
   {
    "src": "assets/images/interiors/harshitha-nivas/living-03",
    "widths": [
     800,
     1278
    ],
    "alt": "Living and dining space with a ceiling feature and arched metal screens",
    "width": 1278,
    "height": 1047
   },
   {
    "src": "assets/images/interiors/harshitha-nivas/kitchen-01",
    "widths": [
     800,
     1428
    ],
    "alt": "Kitchen with sage green base cabinets, a marble backsplash and a breakfast counter",
    "width": 1428,
    "height": 1069
   },
   {
    "src": "assets/images/interiors/harshitha-nivas/kitchen-02",
    "widths": [
     800,
     1459
    ],
    "alt": "Kitchen wall with a tall black unit, a refrigerator and open shelving",
    "width": 1459,
    "height": 1094
   },
   {
    "src": "assets/images/interiors/harshitha-nivas/bedroom-01",
    "widths": [
     800,
     1441
    ],
    "alt": "Bedroom with an upholstered bed, a feature ceiling and a wardrobe wall",
    "width": 1441,
    "height": 1081
   },
   {
    "src": "assets/images/interiors/harshitha-nivas/dressing-01",
    "widths": [
     800,
     1547
    ],
    "alt": "Dressing area with an arched mirror, a vanity and a green panelled wall, shown from two angles",
    "width": 1547,
    "height": 1104
   },
   {
    "src": "assets/images/interiors/harshitha-nivas/bedroom-02",
    "widths": [
     800,
     1520
    ],
    "alt": "Bedroom wall with a TV unit, two timber doors and a stone-look panel",
    "width": 1520,
    "height": 1027
   },
   {
    "src": "assets/images/interiors/harshitha-nivas/bathroom-01",
    "widths": [
     800,
     1522
    ],
    "alt": "Bathroom with a round mirror, a floating vanity and a brown stone-look wall, shown from two angles",
    "width": 1522,
    "height": 1032
   },
   {
    "src": "assets/images/interiors/harshitha-nivas/bathroom-02",
    "widths": [
     800,
     1536
    ],
    "alt": "Bathroom with a glass shower, a rain shower and a timber door, shown from two angles",
    "width": 1536,
    "height": 1043
   }
  ],
  "description": "Harshitha Nivas is a contemporary residential interior designed around warmth, simplicity, and everyday comfort. The 3,640 sq.ft. home brings together a refined palette of warm wood, soft neutrals, muted greens, and natural stone textures to create a calm and cohesive living environment.\nThe living spaces are designed with clean architectural lines and subtle detailing, balancing built-in storage with open display elements and layered lighting. The kitchen combines understated cabinetry with marble-inspired surfaces and muted green accents, creating a functional yet visually inviting space.\nAcross the bedrooms, custom wall panelling, integrated wardrobes, soft textures, and carefully framed niches create a sense of warmth and individuality while maintaining a consistent design language throughout the home. The bathrooms continue this approach through a combination of stone textures, warm wood tones, glass partitions, and minimal fixtures.\nThe overall design focuses on timeless contemporary living—where functionality, materiality, and visual calm come together to create a home that feels personal and effortless.",
  "credits": {
   "client": null,
   "location": "Proddatur",
   "year": null,
   "area": "3,640 sq.ft.",
   "status": "Completed",
   "team": null
  }
 }
];
