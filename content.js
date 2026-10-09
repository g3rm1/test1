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
    tagline: "House · Techno · Disco",
    bio: "Write a few lines about yourself here: where you're based, the sound you play, the clubs and crews you work with.",
    // Optional photo: put the file in the "images/" folder, e.g. "images/me.jpg". Leave "" for none.
    photo: "",
    bookingEmail: "booking@example.com",
    // Remove any line you don't use.
    socials: {
      Instagram: "https://instagram.com/yourname",
      SoundCloud: "https://soundcloud.com/yourname",
      Mixcloud: "https://www.mixcloud.com/yourname/",
      Spotify: "",
      Bandcamp: "",
      YouTube: "",
    },
  },

  gigs: [
    {
      date: "2026-11-21",
      time: "23:00",
      venue: "Club Name",
      city: "Paris",
      event: "Event / party name",
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
      title: "Live at Club Name — Closing Set",
      date: "2026-09-12",
      description: "3 hours of deep house and minimal.",
      url: "https://soundcloud.com/forss/flickermood",
    },
    {
      title: "Studio Mix #01",
      date: "2026-07-02",
      description: "",
      url: "https://www.mixcloud.com/spartacus/party-time/",
    },
  ],

  tracks: [
    {
      title: "My First Track",
      date: "2026-08-01",
      label: "Self-released", // label name or ""
      description: "Original mix.",
      url: "https://soundcloud.com/forss/flickermood",
    },
    {
      title: "Another Track (Extended Mix)",
      date: "2026-03-15",
      label: "",
      description: "",
      url: "https://bandcamp.com",
    },
  ],
};
