export const codeString = `
name: ci-cd-workflow
on: [workflow_dispatch, push]
jobs:
  ci-pipeline:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Install prerequisites and dependencies
        uses: ./.github/actions/install

      - name: Check formatting
        run: npm run prettier

      - name: Check types
        run: npm run typecheck

      - name: Check linting
        run: npm run lint

      - name: Execute tests
        run: npm run test

      - name: Execute build
        run: npm run build

      - name: Upload dist as artefact
        uses: actions/upload-pages-artifact@v3
        with:
          path: 'dist/'

  cd-pipeline:
    needs: [ci-pipeline]
    runs-on: ubuntu-latest
    permissions:
      pages: write
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy pages
        id: deployment
        uses: actions/deploy-pages@v4
`.trim();
