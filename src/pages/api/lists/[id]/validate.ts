import type { APIRoute } from 'astro';
import { validateLinksForList } from '../../../../utils/link-validator';

export const POST: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'List ID is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const stats = await validateLinksForList(id);
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error validating links:', error);
    return new Response(JSON.stringify({ error: 'Failed to validate links' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};