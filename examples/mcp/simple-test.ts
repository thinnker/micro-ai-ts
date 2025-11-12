/**
 * Simple MCP Test
 *
 * Quick test to verify MCP integration works
 * This just loads the tools without making API calls
 */

import { createMCPTools } from '../../src/index'

async function main() {
  console.log('🧪 Testing MCP integration...\n')

  try {
    console.log('1. Loading MCP server...')
    const tools = await createMCPTools({
      command: 'uvx',
      args: ['mcp-server-fetch'],
    })

    console.log(`✅ Success! Loaded ${tools.length} tool(s)`)

    tools.forEach((tool, i) => {
      console.log(`\n   Tool ${i + 1}:`)
      console.log(`   - Name: ${tool.schema.function.name}`)
      console.log(`   - Description: ${tool.schema.function.description}`)
      console.log(
        `   - Parameters:`,
        Object.keys(tool.schema.function.parameters.properties || {})
      )
    })

    console.log('\n✨ MCP integration is working!')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error('\nMake sure you have uv/uvx installed:')
    console.error('https://docs.astral.sh/uv/getting-started/installation/')
  }
}

main()
