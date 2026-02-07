
export interface SummaryResult {
  summary: string;
  tags: string[];
}

interface SummaryInput {
  incidentType: string;
  severityLevel: string;
  gpsCoordinates: string;
  aiConfidenceScore: number;
  supportingPosts: string[];
  sourceUrl?: string;
}

export const generateEmergencyTicketSummary = async (input: SummaryInput): Promise<SummaryResult> => {
  console.log(`[Mock] Generating summary for ${input.incidentType}`);
  const sourceText = input.sourceUrl ? `Source: ${input.sourceUrl}` : 'Source: Social Media stream';

  return {
    summary: `[Mock AI Summary] Reported ${input.incidentType} at ${input.gpsCoordinates}. AI Confidence: ${Math.round(input.aiConfidenceScore * 100)}%. ${sourceText}`,
    tags: [input.incidentType, input.severityLevel, 'mock-data']
  };
};
