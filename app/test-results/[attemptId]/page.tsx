"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

type AnswerWithQuestion = Schema["Answer"]["type"] & {
  question: Schema["Question"]["type"];
};

function TestResults({
  params,
  user,
  signOut,
}: {
  params: { attemptId: string };
  user: any;
  signOut: () => void;
}) {
  const { attemptId } = params;
  
  const [testAttempt, setTestAttempt] = useState<Schema["TestAttempt"]["type"] | null>(null);
  const [test, setTest] = useState<Schema["Test"]["type"] | null>(null);
  const [answers, setAnswers] = useState<AnswerWithQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check user attributes to determine role
    const role = user?.attributes?.role;
    setUserRole(role);
  }, [user]);

  useEffect(() => {
    async function fetchResults() {
      try {
        // Get test attempt
        const attemptData = await client.models.TestAttempt.get({ id: attemptId });
        setTestAttempt(attemptData);

        if (attemptData?.test?.id) {
          // Get test details
          const testData = await client.models.Test.get({ id: attemptData.test.id });
          setTest(testData);
        }

        // Get all answers for this attempt with their corresponding questions
        const answersData = await client.models.Answer.list({
          filter: {
            testAttempt: {
              id: {
                eq: attemptId,
              },
            },
          },
        });

        // For each answer, fetch the question
        const answersWithQuestions = await Promise.all(
          answersData.data.map(async (answer) => {
            if (!answer.question?.id) return answer;
            
            const question = await client.models.Question.get({ id: answer.question.id });
            return {
              ...answer,
              question,
            };
          })
        );

        setAnswers(answersWithQuestions as AnswerWithQuestion[]);
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [attemptId]);

  if (loading) {
    return (
      <main className="container mx-auto p-6">
        <div className="text-center py-12">Loading results...</div>
      </main>
    );
  }

  if (!testAttempt || !test) {
    return (
      <main className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Test attempt not found</h2>
          <Link 
            href={userRole === "STUDENT" ? "/student-dashboard" : "/tutor-dashboard"} 
            className="text-blue-600 hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <main className="container mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Test Results</h1>
        <Link 
          href={userRole === "STUDENT" ? "/student-dashboard" : "/tutor-dashboard"}
          className="text-blue-600 hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Test Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Test:</strong> {test.title}</p>
            {test.description && <p><strong>Description:</strong> {test.description}</p>}
            <p><strong>Started:</strong> {formatDate(testAttempt.startTime)}</p>
            {testAttempt.endTime && (
              <p><strong>Completed:</strong> {formatDate(testAttempt.endTime)}</p>
            )}
          </div>
          <div>
            <p>
              <strong>Score:</strong>{" "}
              <span className="text-2xl font-bold">
                {testAttempt.score !== null ? `${Math.round(testAttempt.score)}%` : "Not completed"}
              </span>
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className={`font-medium ${testAttempt.completed ? "text-green-600" : "text-orange-600"}`}>
                {testAttempt.completed ? "Completed" : "In Progress"}
              </span>
            </p>
            <p>
              <strong>Correct Answers:</strong>{" "}
              {answers.filter(a => a.isCorrect).length} / {answers.length}
            </p>
          </div>
        </div>
      </div>

      {/* Questions and Answers */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-6">Questions and Answers</h2>
        
        <div className="space-y-8">
          {answers.map((answer, index) => (
            <div 
              key={answer.id} 
              className={`p-4 rounded-lg border-l-4 ${answer.isCorrect 
                ? "border-green-500 bg-green-50" 
                : "border-red-500 bg-red-50"}`}
            >
              <h3 className="font-medium mb-2">Question {index + 1}</h3>
              <p className="mb-4">{answer.question?.content}</p>
              
              {answer.question?.type === "MULTIPLE_CHOICE" && (
                <div className="mb-4">
                  <p className="font-medium">Options:</p>
                  <ul className="list-disc pl-5">
                    {answer.question.options?.map((option, optionIndex) => (
                      <li 
                        key={optionIndex}
                        className={`
                          ${option === answer.selectedOption ? "font-medium" : ""}
                          ${option === answer.question.correctAnswer ? "text-green-600" : ""}
                          ${option === answer.selectedOption && option !== answer.question.correctAnswer ? "text-red-600" : ""}
                        `}
                      >
                        {option}
                        {option === answer.question.correctAnswer && " (Correct Answer)"}
                        {option === answer.selectedOption && option !== answer.question.correctAnswer && " (Your Answer)"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {answer.question?.type === "TRUE_FALSE" && (
                <div className="mb-4">
                  <p className="font-medium">Your Answer: <span className={answer.isCorrect ? "text-green-600" : "text-red-600"}>{answer.selectedOption}</span></p>
                  {!answer.isCorrect && (
                    <p className="text-green-600">Correct Answer: {answer.question.correctAnswer}</p>
                  )}
                </div>
              )}
              
              <div className="flex items-center">
                <span className={`px-2 py-1 rounded text-sm ${answer.isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {answer.isCorrect ? "Correct" : "Incorrect"}
                </span>
                <span className="ml-4 text-sm">
                  {answer.question?.points} {answer.question?.points === 1 ? "point" : "points"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default withAuthenticator(TestResults);