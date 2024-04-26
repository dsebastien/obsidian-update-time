import {parseDate} from "./parse-date.fn";
import {DATE_FORMAT} from "../constants";

describe(parseDate.name, () => {
  it('should return null if provided with nothing', () => {
    expect(parseDate(null, DATE_FORMAT)).toBeNull();
    expect(parseDate(undefined, DATE_FORMAT)).toBeNull();
    expect(parseDate('', DATE_FORMAT)).toBeNull();
  });

  it('should return null if it fails to parse the date', () => {
    expect(parseDate('foo', DATE_FORMAT)).toBeNull();
    expect(parseDate('1234', DATE_FORMAT)).toBeNull();
    expect(parseDate(new Date().toISOString(), DATE_FORMAT)).toBeNull();
    expect(parseDate(new Date().toString(), DATE_FORMAT)).toBeNull();
  });

  it('should return the parsed date if valid input is provided', () => {
    expect(parseDate(new Date().getTime(), DATE_FORMAT)).not.toBeNull();
    expect(parseDate('2024', 'yyyy')).not.toBeNull();
    expect(parseDate('2024-04', 'yyyy-MM')).not.toBeNull();
  });
});
