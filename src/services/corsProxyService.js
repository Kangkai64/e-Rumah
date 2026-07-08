// CORS Proxy Service
// Uses the revoke-share-proxy edge function to safely update database records
// The function enforces allowlist protection for both tables and allowed fields

import { supabase } from '../config/supabase'

/**
 * Call the revoke-share-proxy edge function to update a record
 * @param {string} table - Table name (must be in allowlist)
 * @param {string} id - Record ID
 * @param {Object} patch - Fields to update (only allowed fields per table)
 * @returns {Promise<Object>} Response with success status and data
 */
export const corsProxyUpdate = async (table, id, patch) => {
  try {
    // Get the current session to include auth token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    // Build headers
    const headers = {
      'Content-Type': 'application/json'
    }

    // Add Authorization header if user is authenticated
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    // Call the edge function
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/revoke-share-proxy`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          table,
          id,
          patch
        })
      }
    )

    const result = await response.json()

    if (!response.ok) {
      console.error('CORS proxy error:', result)
      throw new Error(result.error || 'Failed to update via proxy')
    }

    return result
  } catch (error) {
    console.error('Error calling CORS proxy:', error)
    return { success: false, error: error.message }
  }
}

// Generic fetch for Edge Functions (POST body passthrough)
// Targets the Supabase functions endpoint directly; functionName may
// include a sub-path (e.g. "reminder-processor/run").
export const corsProxyFunctionInvoke = async (functionName, payload = {}, method = 'POST') => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const headers = {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`, {
      method,
      headers,
      body: JSON.stringify(payload),
    });

    // Safely parse response: handle empty and non-JSON bodies
    const ct = response.headers.get('content-type') || '';
    let parsedBody = null;
    if (response.status !== 204) {
      if (ct.includes('application/json')) {
        try {
          parsedBody = await response.json();
        } catch (e) {
          parsedBody = { text: await response.text() };
        }
      } else {
        parsedBody = { text: await response.text() };
      }
    }

    if (!response.ok) {
      console.error('CORS proxy function invoke error:', parsedBody);
      throw new Error(parsedBody?.error || `Failed to invoke function via proxy (status ${response.status})`);
    }

    return parsedBody;
  } catch (error) { console.error('Error calling function via CORS proxy:', error); return { success: false, error: error?.message || String(error) }; }
}