const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function run() {
    if (!process.env.DATABASE_URL) {
        console.error("No DATABASE_URL found in .env.local. Please add it to run migrations.");
        return;
    }

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        const sqlPath = path.join(__dirname, 'migrations', '20260225_create_user_sessions.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Executing SQL migration...");
        await client.query(sql);
        console.log("Migration executed successfully!");

    } catch (e) {
        console.error("Error executing migration:", e);
    } finally {
        await client.end();
    }
}

run();
