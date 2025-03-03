"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

type QuestionWithAnswers = Schema["Question"]["type"] & {
  userAnswer?: string;
};

function TakeTest({
  params,
  user,
  signOut,
}: {
  params: { testId: string };
  user: any;
  signOut: () => void;
}) {
  const router = useRouter();
  const { testId } = params;

  const [test, setTest] = useState<Schema["Test"]["type"] | null>(null);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testAttempt, setTestAttempt] = useState<Schema["TestAttempt"]["type"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    async function fetchTestData() {
      try {
        // Get test details
        const testData = await client.models.Test.get({ id: testId });
        setTest(testData);

        // Get all questions for this test
        const questionsData = await client.models.Question.list({
          filter: {
            test: {
              id: {
                eq: testId,
              },
            },
          },
        });
        setQuestions(questionsData.data);

        // Create a new test attempt
        const newTestAttempt = await client.models.TestAttempt.create({
          startTime: new Date().toISOString(),
          completed: false,
          test: {
            id: testId,
          },
          student: {
            email: user.attributes.email,
          },
        });
        setTestAttempt(newTestAttempt);
      } catch (error) {
        console.error("Error fetching test data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTestData();
  }, [testId, user]);

  const handleSelectAnswer = (answer: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].userAnswer = answer;
    setQuestions(updatedQuestions);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitTest = async () => {
    // Check if all questions have answers
    const unansweredQuestions = questions.filter(q => !q.userAnswer);
    if (unansweredQuestions.length > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unansweredQuestions.length} unanswered questions. Are you sure you want to submit?`
      );
      if (!confirmSubmit) {
        return;
      }
    }

    setSubmitting(true);

    try {
      if (!testAttempt) return;

      // Calculate score
      let totalPoints = 0;
      let earnedPoints = 0;

      // Save answers and calculate score
      for (const question of questions) {
        if (!question.id) continue;

        const isCorrect = question.userAnswer === question.correctAnswer;
        
        // Create answer record
        await client.models.Answer.create({
          selectedOption: question.userAnswer || "",
          isCorrect,
          question: {
            id: question.id,
          },
          testAttempt: {
            id: testAttempt.id,
          },
        });

        // Calculate score
        totalPoints += question.points;
        if (isCorrect) {
          earnedPoints += question.points;
        }
      }

      // Calculate percentage score (0-100)
      const percentageScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
      setScore(percentageScore);

      // Update test attempt with completion info
      await client.models.TestAttempt.update({
        id: testAttempt.id,
        endTime: new Date().toISOString(),
        score: percentageScore,
        completed: true,
      });

      setCompleted(true);
    } catch (error) {
      console.error("Error submitting test:", error);
      alert("Failed to submit test. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto p-6">
        <div className="text-center py-12">Loading test...</div>
      </main>
    );
  }

  if (!test || !questions.length) {
    return (
      <main className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Test not found or no questions available</h2>
          <Link href="/student-dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // If test is completed, show the results
  if (completed) {
    return (
      <main className="container mx-auto p-6">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-6">Test Completed!</h1>
          
          <div className="mb-8">
            <p className="text-xl mb-2">Your Score:</p>
            <p className="text-4xl font-bold text-blue-600">{score !== null ? `${Math.round(score)}%` : "N/A"}</p>
          </div>
          
          <div className="flex justify-center gap-4">
            <Link 
              href={`/test-results/${testAttempt?.id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Detailed Results
            </Link>
            <Link 
              href="/student-dashboard" 
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <main className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{test.title}</h1>
        <div>
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Question {currentQuestionIndex + 1}</h2>
          <p className="text-lg">{currentQuestion?.content}</p>
        </div>

        <div className="mb-6">
          {currentQuestion?.type === "MULTIPLE_CHOICE" ? (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="radio"
                    id={`option-${index}`}
                    name="answer"
                    value={option}
                    checked={currentQuestion.userAnswer === option}
                    onChange={() => handleSelectAnswer(option)}
                    className="mr-2"
                  />
                  <label htmlFor={`option-${index}`} className="cursor-pointer">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="true"
                  name="answer"
                  value="True"
                  checked={currentQuestion?.userAnswer === "True"}
                  onChange={() => handleSelectAnswer("True")}
                  className="mr-2"
                />
                <label htmlFor="true" className="cursor-pointer">
                  True
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="false"
                  name="answer"
                  value="False"
                  checked={currentQuestion?.userAnswer === "False"}
                  onChange={() => handleSelectAnswer("False")}
                  className="mr-2"
                />
                <label htmlFor="false" className="cursor-pointer">
                  False
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300"
          >
            Previous
          </button>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={goToNextQuestion}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submitTest}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {submitting ? "Submitting..." : "Submit Test"}
            </button>
          )}
        </div>
      </div>

      {/* Question Navigator */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Questions</h2>
        <div className="flex flex-wrap gap-2">
          {questions.map((question, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-10 h-10 rounded-full flex items-center justify-center 
                ${
                  currentQuestionIndex === index 
                    ? "bg-blue-600 text-white" 
                    : question.userAnswer 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-800"
                }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

export default withAuthenticator(TakeTest);