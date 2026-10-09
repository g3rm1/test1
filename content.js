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
    tagline: "", // optional line under the logo, e.g. "feeling groovy"
    bio: "Paris based ",
    // Optional photo: put the file in the "images/" folder, e.g. "images/me.jpg". Leave "" for none.
    photo: "",
    bookingEmail: "booking@example.com",
    // Remove any line you don't use.
    socials: {
      Instagram: "https://instagram.com/yourname",
      SoundCloud: "https://soundcloud.com/yourname",
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
      url: "https://on.soundcloud.com/occgcQX6qPFHogPoMt",
    },
  ],

  // Add your productions here, same format as sets, plus an optional "label".
  tracks: [],
};
