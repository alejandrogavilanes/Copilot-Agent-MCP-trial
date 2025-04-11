/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { addTag, removeTag, loadTagsForLink } from '../stores/link-lists';
import type { Tag } from '../utils/db';

interface TagsInputProps {
  linkId: string;
}

export default function TagsInput({ linkId }: TagsInputProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTags();
  }, [linkId]);

  async function loadTags() {
    try {
      const loadedTags = await loadTagsForLink(linkId);
      setTags(loadedTags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }

  async function handleAddTag(e: JSX.TargetedEvent<HTMLFormElement, Event>) {
    e.preventDefault();
    if (!newTag.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const tag = await addTag(linkId, newTag.trim());
      setTags([...tags, tag]);
      setNewTag('');
    } catch (error) {
      console.error('Failed to add tag:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveTag(tagId: string) {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await removeTag(linkId, tagId);
      setTags(tags.filter(t => t.id !== tagId));
    } catch (error) {
      console.error('Failed to remove tag:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleAddTag} class="flex items-center gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => setNewTag(e.currentTarget.value)}
          placeholder="Add a tag..."
          class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          class="inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded-md text-brand-700 bg-brand-100 hover:bg-brand-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
          disabled={isLoading || !newTag.trim()}
        >
          Add
        </button>
      </form>

      <div class="mt-2 flex flex-wrap gap-2">
        {tags.map(tag => (
          <span
            key={tag.id}
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800"
          >
            {tag.name}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              class="ml-1 inline-flex items-center p-0.5 rounded-full text-brand-400 hover:bg-brand-200 hover:text-brand-500 focus:outline-none"
              disabled={isLoading}
            >
              <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}