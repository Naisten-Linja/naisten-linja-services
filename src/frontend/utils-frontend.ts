// Return an objects with values mapping from a get query string
// param1=first&param2=second -> { param1: first, param2: second }
export function getQueryData(queryString: string) {
  const queryData = queryString
    .substr(1)
    .split('&')
    .reduce<Record<string, string> | Record<string, never>>((result, currentVal) => {
      const vals = currentVal.split('=');
      return {
        ...result,
        [vals[0]]: decodeURIComponent(vals[1]),
      };
    }, {});

  return queryData;
}
