# Project Commands and Guidelines

## Commands
- Build: `npm run build`
- Dev server: `npm run dev`
- Start production: `npm run start`
- Linting: `npm run lint`

## Code Style
- **TypeScript**: Use strict typing with proper interfaces/types
- **Imports**: Group by 1) React/Next.js 2) External libraries 3) Internal components/utils
- **Naming**:
  - React components: PascalCase
  - Files: kebab-case.tsx for components
  - Functions/variables: camelCase
- **Components**: Prefer functional components with hooks
- **Error handling**: Use try/catch blocks with appropriate logging
- **Amplify**: Follow AWS Amplify Gen2 patterns for backend resources

## Project Structure
- `/app`: Next.js app directory with pages and components
- `/amplify`: AWS Amplify Gen2 backend resources
- Root contains next.config.js and other config files

## Testing
The project doesn't have configured tests yet. When added, follow patterns from similar Next.js + Amplify projects.