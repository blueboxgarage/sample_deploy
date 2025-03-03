# Tutoring Assistant Platform

A full-featured tutoring platform that enables tutors to create tests, assign them to students, and automatically grade and track results.

## Core Features

### For Tutors
- Create multiple-choice and true/false tests with customizable points
- Assign tests to students
- View student performance and test results
- Track student progress over time

### For Students
- Take assigned tests with intuitive UI
- Get immediate feedback and scoring
- View detailed results with correct answers
- Track personal progress across multiple test attempts

## Technical Stack

- **Frontend**: Next.js with App Router, React 18, TypeScript, Tailwind CSS
- **Backend**: AWS Amplify Gen2 with DataStore
- **Authentication**: Cognito via Amplify Auth
- **Database**: DynamoDB via Amplify DataStore

## Data Model

The platform uses the following data models:
- **User**: Stores user data with roles (STUDENT or TUTOR)
- **Test**: Test details including title, description, and questions
- **Question**: Question content, options, and correct answers
- **TestAttempt**: Records of student test attempts
- **Answer**: Student answers for each question

## Getting Started

### Prerequisites
- Node.js (v18+)
- AWS Account
- Amplify CLI

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/tutoring-platform.git
cd tutoring-platform
```

2. Install dependencies
```bash
npm install
```

3. Initialize Amplify
```bash
amplify init
```

4. Push the backend to AWS
```bash
amplify push
```

5. Start the development server
```bash
npm run dev
```

## Deploying to AWS

For detailed instructions on deploying your application, refer to the [deployment section](https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/#deploy-a-fullstack-app-to-aws) of our documentation.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.