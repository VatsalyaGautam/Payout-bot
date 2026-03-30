import sql from './db';
import { handleError } from '@/utils/errors';

async function truncate() {
    console.log('Truncating database tables...');
    try {
        await sql`TRUNCATE TABLE payments, acknowledgments, last_alerts, message_map CASCADE`;
        console.log('Database truncated successfully.');
    } catch (err) {
        handleError('Failed to truncate database:', err);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

truncate();
