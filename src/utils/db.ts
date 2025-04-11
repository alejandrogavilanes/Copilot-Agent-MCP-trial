import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION || 'postgresql://postgres:postgres@localhost:5432/link-page-db'
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export type LinkList = {
  id: string;
  user_id: string;
  slug: string;
  title: string | null;
  description: string | null;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
};

export type Link = {
  id: string;
  list_id: string;
  url: string;
  title: string | null;
  description: string | null;
  order_index: number;
  created_at: Date;
  updated_at: Date;
  tags?: Tag[];
  favicon_url?: string | null;
  og_image_url?: string | null;
  content_type?: string | null;
  status?: string;
  last_validated_at?: Date;
};

export type Tag = {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
};

export type SearchResult = {
  link: Link;
  rank: number;
};