import * as R from 'ramda';
import camelcase from 'camelcase';

type CamelCase = <T>(arg: T) => T;

// eslint-disable-next-line
export const camelcaseString: CamelCase = R.when<any, any>(R.is(String), camelcase);