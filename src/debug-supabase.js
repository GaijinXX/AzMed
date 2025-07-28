// Debug script to test Supabase connection
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uxmvulvmvtismnokxsry.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bXZ1bHZtdnRpc21ub2t4c3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDA2NTksImV4cCI6MjA2ODc3NjY1OX0.PadYJ9W2Abp4TV5QLZvn1TidYz7Hdec8fwNwrehH6Q4'

const supabase = createClient(supabaseUrl, supabaseKey)

// Test basic connection
console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key (first 20 chars):', supabaseKey.substring(0, 20) + '...')

// Test function invocation
async function testFunction() {
  try {
    console.log('\n--- Testing database-search function ---')
    
    const { data, error } = await supabase.functions.invoke('database-search', {
      body: JSON.stringify({
        p_search_term: '',
        p_page_number: 1,
        p_page_size: 10
      })
    })
    
    if (error) {
      console.error('Function error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
    } else {
      console.log('Function success:', data)
    }
  } catch (err) {
    console.error('Caught error:', err)
  }
}

// Test if we can list functions (requires service role key)
async function testFunctionsList() {
  try {
    console.log('\n--- Testing functions list ---')
    const { data, error } = await supabase.functions.invoke('_list')
    
    if (error) {
      console.log('Cannot list functions (expected with anon key):', error.message)
    } else {
      console.log('Available functions:', data)
    }
  } catch (err) {
    console.log('Cannot list functions (expected):', err.message)
  }
}

// Run tests
testFunction()
testFunctionsList()