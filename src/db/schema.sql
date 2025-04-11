-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add table and column descriptions for users
COMMENT ON TABLE users IS 'Stores user information for The Urlist platform';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the user was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when the user was last updated';

-- Create link_lists table
CREATE TABLE IF NOT EXISTS link_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200),
    description TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add table and column descriptions for link_lists
COMMENT ON TABLE link_lists IS 'Stores collections of URLs created by users';
COMMENT ON COLUMN link_lists.id IS 'Unique identifier for the link list';
COMMENT ON COLUMN link_lists.user_id IS 'Reference to the user who owns this list';
COMMENT ON COLUMN link_lists.slug IS 'Custom URL-friendly identifier for the list';
COMMENT ON COLUMN link_lists.title IS 'Display title of the link list';
COMMENT ON COLUMN link_lists.description IS 'Optional description of the link list';
COMMENT ON COLUMN link_lists.is_published IS 'Whether the list is publicly accessible';
COMMENT ON COLUMN link_lists.created_at IS 'Timestamp when the list was created';
COMMENT ON COLUMN link_lists.updated_at IS 'Timestamp when the list was last updated';

-- Create links table
CREATE TABLE IF NOT EXISTS links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID REFERENCES link_lists(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title VARCHAR(200),
    description TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add table and column descriptions for links
COMMENT ON TABLE links IS 'Stores individual URLs within link lists';
COMMENT ON COLUMN links.id IS 'Unique identifier for the link';
COMMENT ON COLUMN links.list_id IS 'Reference to the parent link list';
COMMENT ON COLUMN links.url IS 'The actual URL being stored';
COMMENT ON COLUMN links.title IS 'Display title for the URL';
COMMENT ON COLUMN links.description IS 'Optional description of the URL';
COMMENT ON COLUMN links.order_index IS 'Position of the URL within the list for ordering';
COMMENT ON COLUMN links.created_at IS 'Timestamp when the link was added';
COMMENT ON COLUMN links.updated_at IS 'Timestamp when the link was last updated';

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create link_tags junction table
CREATE TABLE IF NOT EXISTS link_tags (
    link_id UUID REFERENCES links(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (link_id, tag_id)
);

-- Add search vector column to links table for full-text search
ALTER TABLE links ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS links_search_idx ON links USING gin(search_vector);

-- Create trigger to update search vector
CREATE OR REPLACE FUNCTION links_search_trigger() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', NEW.url), 'C');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS links_search_update ON links;
CREATE TRIGGER links_search_update
    BEFORE INSERT OR UPDATE ON links
    FOR EACH ROW
    EXECUTE FUNCTION links_search_trigger();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_link_lists_slug ON link_lists(slug);
CREATE INDEX IF NOT EXISTS idx_link_lists_user ON link_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_links_list ON links(list_id);
CREATE INDEX IF NOT EXISTS idx_links_order ON links(list_id, order_index);

-- Add additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_lists_published ON link_lists(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_link_tags_tag ON link_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_name_trgm ON tags USING gin(name gin_trgm_ops);

-- Add status column to track link validation
ALTER TABLE links ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
CREATE INDEX IF NOT EXISTS idx_links_status ON links(status);

-- Add validation timestamp
ALTER TABLE links ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMP WITH TIME ZONE;

-- Add metadata fields
ALTER TABLE links ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE links ADD COLUMN IF NOT EXISTS og_image_url TEXT;
ALTER TABLE links ADD COLUMN IF NOT EXISTS content_type TEXT;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_link_lists_updated_at ON link_lists;
DROP TRIGGER IF EXISTS update_links_updated_at ON links;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_lists_updated_at
    BEFORE UPDATE ON link_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_links_updated_at
    BEFORE UPDATE ON links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();