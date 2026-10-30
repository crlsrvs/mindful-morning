export type DimensionId = 'valence' | 'activation' | 'tension' | 'mentalLoad' | 'connection' | 'motivation';
export type Style = 'metaphor' | 'daily_situation' | 'observation' | 'gentle_introspection';
export type ContentStatus = 'draft' | 'needs_revision' | 'approved' | 'rejected';
export type Practice = 'grounding' | 'unhooking' | 'acting_on_values' | 'making_room' | 'being_kind_engaging';
export interface QualityMetadata {
  readonly status: ContentStatus;
  readonly authorRole: string;
  readonly reviewerRole: string;
  readonly reviewedAt: string | null;
  readonly originalityChecked: boolean;
  readonly clarityScore: number;
  readonly culturalFitScore: number;
  readonly invasivenessScore: number;
  readonly moralizingRisk: number;
  readonly clinicalLanguageRisk: number;
  readonly ambiguityNotes: string;
  readonly accessibilityChecked: boolean;
  readonly approvals: readonly string[];
}
export interface Effect { readonly dimension: DimensionId; readonly value: number; readonly weight: number }
export interface Answer {
  readonly id: string;
  readonly text: string;
  readonly effects: readonly Effect[];
  readonly interpretationNote: string;
}
export interface Question {
  readonly id: string;
  readonly revision: number;
  readonly locale: 'es-CL';
  readonly prompt: string;
  readonly helperText?: string;
  readonly style: Style;
  readonly primaryDimension: DimensionId;
  readonly scenarioTags: readonly string[];
  readonly semanticClusterId: string;
  readonly narrativeTemplateId: string;
  readonly intensity: 'gentle' | 'moderate';
  readonly adaptiveEligible: boolean;
  readonly followUpOnly: boolean;
  readonly sessionContexts: readonly 'morning_intent'[];
  readonly editorialPriority: number;
  readonly answers: readonly Answer[];
  readonly coveragePotential: Readonly<Record<DimensionId, number>>;
  readonly sourceIds: readonly string[];
  readonly quality: QualityMetadata;
}
export interface ReflectionFamily {
  readonly id: string;
  readonly kind: 'closing' | 'support';
  readonly eligibleBy: 'POSITIVE_GROUNDED_GATE' | 'NONLABEL_NO_CONTEXT_GATE' | 'NONLABEL_TENSION_GATE' | 'NONLABEL_MENTAL_LOAD_GATE' | 'NONLABEL_CONNECTION_LOW_GATE' | 'NONLABEL_MOTIVATION_LOW_GATE' | 'NONLABEL_ACTIVATION_HIGH_GATE' | 'NONLABEL_ACTIVATION_LOW_GATE' | 'SUPPORT_3_OF_5_GATE';
  readonly priorityBand: 'exclusive' | 'fallback' | 'context' | 'additional';
  readonly recommendedFocus: string;
  readonly prohibitedClaims: readonly string[];
  readonly sourceIds: readonly string[];
  readonly quality: QualityMetadata;
}
export interface Reflection {
  readonly id: string;
  readonly revision: number;
  readonly locale: 'es-CL';
  readonly familyId: string;
  readonly kind: 'closing' | 'support';
  readonly title: string;
  readonly body: string;
  readonly optionalAction: string | null;
  readonly practiceInspiration: Practice | null;
  readonly sourceIds: readonly string[];
  readonly sourceRelationship: 'inspiration' | 'directly_described_practice' | 'original_product_heuristic';
  readonly quality: QualityMetadata;
}
export interface Dimension {
  readonly id: DimensionId;
  readonly negativePoleDescription: string;
  readonly positivePoleDescription: string;
  readonly semanticCautions: string;
  readonly contractVersion: 1;
}
export interface ContentSource {
  readonly id: string;
  readonly title: string;
  readonly authorsOrInstitution: string;
  readonly publicationYear: number | null;
  readonly publicationDate: string | null;
  readonly url: string;
  readonly doi: string | null;
  readonly sourceType: 'official_publication' | 'research_article' | 'official_service_page';
  readonly evidenceRole: 'direct_support_for_general_practice' | 'conceptual_inspiration' | 'technical_reference' | 'internal_heuristic';
  readonly consultedAt: string;
  readonly license: string;
  readonly reuseNotes: string;
  readonly limitations: string;
}
export interface SupportResource {
  readonly id: string;
  readonly countryCode: 'CL';
  readonly title: string;
  readonly serviceScope: string;
  readonly phone: string;
  readonly actionType: 'dialer';
  readonly sourceId: string;
  readonly lastVerifiedAt: string;
  readonly availabilityText: string;
  readonly cautionText: string;
  readonly quality: QualityMetadata;
}
export interface Manifest {
  readonly packId: 'morning-reflection-es-CL';
  readonly version: string;
  readonly schemaVersion: 1;
  readonly engineContractVersion: 1;
  readonly locale: 'es-CL';
  readonly publishedAt: string;
  readonly hash: string;
  readonly questionCount: number;
  readonly reflectionCount: number;
  readonly minCompatibleEngine: string;
  readonly review: {
    readonly status: 'draft' | 'approved';
    readonly authorRole: string;
    readonly reviewerRole: string;
    readonly reviewedAt: string | null;
    readonly safetyReview: string;
    readonly releaseReady: boolean;
    readonly note: string;
  };
}
