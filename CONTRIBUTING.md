# Contributing to Open CORS Proxy

Thank you for your interest in contributing! We welcome all contributions.

## Quick Start

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/Akramovic1/Open-CORS-Proxy.git
   cd Open-CORS-Proxy
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Copy** environment file:
   ```bash
   cp .env.example .env
   ```
5. **Start** development server:
   ```bash
   npm run dev
   ```

## Making Changes

1. **Create a branch** for your changes:

   ```bash
   git checkout -b fix/your-fix-name
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** to `server.js`

3. **Test your changes**:

   ```bash
   npm test
   curl http://localhost:4000/health
   ```

4. **Commit your changes**:

   ```bash
   git add .
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug"
   ```

5. **Push and create a Pull Request**:
   ```bash
   git push origin your-branch-name
   ```

## Code Style

- Use 2 spaces for indentation
- Use semicolons
- Follow existing code patterns
- Add comments for complex logic

## Pull Request Guidelines

- Keep changes focused and small
- Update CHANGELOG.md if needed
- Test your changes before submitting
- Write clear commit messages

## Need Help?

- Create an issue for questions
- Check existing issues first
- Be respectful and patient

## Types of Contributions

- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🧪 Tests
- 🔧 Performance improvements

That's it! Thanks for contributing! 🚀
