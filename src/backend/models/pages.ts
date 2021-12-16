import db from '../db';

export interface Page {
  uuid: string;
  created: string;
  content: string;
  title: string;
  slug: string;
}

export interface PageQueryResult {
  id: number;
  uuid: string;
  created: string;
  content: string;
  title: string;
  slug: string;
}

export interface UpdatePageParams {
  uuid: string;
  slug: string;
  content: string;
  title: string;
}

function queryResultToPage(page: PageQueryResult): Page {
  const { uuid, slug, content, title, created } = page;
  return {
    uuid,
    slug,
    content,
    title,
    created,
  };
}

export async function getAllPages(): Promise<Array<Page> | null> {
  try {
    const queryText = `
      SELECT *
      FROM pages;
    `;
    const result = await db.query<PageQueryResult>(queryText, []);
    return result.rows.map((r) => queryResultToPage(r));
  } catch (err) {
    console.error('Failed to fetch all pages');
    console.error(err);
    return null;
  }
}

export async function updatePage({
  uuid,
  slug,
  content,
  title,
}: UpdatePageParams): Promise<Page | null> {
  try {
    const queryText = `
      UPDATE pages
      SET slug=$1::text, title=$2::text, content=$3::text
      WHERE uuid=$4::text
      RETURNING *
    `;
    const result = await db.query<PageQueryResult>(queryText, [slug, title, content, uuid]);
    if (result.rows.length < 1) {
      return null;
    }
    return queryResultToPage(result.rows[0]);
  } catch (err) {
    console.error(`Failed to update page ${uuid}`);
    console.error(err);
    return null;
  }
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const queryText = `
      SELECT * FROM pages
      WHERE slug=$1::text;
    `;
    const result = await db.query<PageQueryResult>(queryText, [slug]);
    if (result.rows.length < 1) {
      return null;
    }
    return queryResultToPage(result.rows[0]);
  } catch (err) {
    console.error(`Unable to find page with slug ${slug}`);
    console.error(err);
    return null;
  }
}
