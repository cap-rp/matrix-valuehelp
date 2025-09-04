import type CalendarType from "sap/base/i18n/date/CalendarType";
import type CalendarWeekNumbering from "sap/base/i18n/date/CalendarWeekNumbering";
import DateFormat from "sap/ui/core/format/DateFormat";

type DateFormatOptions = {
	/**
	 * since 1.108.0 specifies the calendar week numbering. If specified, this overwrites `oFormatOptions.firstDayOfWeek`
	 * and `oFormatOptions.minimalDaysInFirstWeek`.
	 */
	calendarWeekNumbering?: CalendarWeekNumbering;
	/**
	 * since 1.105.0 specifies the first day of the week starting with `0` (which is Sunday); if not defined,
	 * the value taken from the locale is used
	 */
	firstDayOfWeek?: int;
	/**
	 * since 1.105.0 minimal days at the beginning of the year which define the first calendar week; if not
	 * defined, the value taken from the locale is used
	 */
	minimalDaysInFirstWeek?: int;
	/**
	 * since 1.34.0 contains pattern symbols (e.g. "yMMMd" or "Hms") which will be converted into the pattern
	 * in the used locale, which matches the wanted symbols best. The symbols must be in canonical order, that
	 * is: Era (G), Year (y/Y), Quarter (q/Q), Month (M/L), Week (w), Day-Of-Week (E/e/c), Day (d), Hour (h/H/k/K/j/J),
	 * Minute (m), Second (s), Timezone (z/Z/v/V/O/X/x) See {@link http://unicode.org/reports/tr35/tr35-dates.html#availableFormats_appendItems}
	 */
	format?: string;
	/**
	 * a data pattern in LDML format. It is not verified whether the pattern represents only a date.
	 */
	pattern?: string;
	/**
	 * can be either 'short, 'medium', 'long' or 'full'. If no pattern is given, a locale dependent default
	 * date pattern of that style is used from the LocaleData class.
	 */
	style?: string;
	/**
	 * if true, by parsing it is checked if the value is a valid date
	 */
	strictParsing?: boolean;
	/**
	 * if true, the date is formatted relatively to todays date if it is within the given day range, e.g. "today",
	 * "1 day ago", "in 5 days"
	 */
	relative?: boolean;
	/**
	 * the day range used for relative formatting. If `oFormatOptions.relativeScale` is set to default value
	 * 'day', the relativeRange is by default [-6, 6], which means only the last 6 days, today and the next
	 * 6 days are formatted relatively. Otherwise when `oFormatOptions.relativeScale` is set to 'auto', all
	 * dates are formatted relatively.
	 */
	relativeRange?: int[];
	/**
	 * if 'auto' is set, new relative time format is switched on for all Date/Time Instances. The relative scale
	 * is chosen depending on the difference between the given date and now.
	 */
	relativeScale?: string;
	/**
	 * since 1.32.10, 1.34.4 the style of the relative format. The valid values are "wide", "short", "narrow"
	 */
	relativeStyle?: string;
	/**
	 * since 1.48.0 if true, the {@link sap.ui.core.format.DateFormat#format format} method expects an array
	 * with two dates as the first argument and formats them as interval. Further interval "Jan 10, 2008 - Jan
	 * 12, 2008" will be formatted as "Jan 10-12, 2008" if the 'format' option is set with necessary symbols.
	 * Otherwise the two given dates are formatted separately and concatenated with local dependent pattern.
	 */
	interval?: boolean;
	/**
	 * Since 1.113.0, a delimiter for intervals. With a given interval delimiter a specific interval format
	 * is created. **Example:** If `oFormatOptions.intervalDelimiter` is set to "...", an interval would be
	 * given as "Jan 10, 2008...Feb 12, 2008". **Note:** If this format option is set, the locale-specific interval
	 * notation is overruled, for example "Jan 10 – Feb 12, 2008" becomes "Jan 10, 2008...Feb 12, 2008".
	 */
	intervalDelimiter?: string;
	/**
	 * Only relevant if oFormatOptions.interval is set to 'true'. This allows to pass an array with only one
	 * date object to the {@link sap.ui.core.format.DateFormat#format format} method.
	 */
	singleIntervalValue?: boolean;
	/**
	 * if true, the date is formatted and parsed as UTC instead of the local timezone
	 */
	UTC?: boolean;
	/**
	 * The calender type which is used to format and parse the date. This value is by default either set in
	 * configuration or calculated based on current locale.
	 */
	calendarType?: CalendarType;
};
const ExcelFormatHelper = {
	/**
	 * Method for converting JS Date format to Excel custom date format.
	 * @returns Format for the Date column to be used on excel.
	 */
	getExcelDatefromJSDate: function (): string | undefined {
		// Get date Format(pattern), which will be used for date format mapping between sapui5 and excel.
		// UI5_ANY
		let sJSDateFormat = (DateFormat.getDateInstance() as { oFormatOptions?: DateFormatOptions }).oFormatOptions?.pattern?.toLowerCase();
		if (sJSDateFormat) {
			// Checking for the existence of single 'y' in the pattern.
			const regex = /^[^y]*y[^y]*$/m;
			if (regex.exec(sJSDateFormat)) {
				sJSDateFormat = sJSDateFormat.replace("y", "yyyy");
			}
		}
		return sJSDateFormat;
	},
	getExcelDateTimefromJSDateTime: function (): string | undefined {
		// Get date Format(pattern), which will be used for date time format mapping between sapui5 and excel.
		// UI5_ANY
		let sJSDateTimeFormat = (
			DateFormat.getDateTimeInstance() as { oFormatOptions?: DateFormatOptions }
		).oFormatOptions?.pattern?.toLowerCase();
		if (sJSDateTimeFormat) {
			// Checking for the existence of single 'y' in the pattern.
			const regexYear = /^[^y]*y[^y]*$/m;
			if (regexYear.exec(sJSDateTimeFormat)) {
				sJSDateTimeFormat = sJSDateTimeFormat.replace("y", "yyyy");
			}
			if (sJSDateTimeFormat.includes("a")) {
				sJSDateTimeFormat = sJSDateTimeFormat.replace("a", "AM/PM");
			}
		}
		return sJSDateTimeFormat;
	},
	getExcelTimefromJSTime: function (): string | undefined {
		// Get date Format(pattern), which will be used for date time format mapping between sapui5 and excel.
		// UI5_ANY
		let sJSTimeFormat = (DateFormat.getTimeInstance() as { oFormatOptions?: DateFormatOptions }).oFormatOptions?.pattern;
		if (sJSTimeFormat && sJSTimeFormat.includes("a")) {
			sJSTimeFormat = sJSTimeFormat.replace("a", "AM/PM");
		}
		return sJSTimeFormat;
	}
};

export default ExcelFormatHelper;
