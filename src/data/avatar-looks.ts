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
    look: "ginger hair in a messy bun, round glasses, green hoodie, excited expression, library desk covered in colour-coded sticky notes",
  },
  "nora-quill": {
    subject: "woman",
    look: "silver hair in a neat bun, reading glasses, lavender cardigan, kind eyes, old library with a teapot and stacks of books",
  },
  "dex-okafor": {
    subject: "man",
    look: "Black, short twists, headphones around his neck, black graphic tee, playful grin, gaming room with soft RGB glow",
  },
  "lina-vasquez": {
    subject: "woman",
    look: "Latina, long dark wavy hair, gold hoop earrings, white linen shirt, backpack strap, bustling street-food market",
  },
  // Famous — historical, painted as imagined
  "ada-lovelace": {
    subject: "woman",
    ageText: "in her late twenties",
    look: "depicting Ada Lovelace as imagined in the 1840s, dark hair in a Victorian updo, deep blue velvet gown, study with brass gears and handwritten equations",
  },
  "leonardo-da-vinci": {
    subject: "man",
    ageText: "elderly",
    look: "depicting Leonardo da Vinci as imagined in the Renaissance, long flowing white beard and hair, dark red cap and robe, workshop with sketches and wooden flying machines",
  },
  "marcus-aurelius": {
    subject: "man",
    ageText: "middle-aged",
    look: "depicting the Roman emperor Marcus Aurelius as imagined, curly brown hair, full beard, laurel wreath, white toga with purple trim, marble colonnade",
  },
  cleopatra: {
    subject: "woman",
    ageText: "around thirty",
    look: "depicting Cleopatra VII as imagined, black braided hair, gold diadem, teal and gold ancient Egyptian garments, palace terrace over the Nile at dusk",
  },
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
};
