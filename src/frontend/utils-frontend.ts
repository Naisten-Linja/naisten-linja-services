import styled from 'styled-components';

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
`;

export const StyledDataTableWrapperDiv = styled.div`
  .rdt_TableCell :focus,
  .rdt_TableCol_Sortable:focus {
    outline: 0.125rem solid #08c;
    outline-offset: -0.125rem; // this overrides the normal offset to avoid
    // drawing the outline outside of the parent
    // which would cause it to disappear because of
    // overflow: hidden; definitions.
  }
`;

export const StyledNav = styled.nav`
  ul {
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    list-style: none;
  }
  li {
    flex: none;
    margin: 0;
    padding-right: 1rem;
    padding-top: .4rem;
    padding-bottom: .4rem;
  }
  a {
    text-decoration: underline;
  }
  @media (max-width: 500px) {
    padding: 10px 0;

    ul {
      display: inline-block;
    }

    li {
      text-align: center;
      padding: 10px 0;
      display: block;
      margin-left: 0;
    }
  }
`;
