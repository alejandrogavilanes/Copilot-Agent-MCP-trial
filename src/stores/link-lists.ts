import { atom, map } from 'nanostores';
import { nanoid } from 'nanoid';
import slugify from 'slugify';
import { query } from '../utils/db';
import { fetchUrlMetadata } from '../utils/metadata';
import type { LinkList, Link, Tag, SearchResult } from '../utils/db';

// Stores
export const userLists = atom<LinkList[]>([]);
export const currentLinks = atom<Link[]>([]);
export const currentTags = atom<Tag[]>([]);

// List Management
export async function createList(title: string, description?: string | null): Promise<LinkList> {
  const slug = generateSlug(title);
  const result = await query(
    'INSERT INTO link_lists (title, description, slug) VALUES ($1, $2, $3) RETURNING *',
    [title, description, slug]
  );
  const list = result.rows[0];
  userLists.set([...userLists.get(), list]);
  return list;
}

export async function loadList(slug: string): Promise<LinkList | null> {
  const result = await query('SELECT * FROM link_lists WHERE slug = $1', [slug]);
  if (result.rows.length === 0) return null;
  return result.rows[0];
}

export async function publishList(id: string): Promise<void> {
  await query('UPDATE link_lists SET is_published = true WHERE id = $1', [id]);
  const lists = userLists.get();
  const index = lists.findIndex(list => list.id === id);
  if (index !== -1) {
    lists[index].is_published = true;
    userLists.set([...lists]);
  }
}

export async function deleteList(id: string): Promise<void> {
  await query('DELETE FROM link_lists WHERE id = $1', [id]);
  const lists = userLists.get();
  userLists.set(lists.filter(list => list.id !== id));
}

// Link Management
export async function addLink(listId: string, url: string): Promise<Link> {
  const metadata = await fetchUrlMetadata(url);
  
  // Get highest order_index for the list
  const orderResult = await query(
    'SELECT COALESCE(MAX(order_index), -1) as max_order FROM links WHERE list_id = $1',
    [listId]
  );
  const nextOrder = orderResult.rows[0].max_order + 1;

  const result = await query(
    'INSERT INTO links (list_id, url, title, description, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [listId, url, metadata.title, metadata.description, nextOrder]
  );
  
  const link = result.rows[0];
  currentLinks.set([...currentLinks.get(), link]);
  return link;
}

export async function updateLink(id: string, url: string): Promise<Link> {
  const metadata = await fetchUrlMetadata(url);
  const result = await query(
    'UPDATE links SET url = $1, title = $2, description = $3 WHERE id = $4 RETURNING *',
    [url, metadata.title, metadata.description, id]
  );
  
  const updatedLink = result.rows[0];
  const links = currentLinks.get();
  const index = links.findIndex(link => link.id === id);
  
  if (index !== -1) {
    links[index] = updatedLink;
    currentLinks.set([...links]);
  }
  
  return updatedLink;
}

export async function deleteLink(id: string): Promise<void> {
  await query('DELETE FROM links WHERE id = $1', [id]);
  const links = currentLinks.get();
  currentLinks.set(links.filter(link => link.id !== id));
}

export async function updateLinkOrder(id: string, newIndex: number): Promise<void> {
  const links = currentLinks.get();
  const currentIndex = links.findIndex(link => link.id === id);
  if (currentIndex === -1) return;

  const [link] = links.splice(currentIndex, 1);
  links.splice(newIndex, 0, link);
  
  // Update order_index for all affected links
  const updates = links.map((link, index) => 
    query('UPDATE links SET order_index = $1 WHERE id = $2', [index, link.id])
  );
  
  await Promise.all(updates);
  currentLinks.set([...links]);
}

export async function refreshMetadata(id: string): Promise<Link> {
  const links = currentLinks.get();
  const link = links.find(l => l.id === id);
  if (!link) throw new Error('Link not found');

  const metadata = await fetchUrlMetadata(link.url);
  const result = await query(
    'UPDATE links SET title = $1, description = $2 WHERE id = $3 RETURNING *',
    [metadata.title, metadata.description, id]
  );
  
  const updatedLink = result.rows[0];
  const index = links.findIndex(l => l.id === id);
  
  if (index !== -1) {
    links[index] = updatedLink;
    currentLinks.set([...links]);
  }
  
  return updatedLink;
}

// Tag Management
export async function addTag(linkId: string, tagName: string): Promise<Tag> {
  // First try to get existing tag
  let tagResult = await query('SELECT * FROM tags WHERE name = $1', [tagName.toLowerCase()]);
  
  let tag: Tag;
  if (tagResult.rows.length === 0) {
    // Create new tag if it doesn't exist
    tagResult = await query(
      'INSERT INTO tags (name) VALUES ($1) RETURNING *',
      [tagName.toLowerCase()]
    );
    tag = tagResult.rows[0];
  } else {
    tag = tagResult.rows[0];
  }

  // Add tag to link
  await query(
    'INSERT INTO link_tags (link_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [linkId, tag.id]
  );

  // Update store
  const links = currentLinks.get();
  const linkIndex = links.findIndex(l => l.id === linkId);
  if (linkIndex !== -1) {
    const link = links[linkIndex];
    link.tags = [...(link.tags || []), tag];
    currentLinks.set([...links]);
  }

  return tag;
}

export async function removeTag(linkId: string, tagId: string): Promise<void> {
  await query('DELETE FROM link_tags WHERE link_id = $1 AND tag_id = $2', [linkId, tagId]);

  // Update store
  const links = currentLinks.get();
  const linkIndex = links.findIndex(l => l.id === linkId);
  if (linkIndex !== -1) {
    const link = links[linkIndex];
    link.tags = link.tags?.filter(t => t.id !== tagId);
    currentLinks.set([...links]);
  }
}

export async function loadTagsForLink(linkId: string): Promise<Tag[]> {
  const result = await query(`
    SELECT t.* 
    FROM tags t
    JOIN link_tags lt ON lt.tag_id = t.id
    WHERE lt.link_id = $1
    ORDER BY t.name
  `, [linkId]);
  return result.rows;
}

// Search functionality
export async function searchLinks(listId: string, query: string): Promise<SearchResult[]> {
  const result = await query(`
    SELECT l.*, ts_rank(l.search_vector, websearch_to_tsquery('english', $1)) as rank
    FROM links l
    WHERE l.list_id = $2 
    AND l.search_vector @@ websearch_to_tsquery('english', $1)
    ORDER BY rank DESC
  `, [query, listId]);
  
  return result.rows.map(row => ({
    link: {
      id: row.id,
      list_id: row.list_id,
      url: row.url,
      title: row.title,
      description: row.description,
      order_index: row.order_index,
      created_at: row.created_at,
      updated_at: row.updated_at
    },
    rank: row.rank
  }));
}

// Bulk import functionality
export async function bulkImportUrls(listId: string, urls: string[]): Promise<Link[]> {
  const orderResult = await query(
    'SELECT COALESCE(MAX(order_index), -1) as max_order FROM links WHERE list_id = $1',
    [listId]
  );
  let nextOrder = orderResult.rows[0].max_order + 1;

  const newLinks: Link[] = [];
  for (const url of urls) {
    try {
      const metadata = await fetchUrlMetadata(url);
      const result = await query(
        'INSERT INTO links (list_id, url, title, description, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [listId, url, metadata.title, metadata.description, nextOrder++]
      );
      newLinks.push(result.rows[0]);
    } catch (error) {
      console.error(`Failed to import URL: ${url}`, error);
    }
  }

  currentLinks.set([...currentLinks.get(), ...newLinks]);
  return newLinks;
}

// Helpers
function generateSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true });
  return `${base}-${nanoid(6)}`;
}