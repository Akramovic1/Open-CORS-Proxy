# Contributing to Open CORS Proxy

We welcome contributions to the Open CORS Proxy project! This document provides guidelines for contributing.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include screenshots if applicable**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain the behavior you expected**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass (`npm test`)
6. Update documentation if needed
7. Commit your changes (`git commit -m 'Add some amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/Akramovic1/Open-CORS-Proxy.git
cd Open-CORS-Proxy

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Coding Standards

- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Write tests for new features
- Ensure all tests pass before submitting PR
- Update documentation for API changes

## Commit Messages

Use clear and meaningful commit messages:

- `feat: add new feature`
- `fix: resolve issue with...`
- `docs: update documentation`
- `test: add tests for...`
- `refactor: improve code structure`
- `perf: optimize performance`

## Testing

- Write unit tests for new functionality
- Ensure all existing tests continue to pass
- Add integration tests for new endpoints
- Test edge cases and error conditions

## Documentation

- Update README.md for new features
- Add code comments for complex logic
- Update API documentation in `/docs` endpoint
- Include examples in documentation

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create a new release on GitHub
4. Update deployment documentation if needed

Thank you for contributing to Open CORS Proxy!
