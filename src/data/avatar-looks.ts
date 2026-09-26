/**
 * Visual descriptions used to generate each landing character's portrait.
 * Every subject is explicitly an adult. Historical figures are painted
 * "as imagined" in a portrait-painting style — never as photos.
 */
export type AvatarLook = {
  /** Subject noun used in the prompt, e.g. "woman", "man", "person". */
  subject: "woman" | "man" | "person";
  /** Appearance, clothing and setting. No age words here — age is added separately. */
  look: string;
  /** For historical figures: how the age is described instead of a number. */
  ageText?: string;
};

export const avatarLooks: Record<string, AvatarLook> = {
  // Lover
  "mara-vellin": {
    subject: "woman",
    look: "long wavy auburn hair, light freckles, warm smile, linen florist apron, holding pink peonies, night-time flower shop glowing with fairy lights",
  },
  "theo-hart": {
    subject: "man",
    look: "short dark hair, stubble, thin-framed glasses, crisp navy suit with open collar, confident half-smile, modern glass architecture studio at dusk",
  },
  "ren-kaito": {
    subject: "man",
    look: "East Asian, soft black hair falling over his forehead, small silver earring, cream cable-knit sweater, gentle smile, cosy café with an espresso machine behind him",
  },
  "sol-rivera": {
    subject: "person",
    look: "androgynous, Latinx, short dark curly hair, olive field jacket, vintage film camera strap on shoulder, relaxed grin, city street at golden hour",
  },
  // Friend
  "pip-marlow": {
    subject: "woman",
    look: "mature adult face, ginger hair in a messy bun, round glasses, green hoodie over a collared shirt, confident grin, library desk covered in colour-coded sticky notes",
  },
  "nora-quill": {
    subject: "woman",
    look: "silver hair in a neat bun, reading glasses, lavender cardigan, kind eyes, old library with a teapot and stacks of books",
  },
  "dex-okafor": {
    subject: "man",
    look: "Black, mature adult face with a short beard, short twists, headphones around his neck, black graphic tee, playful grin, gaming room with soft RGB glow",
  },
  "lina-vasquez": {
    subject: "woman",
    look: "Latina, long dark wavy hair, gold hoop earrings, white linen shirt, backpack strap, bustling street-food market",
  },
  // Famous — historical, painted as imagined
  // Creator demo results
  "elio-marsh": {
    subject: "man",
    look: "dark curly hair, short beard, grumpy but soft eyes, brown barista apron over a black tee, coffee bar with a chalkboard menu",
  },
  "isla-maren": {
    subject: "woman",
    look: "wavy copper hair blown by the wind, navy peacoat, teasing smile, wooden pier with a lighthouse at dusk",
  },
  "maestro-orlando": {
    subject: "man",
    ageText: "in his forties",
    look: "a fictional Renaissance inventor, curly brown hair and short beard, rust-red doublet, amazed expression, workshop full of brass gadgets and scrolls",
  },
  // Phase 2 additions — Lover
  "kai-moreno": {
    subject: "man",
    look: "Latino, short dark hair, stubble, warm brown eyes, navy firefighter station t-shirt, holding a fresh loaf of bread, fire station bay with a red engine in the background",
  },
  "elena-voss": {
    subject: "woman",
    look: "sleek dark-blonde hair tied back, sharp green eyes, white chef's jacket, confident smirk, professional TV kitchen with studio lights",
  },
  "jae-han": {
    subject: "man",
    look: "Korean, neat black hair, clean-shaven, charcoal tailored suit and tie, slightly awkward polite smile, elegant wedding venue garden in the background",
  },
  "rowan-hale": {
    subject: "woman",
    look: "shoulder-length black hair with a teal streak, tattooed forearms, black tank top, septum ring, deadpan half-smile, moody tattoo studio with sketches on the wall",
  },
  // Phase 2 additions — Friend
  "maya-patel": {
    subject: "woman",
    look: "Indian, warm brown skin, dark brown eyes, long black hair in a high ponytail, athletic zip jacket, bright encouraging smile, sunny park running track at morning",
  },
  "hugo-lindqvist": {
    subject: "man",
    look: "Scandinavian, light blond hair, neat beard, round glasses, chunky knit sweater, holding a coffee cup, cosy wooden cabin by a lake",
  },
  "sunny-park": {
    subject: "person",
    look: "androgynous, Korean, soft wavy dark hair, oversized cardigan, headphones on, gentle smile, late-night radio studio with a glowing ON AIR sign",
  },
  "bea-okoye": {
    subject: "woman",
    look: "Nigerian, short natural hair with a colourful headwrap, apron over a bright patterned top, big laugh, holding a wooden spoon, warm busy restaurant kitchen",
  },
  // Phase 2 additions — Famous (historical, painted as imagined)
  // Phase 2b — more Lover women (21+)
  "yuna-seo": {
    subject: "woman",
    ageText: "29-year-old",
    look: "Korean professional illustrator, sophisticated grown woman, shoulder-length wavy black hair, small gold earrings, soft lipstick, confident warm smile, oatmeal wool blazer over a black turtleneck, holding a coffee cup and a sketchbook, modern loft studio with warm light",
  },
  "chloe-martin": {
    subject: "woman",
    look: "French, beautiful, wavy chestnut bob, red lipstick, confident amused smile, black turtleneck and a thin gold necklace, elegant Paris art gallery with framed paintings",
  },
  "valentina-cruz": {
    subject: "woman",
    look: "Latina, beautiful, long dark curly hair with a red flower tucked behind her ear, radiant laugh, red wrap top, warm-lit dance studio with mirrors",
  },
  "hana-mori": {
    subject: "woman",
    ageText: "28-year-old",
    look: "Japanese bookshop owner, sophisticated grown woman, shoulder-length wavy brown hair, thin gold glasses, small pearl earrings, soft lipstick, burgundy turtleneck sweater, gentle knowing smile, cosy Kyoto bookshop with warm lamps",
  },
  "aria-blake": {
    subject: "woman",
    look: "beautiful, sleek platinum-blonde bob, smoky eyes, knowing half-smile, black satin blouse, rooftop bar at night with city lights bokeh",
  },
  "nadia-petrova": {
    subject: "woman",
    look: "Russian, beautiful, sleek blonde hair in a tight ballet bun, cool grey eyes, poised elegant expression, long-sleeved high-neck black rehearsal sweater, backstage theatre dressing room with mirror lights",
  },
  "leila-haddad": {
    subject: "woman",
    look: "Lebanese, beautiful, long dark wavy hair tied back, warm brown eyes, reassuring smile, navy scrubs with a stethoscope around her neck, hospital corridor at night",
  },
  "sienna-reyes": {
    subject: "woman",
    look: "Portuguese, beautiful, mature adult face, sun-kissed skin, long sun-bleached wavy hair, light freckles, bright smile, zipped-up wetsuit top, beach at golden hour with a surfboard",
  },
  // Famous — iconic historical likenesses, painted (never photos)
  "ada-lovelace": {
    subject: "woman",
    ageText: "in her late twenties",
    look: "Ada Lovelace, resembling her famous 1840 portrait by Alfred Chalon: dark hair parted in the middle with soft ringlets, gentle confident gaze, modest high-collared deep blue velvet gown with a lace collar buttoned to the throat, Victorian study with brass gears and handwritten equations",
  },
  "leonardo-da-vinci": {
    subject: "man",
    ageText: "elderly",
    look: "Leonardo da Vinci, resembling his famous red-chalk self-portrait: long wavy white hair and a long flowing white beard, deep-set wise eyes, dark red Renaissance robe, workshop with sketches of flying machines",
  },
  "marcus-aurelius": {
    subject: "man",
    ageText: "middle-aged",
    look: "the Roman emperor Marcus Aurelius, resembling his famous marble busts: thick curly brown hair, full curly beard, calm heavy-lidded eyes, white toga with purple trim, laurel wreath, marble colonnade",
  },
  cleopatra: {
    subject: "woman",
    ageText: "around thirty",
    look: "Cleopatra VII of Egypt, resembling Hellenistic depictions on her coins and busts: black hair braided back into a bun, royal diadem ribbon, gold jewellery, kohl-lined eyes, teal and gold royal garments, palace terrace over the Nile",
  },
  "nikola-tesla": {
    subject: "man",
    ageText: "in his thirties",
    look: "Nikola Tesla, resembling his famous 1890s photographs: slicked-back dark hair parted in the middle, thin neat moustache, intense deep-set eyes, dark suit with high white collar, laboratory with crackling electric coils",
  },
  "marie-curie": {
    subject: "woman",
    ageText: "in her forties",
    look: "Marie Curie, resembling her famous early-1900s photographs: dark-blonde hair pinned up loosely, serious gentle expression, plain high-collared black dress, laboratory with glassware and a faint glowing vial",
  },
  "william-shakespeare": {
    subject: "man",
    ageText: "in his forties",
    look: "William Shakespeare, resembling the Chandos portrait: receding hairline, dark hair to the collar, short dark beard and moustache, small gold hoop earring, white falling-band collar, black doublet, candlelit desk with quill",
  },
  "vincent-van-gogh": {
    subject: "man",
    ageText: "in his thirties",
    look: "Vincent van Gogh, resembling his famous self-portraits: short cropped red-orange hair, red beard, intense green-blue eyes, blue work jacket, background of swirling bold brushstrokes like his starry night paintings",
  },
  "frederic-chopin": {
    subject: "man",
    ageText: "in his thirties",
    look: "Frédéric Chopin, resembling his famous portraits: wavy light-brown hair, clean-shaven slender pale face, soulful eyes, dark tailcoat with a high white cravat, seated at a grand piano in a candlelit Parisian salon",
  },
  "nicolaus-copernicus": {
    subject: "man",
    ageText: "in his fifties",
    look: "Nicolaus Copernicus, resembling the famous Toruń portrait: shoulder-length dark hair, clean-shaven, thoughtful gaze, red Renaissance robe, holding a brass armillary sphere, night sky through a window",
  },
  "napoleon-bonaparte": {
    subject: "man",
    ageText: "in his thirties",
    look: "Napoleon Bonaparte, resembling Jacques-Louis David's famous portraits: short dark hair combed forward, clean-shaven, piercing eyes, hand tucked into his waistcoat, dark blue military uniform with gold epaulettes and the Légion d'honneur",
  },
  "wolfgang-amadeus-mozart": {
    subject: "man",
    ageText: "in his thirties",
    look: "Wolfgang Amadeus Mozart, resembling his famous portraits: powdered white wig tied back, bright playful eyes, red coat with a white lace jabot, harpsichord in a gilded Viennese salon",
  },
  "queen-elizabeth-i": {
    subject: "woman",
    ageText: "in her fifties",
    look: "Queen Elizabeth I of England, resembling the famous Armada Portrait: very pale face, curly red hair adorned with pearls, enormous white lace ruff collar, jewel-encrusted gown, regal steady gaze, royal palace",
  },
  "jane-austen": {
    subject: "woman",
    ageText: "in her thirties",
    look: "Jane Austen, resembling the famous portrait sketch by her sister Cassandra: brown curls under a white lace cap, bright amused eyes, high-waisted Regency dress, writing desk by a window in a Hampshire cottage",
  },
  "oscar-wilde": {
    subject: "man",
    ageText: "in his late twenties",
    look: "Oscar Wilde, resembling his famous 1882 photographs: long wavy dark hair, clean-shaven, heavy-lidded amused eyes, velvet jacket with a green carnation in the lapel, elegant Victorian drawing room",
  },
  "abraham-lincoln": {
    subject: "man",
    ageText: "in his fifties",
    look: "Abraham Lincoln, resembling his famous portraits: tall and gaunt, deep-set kind eyes, dark hair, chin beard without a moustache, black frock coat and bow tie, candlelit study",
  },
};
