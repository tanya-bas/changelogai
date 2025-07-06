
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
    const { query, changelogs } = await req.json()

    if (!query || !changelogs) {
      return new Response(
        JSON.stringify({ error: 'Query and changelogs are required' }),
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

    console.log('Performing semantic search with query:', query)
    console.log('Number of relevant changelogs:', changelogs.length)
    
    // Prepare context from the top changelogs
    const context = changelogs.map((changelog: any, index: number) => {
      return `Changelog ${index + 1}:
Version: ${changelog.version}
Product: ${changelog.product || 'Not specified'}
Date: ${new Date(changelog.created_at).toLocaleDateString()}
Content:
${changelog.content}
---`
    }).join('\n\n')

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
            content: `You are a helpful assistant that answers questions about product changelogs. You will be provided with relevant changelog entries and a user question. 

Your task is to:
1. Analyze the provided changelogs
2. Answer the user's question based on the information available
3. If the question cannot be answered from the changelogs, say so clearly
4. Provide specific version numbers, dates, and product names when relevant
5. Keep your response concise but informative
6. Use a friendly, helpful tone

Format your response in a clear, readable way using markdown if needed.`
          },
          {
            role: 'user',
            content: `Based on these changelogs, please answer the following question:

Question: ${query}

Relevant Changelogs:
${context}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || 'No response generated'

    console.log('Semantic search response generated successfully')
    
    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in semantic-search function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
