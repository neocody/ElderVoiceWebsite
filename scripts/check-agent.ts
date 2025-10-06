import fetch from 'node-fetch';

async function checkAgent() {
  const agentId = process.env.ELEVENLABS_AGENT_ID || 'agent_01jz1b17gbfcf9wrrp9ztnvmbp';
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    console.error('ELEVENLABS_API_KEY is not set');
    process.exit(1);
  }

  try {
    // Get agent details
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      console.error(`Failed to get agent: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(text);
      return;
    }

    const agent = await response.json();
    console.log('Agent Configuration:');
    console.log(JSON.stringify(agent, null, 2));
    
    // Check specific settings
    console.log('\n--- Key Settings ---');
    console.log('Transcription enabled:', agent.conversation_config?.transcription?.enabled ?? 'not set');
    console.log('Authentication required:', agent.security?.is_authenticated ?? 'not set');
    console.log('Voice ID:', agent.conversation_config?.tts?.voice_id);
    console.log('Language:', agent.conversation_config?.agent?.language);
    
  } catch (error) {
    console.error('Error checking agent:', error);
  }
}

checkAgent();