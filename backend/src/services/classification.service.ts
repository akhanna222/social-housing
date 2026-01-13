import OpenAI from 'openai';
import { config } from '../config/index.js';
import type { DocumentCategory, ClassificationResult } from '../types/index.js';

const CLASSIFICATION_PROMPT = `You are an expert document classifier for a UK social housing application system.

Analyze the provided document image and classify it into ONE of these categories:

1. **identity** - Passport, driving licence, national ID card, birth certificate
2. **income** - Payslips, P60, employment letters, self-employment accounts
3. **bank_statement** - Bank statements, building society statements
4. **welfare_benefit** - Universal Credit letters, Housing Benefit letters, DWP correspondence
5. **medical** - GP letters, hospital letters, medical assessments, disability evidence
6. **tenancy** - Current tenancy agreements, landlord references, eviction notices
7. **proof_of_address** - Utility bills, council tax bills, official letters with address
8. **other** - Documents that don't fit above categories
9. **unknown** - Cannot determine document type (poor quality, illegible, not a document)

Respond with a JSON object in this exact format:
{
  "category": "<category_name>",
  "confidence": <0.0-1.0>,
  "subtype": "<specific_document_type>",
  "reasoning": "<brief explanation of classification>",
  "alternativeCategories": [
    {"category": "<category>", "confidence": <0.0-1.0>}
  ]
}

Guidelines:
- Confidence should reflect how certain you are (0.9+ for clear documents)
- Subtype should be specific (e.g., "passport", "universal_credit_letter", "payslip")
- Include up to 2 alternative categories if classification is uncertain
- For poor quality images, use "unknown" with low confidence
- Consider UK-specific document formats (DWP, HMRC, Council documents)`;

export class ClassificationService {
  private openai: OpenAI;
  private model: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    this.model = config.openai.model;
  }

  /**
   * Classify a document using OpenAI Vision
   */
  async classifyDocument(
    imageBase64: string,
    mimeType: string
  ): Promise<ClassificationResult> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: CLASSIFICATION_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: 'high',
                },
              },
              {
                type: 'text',
                text: 'Please classify this document for a UK social housing application.',
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from classification model');
      }

      const result = JSON.parse(content) as ClassificationResult;

      // Validate the response
      return this.validateClassificationResult(result);
    } catch (error) {
      console.error('Classification error:', error);

      // Return unknown classification on error
      return {
        category: 'unknown',
        confidence: 0,
        reasoning: `Classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Classify a PDF document (multi-page)
   * For PDFs, we classify the first page and optionally verify with additional pages
   */
  async classifyPdfDocument(
    pagesBase64: string[],
    mimeType: string = 'image/png'
  ): Promise<ClassificationResult> {
    if (pagesBase64.length === 0) {
      return {
        category: 'unknown',
        confidence: 0,
        reasoning: 'No pages provided for classification',
      };
    }

    // Classify first page
    const firstPageResult = await this.classifyDocument(pagesBase64[0], mimeType);

    // If high confidence or only one page, return result
    if (firstPageResult.confidence >= 0.85 || pagesBase64.length === 1) {
      return firstPageResult;
    }

    // For lower confidence, check additional pages
    const additionalResults: ClassificationResult[] = [];
    const pagesToCheck = Math.min(pagesBase64.length, 3); // Check up to 3 pages

    for (let i = 1; i < pagesToCheck; i++) {
      const pageResult = await this.classifyDocument(pagesBase64[i], mimeType);
      additionalResults.push(pageResult);
    }

    // Aggregate results - prefer consistent classifications
    return this.aggregateClassifications([firstPageResult, ...additionalResults]);
  }

  /**
   * Aggregate multiple page classifications
   */
  private aggregateClassifications(results: ClassificationResult[]): ClassificationResult {
    // Count category occurrences weighted by confidence
    const categoryScores = new Map<DocumentCategory, number>();

    for (const result of results) {
      const currentScore = categoryScores.get(result.category) || 0;
      categoryScores.set(result.category, currentScore + result.confidence);
    }

    // Find highest scoring category
    let bestCategory: DocumentCategory = 'unknown';
    let bestScore = 0;

    for (const [category, score] of categoryScores) {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    // Calculate aggregated confidence
    const relevantResults = results.filter((r) => r.category === bestCategory);
    const avgConfidence =
      relevantResults.reduce((sum, r) => sum + r.confidence, 0) / relevantResults.length;

    // Find subtype from most confident result of best category
    const bestResult = relevantResults.sort((a, b) => b.confidence - a.confidence)[0];

    return {
      category: bestCategory,
      confidence: avgConfidence,
      subtype: bestResult?.subtype,
      reasoning: `Aggregated from ${results.length} pages. ${bestResult?.reasoning || ''}`,
      alternativeCategories: this.getAlternativeCategories(categoryScores, bestCategory),
    };
  }

  /**
   * Get alternative categories from aggregated scores
   */
  private getAlternativeCategories(
    categoryScores: Map<DocumentCategory, number>,
    bestCategory: DocumentCategory
  ): { category: DocumentCategory; confidence: number }[] {
    const alternatives: { category: DocumentCategory; confidence: number }[] = [];

    for (const [category, score] of categoryScores) {
      if (category !== bestCategory && score > 0.3) {
        alternatives.push({
          category,
          confidence: Math.min(score, 1),
        });
      }
    }

    return alternatives.sort((a, b) => b.confidence - a.confidence).slice(0, 2);
  }

  /**
   * Validate and normalize classification result
   */
  private validateClassificationResult(result: ClassificationResult): ClassificationResult {
    const validCategories: DocumentCategory[] = [
      'identity',
      'income',
      'bank_statement',
      'welfare_benefit',
      'medical',
      'tenancy',
      'proof_of_address',
      'other',
      'unknown',
    ];

    // Validate category
    if (!validCategories.includes(result.category)) {
      result.category = 'unknown';
    }

    // Normalize confidence to 0-1 range
    result.confidence = Math.max(0, Math.min(1, result.confidence));

    // Ensure reasoning exists
    if (!result.reasoning) {
      result.reasoning = 'No reasoning provided';
    }

    // Validate alternative categories
    if (result.alternativeCategories) {
      result.alternativeCategories = result.alternativeCategories
        .filter((alt) => validCategories.includes(alt.category))
        .map((alt) => ({
          category: alt.category,
          confidence: Math.max(0, Math.min(1, alt.confidence)),
        }));
    }

    return result;
  }
}

export const classificationService = new ClassificationService();
