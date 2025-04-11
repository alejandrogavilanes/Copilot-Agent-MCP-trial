import type { APIRoute } from 'astro';
import { publishList } from '../../../../stores/link-lists';

export const POST: APIRoute = async ({ params, redirect }) => {
  const { id } = params;
  if (!id) {
    return new Response('List ID is required', { status: 400 });
  }

  try {
    await publishList(id);
    return redirect(`/lists/${id}`);
  } catch (error) {
    return new Response('Failed to publish list', { status: 500 });
  }
};