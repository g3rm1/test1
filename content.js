/*
 * ============================================================
 *  YOUR CONTENT — this is the only file you need to edit.
 * ============================================================
 *
 *  - Add a gig / set / track by copying an existing { ... } block
 *    and changing the values. Keep the comma between blocks.
 *  - Dates use the format "YYYY-MM-DD" (e.g. "2026-11-21").
 *  - Gigs are sorted automatically: future dates show under
 *    "Upcoming", past dates move to "Past gigs" by themselves.
 *  - For sets and tracks, paste a link from SoundCloud, Mixcloud,
 *    YouTube or Spotify in "url" and the player is embedded
 *    automatically. Any other link (Bandcamp, Beatport, ...) is
 *    shown as a button. You can also point to an audio file you
 *    put in the "audio/" folder, e.g. "audio/my-track.mp3".
 */

window.SITE = {
  artist: {
    name: "germ1",
    accent: "last", // letter of the name in orange: "first" or "last"
    tagline: "", // optional line under the logo, e.g. "feeling groovy"
    bio: "Paris based ",
    // Optional photo: put the file in the "images/" folder, e.g. "images/me.jpg". Leave "" for none.
    photo: "",
    bookingEmail: "booking@example.com",
    // Remove any line you don't use.
    socials: {
      Instagram: "https://instagram.com/yourname",
      SoundCloud: "https://soundcloud.com/g_erm1",
      Spotify: "",
      Bandcamp: "",
      YouTube: "",
    },
  },

  gigs: [
    {
      date: "2026-10-09",
      time: "23:00",
      venue: "Mish Mish",
      city: "Paris 11",
      event: "Opening",
      tickets: "https://example.com/tickets", // "" if no ticket link
    },
    {
      date: "2026-12-31",
      time: "22:00",
      venue: "Another Venue",
      city: "Lyon",
      event: "New Year's Eve",
      tickets: "",
    },
    {
      date: "2026-06-14",
      time: "20:00",
      venue: "Open-air Festival",
      city: "Marseille",
      event: "Summer Opening",
      tickets: "",
    },
  ],

  sets: [
    {
      title: "", // left empty: the title is taken from SoundCloud
      date: "",
      description: "",
      url: "https://soundcloud.com/g_erm1/rec01",
    },
  ],

  // Add your productions here, same format as sets, plus an optional "label".
  tracks: [],

  // ---- The alias page (alias.html, reached by clicking the dot of the symbol) ----
  // Same format as above. Empty sections are hidden automatically.
  alias: {
    artist: {
      name: "D-Grüv", // the alias's name
      accent: "first", // letter of the name in orange: "first" or "last"
      bio: "Coming soon.",
      photo: "",
      bookingEmail: "",
      socials: {
        Instagram: "",
        SoundCloud: "https://soundcloud.com/d_gruv",
      },
    },
    // Example dates (made up): replace them with real ones
    gigs: [
      {
        date: "2026-11-07",
        time: "00:00",
        venue: "Le Sous-Sol",
        city: "Paris 10",
        event: "Late Night Grooves",
        tickets: "",
      },
      {
        date: "2026-11-28",
        time: "23:30",
        venue: "Hangar 9",
        city: "Bordeaux",
        event: "D-Grüv All Night Long",
        tickets: "",
      },
      {
        date: "2027-01-17",
        time: "22:00",
        venue: "La Cave",
        city: "Lille",
        event: "Winter Warm-up",
        tickets: "",
      },
      {
        date: "2026-09-20",
        time: "23:00",
        venue: "Rooftop 21",
        city: "Marseille",
        event: "End of Summer",
        tickets: "",
      },
    ],
    sets: [],
    tracks: [],
  },
};
