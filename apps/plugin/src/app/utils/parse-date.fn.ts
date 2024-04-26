import { parse } from 'date-fns';
import { log } from './log';

export const parseDate = (
  input: number | string | undefined | null,
  dateFormat: string
): Date | null => {
  if (!input) {
    return null;
  }

  if (typeof input === 'string') {
    try {
      const parsedDate = parse(input, dateFormat, new Date());

      if (isNaN(parsedDate.getTime())) {
        return null;
      }

      return parsedDate;
    } catch (e: unknown) {
      console.log(e);
      log(`Error while parsing a date: [${input}]`, 'debug', e);
      return null;
    }
  }

  return new Date(input);
};
