/**
 * Utility to generate downloadable PDF-like mock files or trigger sample PDF creation
 */
export function generateSamplePdfBlob(title: string, questions: Array<{
  questionText: string;
  options: string[];
  correctAnswerText: string;
  explanation: string;
}>): Blob {
  // Create a clean formatted text-based educational assessment representation
  const content = [
    `=============================================================`,
    `               ${title.toUpperCase()}`,
    `         OFFICIAL MULTIPLE CHOICE EXAMINATION PAPER`,
    `=============================================================`,
    `Instructions: Read each question carefully. Select the single best`,
    `answer among choices (A, B, C, D). An answer key with explanations`,
    `is provided at the conclusion of this document.`,
    `-------------------------------------------------------------\n`,
  ];

  questions.forEach((q, idx) => {
    content.push(`QUESTION ${idx + 1}:`);
    content.push(q.questionText);
    q.options.forEach((opt, oIdx) => {
      const letter = String.fromCharCode(65 + oIdx);
      content.push(`   [ ${letter} ] ${opt}`);
    });
    content.push('');
  });

  content.push(`=============================================================`);
  content.push(`                ANSWER KEY & EXPLANATION GUIDE`);
  content.push(`=============================================================`);

  questions.forEach((q, idx) => {
    content.push(`Item ${idx + 1}: Correct Answer -> ${q.correctAnswerText}`);
    content.push(`Explanation: ${q.explanation}`);
    content.push('-------------------------------------------------------------');
  });

  return new Blob([content.join('\n')], { type: 'text/plain' });
}
