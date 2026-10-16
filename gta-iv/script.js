'use strict';

// The display only changes once a minute, unless the blinking colon shows the seconds.
const MINUTE_MS = 60_000;
const SECOND_MS = 1000;

// The date is always Dutch; a named locale keeps it independent of the Windows language.
const DATE_FORMAT = new Intl.DateTimeFormat('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' });

// Lively property name -> [CSS custom property, value converter]. Defaults live in style.css.
const CSS_PROPERTIES = {
  clockColor: ['--clock-color', String],
  clockSize: ['--clock-size', String],
  clockX: ['--clock-x', String],
  clockY: ['--clock-y', String],
  clockWeight: ['--clock-weight', String],
  showDate: ['--date-display', (value) => (value ? 'block' : 'none')],
  focusY: ['--focus-y', (value) => String(value / 100)],
};

const settings = {
  use24Hour: true,
  blinkColon: false,
};

const elements = {
  hours: document.querySelector('.clock__hours'),
  minutes: document.querySelector('.clock__minutes'),
  colon: document.querySelector('.clock__colon'),
  date: document.querySelector('.clock__date'),
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

// Pure: the date line, e.g. "vrijdag 16 oktober" (CSS shows it in capitals).
function formatDate(date) {
  return DATE_FORMAT.format(date);
}

function setText(element, text) {
  if (element.textContent !== text) {
    element.textContent = text;
  }
}

function render(now) {
  const time = formatTime(now, settings.use24Hour);
  setText(elements.hours, time.hours);
  setText(elements.minutes, time.minutes);
  setText(elements.date, formatDate(now));
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

// Global entry point: Lively calls it once per property on load and whenever a setting changes.
function livelyPropertyListener(name, value) {
  if (Object.hasOwn(CSS_PROPERTIES, name)) {
    const [cssProperty, toCss] = CSS_PROPERTIES[name];
    document.documentElement.style.setProperty(cssProperty, toCss(value));
    return;
  }

  switch (name) {
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

tick();
