import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('PROJECT_URL') || Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token di autorizzazione richiesto' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token non valido' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { method } = req
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    if (method === 'GET' && path === 'subtasks') {
      const { task_id } = Object.fromEntries(url.searchParams.entries())
      
      if (!task_id) {
        return new Response(
          JSON.stringify({ error: 'Task ID è richiesto' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get all subtasks for a specific task
      const { data: subtasks, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', task_id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Errore nel recupero delle subtask' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ subtasks }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (method === 'POST' && path === 'subtasks') {
      const { task_id, title, description, completed } = await req.json()
      
      if (!task_id || !title) {
        return new Response(
          JSON.stringify({ error: 'Task ID e titolo sono richiesti' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const { data: subtask, error } = await supabase
        .from('subtasks')
        .insert({
          task_id,
          title,
          description,
          completed: completed || false,
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Errore nella creazione della subtask' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ subtask }),
        { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (method === 'PUT' && path === 'subtasks') {
      const { id, title, description, completed } = await req.json()
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID della subtask è richiesto' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const { data: subtask, error } = await supabase
        .from('subtasks')
        .update({
          title,
          description,
          completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Errore nell\'aggiornamento della subtask' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ subtask }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (method === 'DELETE' && path === 'subtasks') {
      const { id } = await req.json()
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID della subtask è richiesto' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Errore nella cancellazione della subtask' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Subtask cancellata con successo' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint non trovato' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Errore interno del server' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
