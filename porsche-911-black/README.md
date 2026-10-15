# Porsche 911 Black

Live wallpaper for [Lively Wallpaper](https://www.rocksdanister.com/lively/): a large digital clock (HH:MM) standing
behind a car on a glossy black floor. Plain HTML/CSS/JS, no build step, works offline.

## Files

| Path                    | Purpose                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| `index.html`            | Page markup                                                                                        |
| `style.css`             | Layout and look; every tunable value is a CSS variable in `:root`                                  |
| `script.js`             | Clock (ticks on the full minute, every second while the colon blinks) and `livelyPropertyListener` |
| `LivelyInfo.json`       | Lively metadata (type web, `index.html`)                                                           |
| `LivelyProperties.json` | Settings shown in Lively's customise panel                                                         |
| `car/`                  | Car images; the default is `car/car2.png`                                                          |
| `fonts/`                | Montserrat variable font and its licence                                                           |

## Car image

Car images are cut-out PNGs with transparency in `car/`; the default is `car/car2.png` and every other PNG in the folder
can be picked in Lively. Without an image the page shows only the clock and the floor.

Transparent padding around the car is trimmed when the image loads, so the car size and the floor contact follow the
visible car. The tyres should be the lowest visible pixels: a shadow baked into the PNG ends up below them. The
image is scaled up to the car size setting, so use a source at least as tall in pixels as the car is on screen.

The defaults were tuned with `car/car2.png` (a side view of about 3.3:1 after trimming). Another image may
need the car size, clock size and clock position settings adjusted so the roof covers the bottom of the digits but not
the colon.

## Settings

All settings scale with the screen height, so they behave the same on 16:9 and 21:9. One exception: the car never gets
wider than 94% of the screen (`--car-max-width`), so on 16:9 it can stay smaller than the car size setting.

| Lively setting      | CSS variable            | Default    |
| ------------------- | ----------------------- | ---------- |
| Car image           | (image source)          | `car2.png` |
| Car size            | `--car-height`          | 40vh       |
| Car position        | `--car-bottom`          | 10vh       |
| Reflection strength | `--reflection-strength` | 0.22       |
| Clock colour        | `--clock-color`         | `#C8CBD0`  |
| Clock size          | `--clock-size`          | 44vh       |
| Clock position      | `--clock-top`           | 21vh       |
| Clock weight        | `--clock-weight`        | 700        |
| Background colour   | `--bg-color`            | `#1C1F24`  |
| 24-hour clock       | (script)                | on         |
| Blinking colon      | (script)                | off        |

The defaults live twice, in `style.css` (the car image in `DEFAULT_CAR_IMAGE` in `script.js`) and in
`LivelyProperties.json`; keep them in sync. Values without a Lively
setting (floor, horizon, letter spacing, colon offset, shadow) are only in `style.css`.

## Preview and packaging

Open `index.html` in a Chromium-based browser to preview it. Opened as a file, the browser blocks reading the image's
pixels, so the car is shown untrimmed there; serve the folder over HTTP to see it as Lively does.

For Lively, zip the contents of this folder (with `LivelyInfo.json` at the root of the zip, including the `car/` folder)
and drag the zip onto Lively. Zip files are ignored by git.

## Licence

The Montserrat font is licensed under the SIL Open Font License 1.1; see [fonts/OFL.txt](fonts/OFL.txt).
