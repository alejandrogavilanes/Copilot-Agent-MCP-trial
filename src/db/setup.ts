import pkg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { startLinkValidation } from '../utils/link-validator';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const connectionString = process.env.DB_CONNECTION || 'postgresql://postgres:LinuxRocks01@localhost:5432/link-page-db';

async function setupDatabase() {
    const pool = new Pool({ connectionString });
    
    try {
        // Read the schema SQL file
        const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
        
        // Connect and execute the schema
        const client = await pool.connect();
        try {
            await client.query(schemaSQL);
            console.log('Database schema setup completed successfully');
            
            // Start the link validation service
            await startLinkValidation();
            console.log('Link validation service started');
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error setting up database schema:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the setup if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    setupDatabase().catch(console.error);
}

export { setupDatabase };