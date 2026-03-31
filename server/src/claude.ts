import Anthropic from '@anthropic-ai/sdk'
import type { Assignment, Problem } from './types.js'

const client = new Anthropic()

const STUDENT_CONTEXT = '16-year-old student with ADHD. Needs short clear explanations, no jargon, use examples and analogies. Keep it simple.'

export async function generateLesson(assignment: Assignment): Promise<{ lesson: string; problems: Problem[] }> {
  const prompt = `You are a patient tutor helping a student prepare for an upcoming ${assignment.type}.

Student context: ${STUDENT_CONTEXT}

Subject: ${assignment.subject}
Topic: ${assignment.topic}
Assignment: "${assignment.title}" due ${assignment.dueDate}

First, write a clear 2-3 minute lesson explaining the key concepts the student needs to know. Use simple language and 1-2 concrete examples.

Then, write exactly 5 practice problems at appropriate difficulty. Number them 1-5.

Format your response exactly like this:
LESSON:
[your lesson here]

PROBLEMS:
1. [problem 1]
2. [problem 2]
3. [problem 3]
4. [problem 4]
5. [problem 5]`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const [lessonPart, problemsPart] = text.split('PROBLEMS:')
  const lesson = lessonPart.replace('LESSON:', '').trim()

  const problems: Problem[] = (problemsPart ?? '')
    .trim()
    .split('\n')
    .filter(line => /^\d+\./.test(line.trim()))
    .map((line, index) => ({
      index,
      question: line.replace(/^\d+\.\s*/, '').trim(),
    }))

  return { lesson, problems }
}

export async function checkAnswer(
  question: string,
  answer: string,
  subject: string
): Promise<{ correct: boolean; explanation: string }> {
  const prompt = `You are evaluating a student's answer to a ${subject} problem.

Student context: ${STUDENT_CONTEXT}

Question: ${question}
Student's answer: ${answer}

Is the answer correct? Reply with:
CORRECT: yes or no
EXPLANATION: [explain whether they got it right and show the full solution step-by-step]`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const correctMatch = text.match(/CORRECT:\s*(yes|no)/i)
  const explanationMatch = text.match(/EXPLANATION:\s*([\s\S]+)/)

  return {
    correct: correctMatch?.[1]?.toLowerCase() === 'yes' ?? false,
    explanation: explanationMatch?.[1]?.trim() ?? text,
  }
}
