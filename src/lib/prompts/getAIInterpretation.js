import { supabase } from '@/integrations/supabase/client';

/**
 * Calls the AI interpretation edge function to generate a poetic,
 * personalized 4-sentence art direction narrative from chart data.
 *
 * Falls back to a rule-based summary if the API call fails.
 *
 * @param {object} chartData - Chart data with `.interpretation` layer attached
 * @returns {Promise<string>} 4-sentence narrative paragraph
 */
export default async function getAIInterpretation(chartData) {
  const { interpretation } = chartData;

  // Build fallback text from rule-based data
  const highPriorityAspects = (interpretation.aspectWeights || [])
    .filter(a => a.priority === 'critical' || a.priority === 'high')
    .map(a => `${a.planet1} ${a.type} ${a.planet2} (${a.orb}° orb)`)
    .join(', ');

  const dignityText = interpretation.dignityFlags?.length > 0
    ? interpretation.dignityFlags.map(d => `${d.planet} in ${d.dignity}`).join(', ')
    : '';

  const fallback = [
    interpretation.dominantFeature,
    interpretation.coreParadox,
    highPriorityAspects ? `Key tensions: ${highPriorityAspects}.` : '',
    dignityText ? `Dignity wounds: ${dignityText}.` : '',
  ].filter(Boolean).join(' ').trim();

  try {
    const { data, error } = await supabase.functions.invoke('ai-interpret', {
      body: { chartData },
    });

    if (error) throw error;
    if (!data?.narrative) throw new Error('Empty AI response');

    console.log('🧠 AI narrative interpretation received');
    return data.narrative;
  } catch (err) {
    console.error('AI interpretation failed, using fallback:', err);
    return fallback;
  }
}
