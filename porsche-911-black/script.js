'use strict';

// Folder that holds the car images; Lively's folderDropdown points at the same folder.
const CAR_FOLDER = 'car';
const DEFAULT_CAR_IMAGE = 'car2.png';

// Pixels with alpha at or below this count as empty when trimming, so faint export noise does not keep padding alive.
const TRIM_ALPHA_THRESHOLD = 8;

// The display only changes once a minute, unless the blinking colon shows the seconds.
const MINUTE_MS = 60_000;
const SECOND_MS = 1000;

// Lively sliders count in scene units (--u in style.css): % of the screen height on landscape screens.
const toSceneUnits = (value) => `calc(${value} * var(--u))`;

// Lively property name -> [CSS custom property, value converter]. Defaults live in style.css.
const CSS_PROPERTIES = {
  carHeight: ['--car-height', toSceneUnits],
  carBottom: ['--car-bottom', toSceneUnits],
  reflectionStrength: ['--reflection-strength', (value) => String(value / 100)],
  clockColor: ['--clock-color', String],
  clockSize: ['--clock-size', toSceneUnits],
  clockTop: ['--clock-top', toSceneUnits],
  clockWeight: ['--clock-weight', String],
  backgroundColor: ['--bg-color', String],
};

const settings = {
  use24Hour: true,
  blinkColon: false,
};

const elements = {
  hours: document.querySelector('.clock__hours'),
  minutes: document.querySelector('.clock__minutes'),
  colon: document.querySelector('.clock__colon'),
  car: document.querySelector('.car'),
  carImage: document.querySelector('.car__image'),
  carReflection: document.querySelector('.car__reflection'),
};

function pad2(value) {
  return String(value).padStart(2, '0');
}

// Pure: the digits to show for a given moment. Both formats keep two hour digits so the layout never shifts.
function formatTime(date, use24Hour) {
  const hours = date.getHours();
  return {
    hours: pad2(use24Hour ? hours : hours % 12 || 12),
    minutes: pad2(date.getMinutes()),
  };
}

// Pure: turns a folderDropdown value ("file.png", "car\\file.png", "car/file.png" or null) into a page-relative URL.
function toCarImageUrl(value) {
  if (!value) {
    return null;
  }
  const parts = String(value)
    .split(/[\\/]+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return null;
  }
  if (parts.length === 1 || parts[0].toLowerCase() !== CAR_FOLDER) {
    parts.unshift(CAR_FOLDER);
  }
  return parts.map(encodeURIComponent).join('/');
}

// Pure: bounding box of the pixels whose alpha exceeds the threshold in RGBA data, or null when none do.
function findOpaqueBounds(rgba, width, height, alphaThreshold) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] > alphaThreshold) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }
  return right < 0 ? null : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

// Crops transparent padding off a loaded image, so the car's size and floor contact follow the visible car instead
// of the PNG canvas. Returns a data URL, or null when there is nothing to trim or the pixels cannot be read.
function trimTransparentPadding(image) {
  const { naturalWidth: width, naturalHeight: height } = image;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);

  let pixels;
  try {
    pixels = context.getImageData(0, 0, width, height).data;
  } catch (error) {
    // Browsers refuse pixel access for file:// pages; Lively serves the wallpaper from a host, where this works.
    console.warn('Cannot read car image pixels, showing it untrimmed.', error);
    return null;
  }

  const bounds = findOpaqueBounds(pixels, width, height, TRIM_ALPHA_THRESHOLD);
  if (!bounds || (bounds.width === width && bounds.height === height)) {
    return null;
  }
  const cropped = document.createElement('canvas');
  cropped.width = bounds.width;
  cropped.height = bounds.height;
  cropped
    .getContext('2d')
    .drawImage(image, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);
  return cropped.toDataURL('image/png');
}

function render(now) {
  const time = formatTime(now, settings.use24Hour);
  if (elements.hours.textContent !== time.hours) {
    elements.hours.textContent = time.hours;
  }
  if (elements.minutes.textContent !== time.minutes) {
    elements.minutes.textContent = time.minutes;
  }
  elements.colon.classList.toggle('clock__colon--dim', settings.blinkColon && now.getSeconds() % 2 === 1);
}

// Pure: milliseconds until the next whole multiple of the interval. Time zone offsets are whole minutes, so UTC minute
// boundaries are local minute boundaries too.
function msUntilNextBoundary(nowMs, intervalMs) {
  return intervalMs - (nowMs % intervalMs);
}

let tickTimer = 0;

function tick() {
  clearTimeout(tickTimer);
  render(new Date());
  // Re-align to the next boundary on every tick, so timer drift never accumulates.
  const interval = settings.blinkColon ? SECOND_MS : MINUTE_MS;
  tickTimer = setTimeout(tick, msUntilNextBoundary(Date.now(), interval));
}

function hideCar() {
  elements.car.hidden = true;
  elements.carImage.removeAttribute('src');
  elements.carReflection.removeAttribute('src');
}

// Bumped on every request, so a slow load never overwrites a car chosen later.
let carRequest = 0;

function setCarImage(value) {
  const request = ++carRequest;
  const url = toCarImageUrl(value);
  if (!url) {
    hideCar();
    return;
  }

  const loader = new Image();
  loader.addEventListener('load', () => {
    if (request !== carRequest) {
      return;
    }
    const src = trimTransparentPadding(loader) ?? url;
    elements.carImage.src = src;
    elements.carReflection.src = src;
  });
  loader.addEventListener('error', () => {
    if (request !== carRequest) {
      return;
    }
    // A missing image is a supported state: the page then shows only clock and floor.
    console.warn(`Car image not found: ${url}`);
    hideCar();
  });
  loader.src = url;
}

elements.carImage.addEventListener('load', () => {
  const { naturalWidth, naturalHeight } = elements.carImage;
  elements.car.style.setProperty('--car-aspect', String(naturalWidth / naturalHeight));
  elements.car.hidden = false;
});

// Global entry point: Lively calls it once per property on load and whenever a setting changes.
function livelyPropertyListener(name, value) {
  if (Object.hasOwn(CSS_PROPERTIES, name)) {
    const [cssProperty, toCss] = CSS_PROPERTIES[name];
    document.documentElement.style.setProperty(cssProperty, toCss(value));
    return;
  }

  switch (name) {
    case 'carImage':
      setCarImage(value);
      break;
    case 'use24Hour':
      settings.use24Hour = Boolean(value);
      render(new Date());
      break;
    case 'blinkColon':
      settings.blinkColon = Boolean(value);
      // Restart the timer, so switching to blinking does not wait for the pending minute tick.
      tick();
      break;
    default:
      console.warn(`Unknown Lively property: ${name}`);
  }
}

// Timers can fire late after the PC sleeps or the wallpaper is paused; re-sync as soon as the page is visible again.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    tick();
  }
});

setCarImage(DEFAULT_CAR_IMAGE);
tick();
