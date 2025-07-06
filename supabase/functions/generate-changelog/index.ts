
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { version, commits } = await req.json()

    if (!version || !commits) {
      return new Response(
        JSON.stringify({ error: 'Version and commits are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured in Supabase secrets')
    }

    console.log('Making request to OpenAI API...')
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a changelog generator. Convert the provided commit messages into a well-formatted, user-friendly changelog. 

Format the output as markdown with:
- A version header (## Version X.X.X)
- Organized sections: 🚀 New Features, ⚡ Improvements, 🐛 Bug Fixes
- Each change as a bullet point with clear, user-friendly language
- Remove technical jargon and make it accessible to end users

If a commit doesn't fit clearly into features/improvements/fixes, put it in the most appropriate category or create a "🔧 Other Changes" section.`
          },
          {
            role: 'user',
            content: `Version: ${version}\n\nCommit messages:\n${commits}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const changelog = data.choices[0]?.message?.content || ''

    console.log('OpenAI API response received successfully')
    
    return new Response(
      JSON.stringify({ changelog }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in generate-changelog function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
