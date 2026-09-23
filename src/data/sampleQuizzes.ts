import { QuizQuestion, PdfFormatCheck } from '../types/quiz';

export interface SampleQuizPreset {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  pdfFormatCheck: PdfFormatCheck;
  questions: QuizQuestion[];
}

export const SAMPLE_QUIZZES: SampleQuizPreset[] = [
  {
    id: 'science-astronomy',
    title: 'Cosmic Wonders: Astrophysics & Planetary Science',
    category: 'Science & Astronomy',
    description: 'A 5-question verified assessment on planets, light velocity, black holes, and solar phenomena.',
    icon: '🪐',
    pdfFormatCheck: {
      isQuizFormat: true,
      confidenceScore: 98,
      detectedTitle: 'Cosmic Wonders: Astrophysics & Planetary Science',
      formatCheckSummary: 'Valid standard multiple-choice assessment format detected. Clean question numbering, 4 balanced answer choices per item, and verifiable keys.',
      formatIssues: [
        'Answer key table located on final page was parsed and correlated successfully.',
        'Scientific units verified across all distractors.'
      ],
      pageCount: 3,
      extractedQuestionCount: 5
    },
    questions: [
      {
        id: 'q1',
        questionText: 'Which planet in our solar system has the highest surface temperature, despite not being closest to the Sun?',
        options: ['Mercury', 'Venus', 'Mars', 'Jupiter'],
        correctAnswerIndex: 1,
        correctAnswerText: 'Venus',
        explanation: 'Venus is the hottest planet in the solar system (surface temperature around 465°C / 870°F) due to a runaway greenhouse effect caused by its dense carbon dioxide atmosphere and thick clouds of sulfuric acid. Although Mercury is closer to the Sun, it has virtually no atmosphere to retain solar heat.',
        difficulty: 'medium',
        points: 100
      },
      {
        id: 'q2',
        questionText: 'What astronomical term describes the boundary around a black hole beyond which nothing, not even light, can escape?',
        options: ['Accretion Disc', 'Chandrasekhar Limit', 'Event Horizon', 'Singularity Core'],
        correctAnswerIndex: 2,
        correctAnswerText: 'Event Horizon',
        explanation: 'The Event Horizon is the theoretical boundary surrounding a black hole. At or within this radius (known as the Schwarzschild radius), the escape velocity of the gravitational field equals or exceeds the speed of light, meaning no matter or electromagnetic radiation can ever return to the outside universe.',
        difficulty: 'easy',
        points: 100
      },
      {
        id: 'q3',
        questionText: 'Approximately how long does it take for light emitted from the surface of the Sun to reach Earth?',
        options: ['8 seconds', '8 minutes and 20 seconds', '1 hour and 15 minutes', '24 hours'],
        correctAnswerIndex: 1,
        correctAnswerText: '8 minutes and 20 seconds',
        explanation: 'Earth is roughly 149.6 million kilometers (1 Astronomical Unit) away from the Sun. Dividing this distance by the speed of light in vacuum (c ≈ 299,792 km/s) yields roughly 499 to 500 seconds, which corresponds to approximately 8 minutes and 20 seconds.',
        difficulty: 'easy',
        points: 100
      },
      {
        id: 'q4',
        questionText: 'What primary nuclear fusion process powers stars like our Sun during their main-sequence lifetime?',
        options: ['Carbon-Nitrogen-Oxygen Cycle', 'Proton-Proton Chain Reaction', 'Triple-Alpha Helium Burning', 'Silicon Burning Process'],
        correctAnswerIndex: 1,
        correctAnswerText: 'Proton-Proton Chain Reaction',
        explanation: 'For low-to-intermediate mass stars such as the Sun, the Proton-Proton (p-p) chain is the dominant nuclear fusion mechanism. Four hydrogen protons fuse through a sequence of steps into one helium-4 nucleus, releasing positrons, neutrinos, and intense energy in the form of gamma-ray photons.',
        difficulty: 'hard',
        points: 100
      },
      {
        id: 'q5',
        questionText: 'Which moon in the outer solar system is widely considered one of the top candidates for extraterrestrial microbial life due to its subsurface liquid water ocean and geysers?',
        options: ['Titan', 'Io', 'Enceladus', 'Phobos'],
        correctAnswerIndex: 2,
        correctAnswerText: 'Enceladus',
        explanation: 'Enceladus (a moon of Saturn) features an active subsurface global saltwater ocean beneath its icy crust. The Cassini spacecraft discovered cryovolcanic plumes erupting from south polar fractures ("tiger stripes") containing water vapor, molecular hydrogen, organic macromolecules, and salts, indicating hydrothermal venting suitable for microbial life.',
        difficulty: 'medium',
        points: 100
      }
    ]
  },
  {
    id: 'cs-web-tech',
    title: 'Computer Science: Web Systems & Algorithms',
    category: 'Computer Science',
    description: 'A 5-question test on networking protocols, time complexity, cryptography, and modern web architecture.',
    icon: '💻',
    pdfFormatCheck: {
      isQuizFormat: true,
      confidenceScore: 95,
      detectedTitle: 'Computer Science: Web Systems & Algorithms',
      formatCheckSummary: 'Valid examination paper format detected. All questions feature structured multiple-choice options with unambiguous technical definitions.',
      formatIssues: [
        'Formatting verified: Code block tags and big-O notation preserved accurately.',
        'All 4 distractors per question are mutually exclusive.'
      ],
      pageCount: 2,
      extractedQuestionCount: 5
    },
    questions: [
      {
        id: 'cs1',
        questionText: 'What is the average and worst-case time complexity of accessing an element in a balanced Hash Table?',
        options: ['O(1) average, O(n) worst-case', 'O(log n) average, O(log n) worst-case', 'O(n) average, O(n²) worst-case', 'O(1) average, O(1) worst-case'],
        correctAnswerIndex: 0,
        correctAnswerText: 'O(1) average, O(n) worst-case',
        explanation: 'In a hash table with a uniform hash distribution, key lookup takes O(1) constant time on average. However, in the worst-case scenario where hash collisions degenerate all entries into a single bucket linked list, searching for a key takes O(n) linear time.',
        difficulty: 'medium',
        points: 100
      },
      {
        id: 'cs2',
        questionText: 'In asymmetric public-key cryptography (such as RSA), which key is used to decrypt a message that was encrypted using the recipient\'s public key?',
        options: ['The sender\'s private key', 'The recipient\'s private key', 'The sender\'s public key', 'A shared ephemeral session key'],
        correctAnswerIndex: 1,
        correctAnswerText: 'The recipient\'s private key',
        explanation: 'In asymmetric encryption, the sender encrypts the plaintext using the recipient\'s public key (which is freely distributable). Only the recipient\'s corresponding secret private key possesses the mathematical inverse required to decrypt the ciphertext back into plaintext.',
        difficulty: 'easy',
        points: 100
      },
      {
        id: 'cs3',
        questionText: 'Which HTTP response status code should a server return when a client request succeeds and a new resource is successfully created?',
        options: ['200 OK', '201 Created', '204 No Content', '304 Not Modified'],
        correctAnswerIndex: 1,
        correctAnswerText: '201 Created',
        explanation: 'HTTP 201 Created indicates that the request was successfully fulfilled and resulted in the creation of one or more new resources, typically following a POST or PUT request. 200 is generic success, while 204 indicates success with an empty body.',
        difficulty: 'easy',
        points: 100
      },
      {
        id: 'cs4',
        questionText: 'Which data structure follows the LIFO (Last-In, First-Out) principle and is used by programming runtimes to manage function call frames?',
        options: ['Queue', 'Call Stack', 'Binary Heap', 'Doubly Linked List'],
        correctAnswerIndex: 1,
        correctAnswerText: 'Call Stack',
        explanation: 'A Stack operates under LIFO discipline. When a function is invoked, its execution context and local variables are pushed onto the call stack; when the function finishes returning, its stack frame is popped off.',
        difficulty: 'easy',
        points: 100
      },
      {
        id: 'cs5',
        questionText: 'What mechanism in the browser prevents a malicious script on website A from accessing private DOM or cookie data on website B?',
        options: ['Content Security Policy (CSP)', 'Same-Origin Policy (SOP)', 'Cross-Origin Resource Sharing (CORS)', 'HTTP Strict Transport Security (HSTS)'],
        correctAnswerIndex: 1,
        correctAnswerText: 'Same-Origin Policy (SOP)',
        explanation: 'The Same-Origin Policy (SOP) is a cornerstone web application security model. It permits scripts running on pages originating from the same protocol, host, and port to access each other\'s DOM and storage, while blocking scripts from different origins from reading private data.',
        difficulty: 'hard',
        points: 100
      }
    ]
  }
];
