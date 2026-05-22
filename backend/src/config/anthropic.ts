import { env } from './env';

interface ClaudeMessageResponse {
  content: Array<{ text: string }>;
}

export const callClaudeApi = async (systemPrompt: string, userPrompt: string): Promise<string> => {
  const isPlaceholder = env.ANTHROPIC_API_KEY.includes('placeholder');
  
  if (isPlaceholder) {
    console.log('⚠️ Using mocked Anthropic Claude API due to placeholder key.');
    
    // Determine if this is an email draft prompt or an eligibility scan prompt
    if (systemPrompt.includes('email') || systemPrompt.includes('automated government application')) {
      return `Dear Agency Representative,

Please find the application submission for the applicant attached.

Household details have been verified, and the relevant documents are included. Please review the application for the requested program.

Thank you,
MomPlan Automations System`;
    }

    // Return mock successful match array for testing eligibility scan using real seeded IDs
    return JSON.stringify([
      {
        programId: 'tanf',
        status: 'qualified',
        confidence_score: 95,
        reasoning: 'Household income and size fall well within guidelines for temporary assistance.',
        estimated_benefit: '$400 - $900/mo'
      },
      {
        programId: 'snap',
        status: 'likely_qualified',
        confidence_score: 85,
        reasoning: 'Your household size matches the nutrition assistance criteria for your state.',
        estimated_benefit: '$180 per person/mo'
      },
      {
        programId: 'wic',
        status: 'check_required',
        confidence_score: 60,
        reasoning: 'Based on your children ages, you may qualify for WIC, but an in-person appointment is required.',
        estimated_benefit: 'Food package + formula'
      }
    ]);
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Anthropic API Error:', errorText);
    throw new Error(`Anthropic API call failed: ${response.statusText}`);
  }

  const data = (await response.json()) as ClaudeMessageResponse;
  return data.content[0]?.text || '[]';
};
