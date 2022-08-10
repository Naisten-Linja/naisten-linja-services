import styled from "styled-components";

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

/**
 * The turretcss style library sets all inputs to have height: 2.5rem,
 * but the react-select library does not need that. With this wrapper
 * around the `Select` component everything works as expected.
 */
export const OverrideTurretInputHeightForReactSelectDiv = styled.div`
  input {
    height: auto;
  }
`