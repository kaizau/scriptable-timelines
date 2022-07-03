// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: calendar;

//
// Config
//

const birthday = new Date(1970, 0, 1); // Month starts with 0: 0 => Jan, 1 => Feb, 11 => Dec
const estimatedLifespan = 75;

const calendarUrl = "fantastical://";
const calendarsToHide = [/^\w+ Holidays$/, "Hide This Calendar"];

const enableDailyNote = true;
const noteUrl = "obsidian://";
const noteFileBookmark = "Obsidian Daily Note";
const noteEmptyText = "☀️ Rise and shine!";

//
// Advanced Config
//

const now = new Date();
const format = new DateFormat();

const noteRelativePath = () => `${format.timestamp.string(now)}.md`;
const noteProcessIntoLines = (note) => {
  const lines = note
    .split("\n")
    .filter((line) => line.startsWith("- [ ] ") && line !== "- [ ] ")
    .slice(0, 4)
    .map((line) => line.replace("- [ ] ", "⧠ "));
  if (!lines.length) {
    lines.push("✅ All done!");
  }
  return lines;
};

//
// Widget + Layout
//

let stackSpacing = enableDailyNote ? 10 : 15;
let timelineWidth = enableDailyNote ? 50 : 70;
let timelineHeight = 4;
let calendarWidth = 115;
let noteWidth = 115;
let fontNormal = 11;
let fontCalendarAllDaySymbol = 9;
let fontCalendarTimedSymbol = 4;
let fontCalendarTimed = 9;

const isExtraLarge =
  config.widgetFamily === "extraLarge" ||
  (!config.widgetFamily && Device.isPad());
if (isExtraLarge) {
  stackSpacing = stackSpacing * 2;
  timelineWidth = timelineWidth * 2;
  timelineHeight = timelineHeight * 2;
  calendarWidth = calendarWidth * 2;
  noteWidth = noteWidth * 2;
  fontNormal = 16;
  fontCalendarAllDaySymbol = 13;
  fontCalendarTimedSymbol = 7;
  fontCalendarTimed = 13;
}

const lineLimit = 3;
const colorBackground = Color.dynamic(
  new Color("#ffffff", 0.25),
  new Color("#222222", 0.25)
);
const colorText = Color.dynamic(new Color("#222222"), new Color("#ffffff"));

const widget = new ListWidget();
widget.backgroundColor = colorBackground;

const wrapper = widget.addStack();
wrapper.spacing = stackSpacing;

const timelineCol = addColumn(wrapper);
timelineCol.size = new Size(timelineWidth, 0);
createTimeline(timelineCol);

const calendarCol = addColumn(wrapper);
await createCalendar(calendarCol);

if (enableDailyNote) {
  calendarCol.size = new Size(calendarWidth, 0);
  const noteCol = addColumn(wrapper);
  noteCol.size = new Size(noteWidth, 0);
  createDailyNote(noteCol);
}

//
// Run
//

if (config.runsInWidget) {
  Script.setWidget(widget);
} else if (Device.isPad()) {
  widget.presentExtraLarge();
} else {
  widget.presentMedium();
}
Script.complete();

//
// Util
//

function addColumn(parent) {
  const col = parent.addStack();
  col.layoutVertically();
  return col;
}

function DateFormat() {
  this.dayOfWeek = new DateFormatter();
  this.dayOfWeek.dateFormat = "EEE";

  this.month = new DateFormatter();
  this.month.dateFormat = "MMM";

  this.date = new DateFormatter();
  this.date.useShortDateStyle();
  this.date.useNoTimeStyle();

  this.time = new DateFormatter();
  this.time.useNoDateStyle();
  this.time.useShortTimeStyle();

  this.timestamp = new DateFormatter();
  this.timestamp.dateFormat = "yyyy-MM-dd";
}

//
// Timelines
//

function createTimeline(stack) {
  stack.url = calendarUrl;

  createTimelineItem(stack, 7, now.getDay() + 1, format.dayOfWeek.string(now));
  createTimelineItem(
    stack,
    24 * 60,
    (now.getHours() + 1) * 60 + now.getMinutes(),
    ordinalize(now.getDate())
  );
  createTimelineItem(
    stack,
    daysInMonth(now.getMonth() + 1, now.getFullYear()),
    now.getDate(),
    format.month.string(now)
  );
  createTimelineItem(
    stack,
    12,
    now.getMonth() + 1,
    now.getFullYear().toString()
  );

  const lastBirthday = new Date(
    now.getFullYear(),
    birthday.getMonth(),
    birthday.getDate()
  );
  if (
    lastBirthday > now &&
    !(
      now.getMonth() === birthday.getMonth() &&
      now.getDate() === birthday.getDate()
    )
  ) {
    lastBirthday.setFullYear(now.getFullYear() - 1);
  }
  const msSinceLastBirthday = now - lastBirthday;
  const daysThisYear = isLeapYear(now.getFullYear()) ? 366 : 365;
  const fractionalAge =
    msSinceLastBirthday / (daysThisYear * 24 * 60 * 60 * 1000);
  const diffYears =
    Math.abs(new Date(now - birthday).getUTCFullYear() - 1970) + fractionalAge;
  createTimelineItem(stack, estimatedLifespan, diffYears, diffYears.toFixed(3));
}

function ordinalize(num) {
  if (num === 1) {
    return "1st";
  } else if (num === 2) {
    return "2nd";
  } else {
    return num + "th";
  }
}

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function isLeapYear(year) {
  return new Date(year, 1, 29).getDate() === 29;
}

function createTimelineItem(stack, total, elapsed, label) {
  const title = stack.addText(label);
  title.textColor = colorText;
  title.font = Font.systemFont(fontNormal);
  stack.addSpacer(1);
  const img = stack.addImage(createProgressBar(total, elapsed));
  img.imageSize = new Size(timelineWidth, timelineHeight);
  stack.addSpacer(4);
}

function createProgressBar(total, elapsed) {
  const context = new DrawContext();
  context.size = new Size(timelineWidth, timelineHeight);
  context.opaque = false;
  context.respectScreenScale = true;
  context.setFillColor(new Color("#48484b"));
  const path = new Path();
  path.addRoundedRect(
    new Rect(0, 0, timelineWidth, timelineHeight),
    timelineHeight / 2,
    timelineHeight / 2
  );
  context.addPath(path);
  context.fillPath();
  context.setFillColor(new Color("#ffd60a"));
  const path1 = new Path();
  path1.addRoundedRect(
    new Rect(0, 0, (timelineWidth * elapsed) / total, timelineHeight),
    timelineHeight / 2,
    timelineHeight / 2
  );
  context.addPath(path1);
  context.fillPath();
  return context.getImage();
}

//
// Calendar
//

async function createCalendar(stack) {
  stack.url = calendarUrl;

  const events = await CalendarEvent.today();
  events
    .filter((event) =>
      calendarsToHide.every((pattern) =>
        pattern instanceof RegExp
          ? !event.calendar.title.match(pattern)
          : pattern.trim() !== event.calendar.title.trim()
      )
    )
    .filter((event) => event.endDate > now)
    .slice(0, 4)
    .forEach((event) => createCalendarEvent(stack, event));
}

function createCalendarEvent(stack, event) {
  const item = stack.addStack();
  item.centerAlignContent();

  // All day event
  if (event.isAllDay) {
    const symbol = item.addText("\u258D");
    symbol.font = Font.systemFont(fontCalendarAllDaySymbol);
    symbol.textColor = event.calendar.color;

    const eventTitle = item.addText(event.title);
    eventTitle.lineLimit = lineLimit;
    eventTitle.textColor = colorText;
    eventTitle.font = Font.systemFont(fontNormal);
  }

  // Timed event
  else {
    const symbol = item.addText("\u2B24");
    symbol.font = Font.systemFont(fontCalendarTimedSymbol);
    symbol.textColor = event.calendar.color;
    item.addSpacer(4);

    let dateString = "";
    const todayDate = format.date.string(now);
    const startDate = format.date.string(event.startDate);
    const endDate = format.date.string(event.endDate);
    if (startDate === todayDate) {
      dateString += format.time.string(event.startDate) + "-";
    } else {
      dateString += "ends ";
    }
    if (endDate !== todayDate) {
      dateString += format.dayOfWeek.string(event.endDate) + " ";
    }
    dateString += format.time.string(event.endDate);

    const eventTime = item.addText(dateString);
    eventTime.textColor = colorText;
    eventTime.font = Font.systemFont(fontCalendarTimed);

    // Add directly to calendar stack to avoid making layout more complex
    const eventDetails = stack.addStack();
    eventDetails.setPadding(0, 9, 0, 0);
    const eventTitle = eventDetails.addText(event.title);
    eventTitle.lineLimit = lineLimit;
    eventTitle.textColor = colorText;
    eventTitle.font = Font.systemFont(fontNormal);
  }

  stack.addSpacer(4);
}

//
// Daily Note
//

async function createDailyNote(stack) {
  stack.url = noteUrl;

  const fm = FileManager.iCloud();
  const rootPath = fm.bookmarkedPath(noteFileBookmark);
  const notePath = `${rootPath}/${noteRelativePath()}`;

  let lines;
  if (fm.fileExists(notePath)) {
    if (!fm.isFileDownloaded(notePath)) {
      await fm.downloadFileFromiCloud(notePath);
    }
    lines = noteProcessIntoLines(fm.readString(notePath));
  } else {
    lines = [noteEmptyText];
  }

  lines.forEach((line) => {
    const text = stack.addText(line);
    text.textColor = colorText;
    text.lineLimit = lineLimit;
    text.font = Font.regularMonospacedSystemFont(fontNormal);
    stack.addSpacer(4);
  });
}
