# GTA Vice City Clock

Live wallpaper for [Lively Wallpaper](https://www.rocksdanister.com/lively/): a large clock with the date in Dutch,
standing in the Vice City scene behind Lucia. Plain HTML/CSS/JS, no build step, works offline.

## Files

| Path                    | Purpose                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `index.html`            | Page markup: background, clock, cutout                                                                |
| `style.css`             | Layout and look; every tunable value is a CSS variable in `:root`                                     |
| `script.js`             | Clock (ticks on the full minute, every second while the colon blinks), date, `livelyPropertyListener` |
| `LivelyInfo.json`       | Lively metadata (type web, `index.html`)                                                              |
| `LivelyProperties.json` | Settings shown in Lively's customise panel                                                            |
| `img/background.webp`   | The full artwork, 3840 x 2160 (WebP, quality 88)                                                      |
| `img/cutouts.png`       | Lucia and Jason cut out of the same artwork, same size, transparent elsewhere                         |
| `fonts/`                | Montserrat variable font and its licence                                                              |

The clock code matches `../porsche-911-black/script.js` on purpose: every wallpaper folder is a self-contained Lively
package, so they share no files.

## Artwork

The clock sits between the two images: the background is drawn first, then the clock, then the cutout on top, which
makes the clock appear behind the characters. Both images must have exactly the same size and framing, or the cutout
will not line up.

The background needs no transparency, so it is stored as WebP at quality 88: 0.9 MB instead of 8.6 MB as PNG, with a
mean difference of 1.9 (of 255) per colour channel. It was encoded with Chrome's canvas encoder
(`canvas.toDataURL('image/webp', 0.88)`). The cutout stays PNG for its exact transparent edges.

The artwork is scaled to cover the screen. Clock size and position are percentages of the artwork, not of the screen,
so the clock keeps its spot relative to Lucia on 16:9 and 21:9 alike:

- Screens wider than 16:9 crop the top and bottom; `--focus-y` (Lively: crop on wide screens) picks which part stays.
- Narrower and portrait screens crop the sides. The artwork then shifts so the clock is centred on screen, and the
  clock shrinks to at most 92% of the screen width.

## Settings

| Lively setting       | CSS variable     | Default   |
| -------------------- | ---------------- | --------- |
| Clock colour         | `--clock-color`  | `#FFFFFF` |
| Clock size           | `--clock-size`   | 26        |
| Clock position (x)   | `--clock-x`      | 28        |
| Clock position (y)   | `--clock-y`      | 10        |
| Clock weight         | `--clock-weight` | 800       |
| Show date            | `--date-display` | on        |
| 24-hour clock        | (script)         | on        |
| Blinking colon       | (script)         | off       |
| Crop on wide screens | `--focus-y`      | 30 (0.3)  |

Size and y are % of the artwork height, x is % of the artwork width. The defaults live twice, in `style.css` and in
`LivelyProperties.json`; keep them in sync. The date is formatted with the `nl-BE` locale, independent of the Windows
language. `--clock-width-em` is the measured width of the time in em; measure it again after changing the font,
weight or letter spacing, or portrait screens may clip the clock.

## Preview and packaging

Open `index.html` in a Chromium-based browser to preview it.

For Lively, zip the contents of this folder (with `LivelyInfo.json` at the root of the zip) and drag the zip onto
Lively. Zip files are ignored by git.

## Licence

The Montserrat font is licensed under the SIL Open Font License 1.1; see [fonts/OFL.txt](fonts/OFL.txt). The artwork
in `img/` is not covered by that licence.
