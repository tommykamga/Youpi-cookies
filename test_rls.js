const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogs() {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or('title.eq.TRACE_DELETE_SUCCESS,title.eq.ERR_LOG_DELETE_GUI')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('Logs:', data);
}

checkLogs();
