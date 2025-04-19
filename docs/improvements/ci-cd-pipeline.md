# Implementing CI/CD Pipeline (GitHub Actions)

This guide outlines how to set up a basic Continuous Integration (CI) and Continuous Deployment (CD) pipeline for the Next.js LMS application using GitHub Actions.

**Assumptions:**
- Your code is hosted on GitHub.
- You want to deploy to a platform like Vercel (common for Next.js) or another hosting provider.
- You have already set up testing (see `testing-framework.md`).

## 1. Define Workflow Triggers

Decide when your workflows should run:
- **CI**: On every push to any branch, or specifically on pushes/pull requests to `main`/`develop` branches.
- **CD**: On every push to the `main` branch (or another designated deployment branch) after CI passes.

## 2. Create CI Workflow File

Create a `.github/workflows/ci.yml` file in your project root.

```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on:
  push:
    branches: [ main, develop ] # Trigger on pushes to main and develop
  pull_request:
    branches: [ main, develop ] # Trigger on pull requests to main and develop

jobs:
  build_and_test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x] # Use the Node.js version specified in README

    steps:
    - name: Checkout repository
      uses: actions/checkout@v3

    - name: Set up Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm' # Enable caching for npm dependencies

    - name: Install dependencies
      run: npm ci # Use ci for faster, deterministic installs

    # Prisma generate is often needed before build/lint/test
    - name: Generate Prisma Client
      run: npx prisma generate
      env:
        # Provide a dummy DATABASE_URL if generate requires it but DB access isn't needed
        # Or use GitHub Secrets if a real connection is necessary (less ideal for basic CI)
        DATABASE_URL: ${{ secrets.DATABASE_URL_CI }} # See Secret Management section

    - name: Lint code
      run: npm run lint

    - name: Run tests
      run: npm test
      env:
        # Add any other env vars needed for tests (use secrets if sensitive)
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: dummy_key # Example dummy key
        CLERK_SECRET_KEY: dummy_secret # Example dummy secret
        # ... other non-sensitive test env vars

    # - name: Build project (Optional but good practice)
    #   run: npm run build
    #   env:
    #     # Add all necessary build-time env vars (use secrets)
    #     DATABASE_URL: ${{ secrets.DATABASE_URL_CI }}
    #     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
    #     CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
    #     UPLOADTHING_SECRET: ${{ secrets.UPLOADTHING_SECRET }}
    #     UPLOADTHING_APP_ID: ${{ secrets.UPLOADTHING_APP_ID }}
    #     MUX_TOKEN_ID: ${{ secrets.MUX_TOKEN_ID }}
    #     MUX_TOKEN_SECRET: ${{ secrets.MUX_TOKEN_SECRET }}
    #     STRIPE_API_KEY: ${{ secrets.STRIPE_API_KEY }}
    #     NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }} # Or a fixed URL for CI
    #     STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
    #     NEXT_PUBLIC_TEACHER_ID: ${{ secrets.NEXT_PUBLIC_TEACHER_ID }}

```

## 3. Secret Management (GitHub Secrets)

Your CI/CD pipeline needs access to environment variables (API keys, database URLs, etc.). **Never commit secrets directly into your code or workflow files.**

- Go to your GitHub repository -> Settings -> Secrets and variables -> Actions.
- Click "New repository secret" for each secret needed in your workflows (e.g., `DATABASE_URL_CI`, `CLERK_SECRET_KEY`, `STRIPE_API_KEY`, etc.).
- For the CI job, you might need a separate, potentially read-only or dummy database connection string (`DATABASE_URL_CI`) if `prisma generate` requires a valid URL but doesn't need write access.
- For CD, you will need your *actual* production secrets.

## 4. Create CD Workflow File (Example: Vercel)

Vercel offers seamless integration with GitHub for deployment.

**Option A: Vercel GitHub Integration (Recommended)**

1.  **Connect Repository**: Go to your Vercel dashboard, create a new project, and import your GitHub repository.
2.  **Configure Project**: Vercel will automatically detect it's a Next.js project.
3.  **Environment Variables**: Configure your production environment variables directly in the Vercel project settings (Settings -> Environment Variables). Vercel will inject these during the build and deployment process.
4.  **Automatic Deployments**: Vercel automatically creates a deployment for every push to the connected branches (usually `main`) *after* its own build and checks pass. You often don't need a separate `cd.yml` file for Vercel if you only deploy pushes to `main`.
5.  **Link CI**: Ensure your CI workflow (`ci.yml`) runs first (e.g., on pushes/PRs to `main`). If CI fails, the push won't merge (if using PRs), preventing Vercel from deploying a broken build.

**Option B: Manual Deployment Workflow (If not using Vercel integration or deploying elsewhere)**

Create a `.github/workflows/cd.yml` file.

```yaml
# .github/workflows/cd.yml
name: Continuous Deployment

on:
  push:
    branches: [ main ] # Trigger only on pushes to main

jobs:
  deploy:
    # Ensure CI passes first (optional, but good practice)
    # needs: build_and_test # Reference the job name from ci.yml (requires ci.yml to run on the same trigger)
    
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v3

    # Add steps specific to your deployment target
    # Example: Deploying to Vercel using Vercel CLI
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18.x # Match your project's Node version

    - name: Install Vercel CLI
      run: npm install --global vercel@latest

    - name: Pull Vercel Environment Information
      run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

    - name: Build Project Artifacts
      run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      env:
        # Vercel usually gets env vars from project settings, but ensure they are available if needed here
        DATABASE_URL: ${{ secrets.DATABASE_URL_PROD }} # Use production secrets
        # ... all other production secrets

    - name: Deploy Project Artifacts to Vercel
      run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

    # Example: Deploying to another platform (e.g., AWS S3/CloudFront, Netlify)
    # - name: Configure AWS Credentials
    #   uses: aws-actions/configure-aws-credentials@v1
    #   with:
    #     aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    #     aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    #     aws-region: us-east-1
    #
    # - name: Build static export (if needed)
    #   run: npm run build # Potentially `next export` if needed
    #   env:
    #     # Production build env vars
    #
    # - name: Deploy to S3
    #   run: aws s3 sync ./out s3://your-bucket-name --delete
```

- **Add Secrets**: Add necessary secrets for deployment (e.g., `VERCEL_TOKEN`, `AWS_ACCESS_KEY_ID`, etc.) to GitHub Secrets.

## 5. Testing the Pipeline

- Push changes to a `develop` branch (or create a PR) to trigger the CI workflow.
- Check the "Actions" tab in your GitHub repository to monitor the workflow run.
- Debug any failures by examining the logs for each step.
- Once CI passes, merge the changes to `main`.
- Verify that the CD workflow triggers (if applicable) and the deployment succeeds on your hosting platform.

## Considerations

- **Environment Strategy**: Have separate environments (development, staging, production) with distinct configurations and secrets.
- **Database Migrations**: Decide how database migrations (`prisma migrate deploy`) will run. This might be a manual step, part of the deployment script (carefully!), or a separate workflow.
- **Rollbacks**: Plan for rollbacks in case a deployment introduces issues.
- **Caching**: Utilize caching (e.g., `actions/setup-node` cache, Docker layer caching if using containers) to speed up builds.
- **Workflow Optimization**: Break down complex workflows into smaller, reusable jobs or composite actions. 