# DJ website

A simple one-page website for gigs, recorded DJ sets and productions.
No build tools, no database: everything you publish lives in **`content.js`**.

## Post something

Open `content.js` and edit it (on GitHub you can click the file, then the ✏️ pencil icon, then "Commit changes").

| To post…            | Add a block to | Notes |
|---------------------|----------------|-------|
| A future gig        | `gigs`         | `date` as `"YYYY-MM-DD"`. Gigs move to "Past gigs" automatically after the date. |
| A recorded DJ set   | `sets`         | Paste a SoundCloud, Mixcloud or YouTube link in `url`. The player is embedded for you. |
| A track you produced | `tracks`      | SoundCloud / YouTube / Spotify links get a player; Bandcamp, Beatport and other links get a "Listen on …" button. |

Example: adding a gig:

```js
{
  date: "2027-02-14",
  time: "23:00",
  venue: "Club Name",
  city: "Berlin",
  event: "Party name",
  tickets: "https://link-to-tickets",
},
```

Hosting your own audio files: put `.mp3` files in an `audio/` folder and use `url: "audio/file.mp3"`.
Photo: put it in `images/` and set `artist.photo: "images/me.jpg"`.

## Preview locally

Double-click `index.html`, or run `python3 -m http.server` and open http://localhost:8000.

## Put it online (free, with GitHub Pages)

1. Merge this into your repository's default branch.
2. On GitHub: **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**, pick your branch and `/ (root)`, then Save.
3. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

Every change you commit to `content.js` goes live automatically.
You can add your own domain (e.g. `djname.com`) under Settings → Pages → Custom domain.
