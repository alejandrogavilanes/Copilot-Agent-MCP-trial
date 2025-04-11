import { query } from './db';
import { RateLimiter } from './rate-limiter';

const rateLimiter = new RateLimiter(100); // 100ms minimum between requests

export async function validateLink(url: string): Promise<{ status: string; statusCode?: number }> {
  return rateLimiter.schedule(async () => {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'LinkValidator/1.0' },
        // Add timeout to prevent hanging on slow responses
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        return { status: 'active', statusCode: response.status };
      } else {
        return { status: 'error', statusCode: response.status };
      }
    } catch (error) {
      console.error('Failed to validate link:', url, error); // Fixed line
      return { 
        status: 'error',
        statusCode: error instanceof TypeError && error.name === 'TimeoutError' ? 408 : undefined

      };
    }
  });
}

export async function validateLinksForList(listId: string): Promise<{ total: number; active: number; errors: number }> {
  const result = await query(`
    SELECT id, url 
    FROM links 
    WHERE list_id = $1
  `, [listId]);

  let active = 0;
  let errors = 0;

  for (const link of result.rows) {
    const { status } = await validateLink(link.url);
    
    await query(`
      UPDATE links 
      SET status = $1, 
          last_validated_at = NOW() 
      WHERE id = $2
    `, [status, link.id]);

    if (status === 'active') active++;
    else errors++;
  }

  return {
    total: result.rows.length,
    active,
    errors
  };
}

export async function validateLinks(batchSize = 50): Promise<void> {
  const result = await query(`
    SELECT id, url 
    FROM links 
    WHERE last_validated_at IS NULL 
       OR last_validated_at < NOW() - INTERVAL '24 hours'
    ORDER BY last_validated_at ASC NULLS FIRST
    LIMIT $1
  `, [batchSize]);

  for (const link of result.rows) {
    const { status } = await validateLink(link.url);
    
    await query(`
      UPDATE links 
      SET status = $1, 
          last_validated_at = NOW() 
      WHERE id = $2
    `, [status, link.id]);
  }
}

export async function getLinkHealthStats(listId?: string): Promise<{ 
  total: number; 
  active: number; 
  errors: number; 
  unknown: number;
  lastValidated?: Date;
}> {
  const whereClause = listId ? 'WHERE list_id = $1' : '';
  const params = listId ? [listId] : [];
  
  const result = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
      COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
      COUNT(CASE WHEN status IS NULL THEN 1 END) as unknown,
      MAX(last_validated_at) as last_validated
    FROM links
    ${whereClause}
  `, params);

  const stats = result.rows[0];
  return {
    total: parseInt(stats.total),
    active: parseInt(stats.active),
    errors: parseInt(stats.errors),
    unknown: parseInt(stats.unknown),
    lastValidated: stats.last_validated
  };
}

export async function startLinkValidation(interval = 3600000): Promise<void> {
  // Initial validation
  await validateLinks();
  
  // Set up periodic validation (default: every hour)
  setInterval(async () => {
    try {
      await validateLinks();
    } catch (error) {
      console.error('Error during link validation:', error);
    }
  }, interval);
}