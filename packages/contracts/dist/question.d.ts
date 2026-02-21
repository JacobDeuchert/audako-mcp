export interface QuestionOption {
    label: string;
    description: string;
}
export interface QuestionRequest {
    text: string;
    header: string;
    options: QuestionOption[];
    allowMultiple?: boolean;
}
//# sourceMappingURL=question.d.ts.map