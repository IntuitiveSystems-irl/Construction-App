# Contributing to Construction App

Thank you for your interest in contributing to the Construction App! This document provides guidelines and instructions for contributing to this project.

## 🤝 How to Contribute

We welcome contributions from the community! Here are the ways you can help:

- **Report Bugs**: Submit detailed bug reports with steps to reproduce
- **Suggest Features**: Propose new features or improvements
- **Submit Pull Requests**: Fix bugs or implement new features
- **Improve Documentation**: Help us improve our docs
- **Share Feedback**: Let us know how we can make this better

## 📋 Getting Started

1. **Fork the Repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone Your Fork**
   ```bash
   git clone git@github.com:YOUR_USERNAME/Construction-App.git
   cd Construction-App
   ```

3. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

4. **Set Up Development Environment**
   ```bash
   cd vbg-app
   npm install
   cp .env.example .env
   # Configure your .env file
   npm run dev
   ```

## 🔧 Development Guidelines

### Code Style

- **JavaScript/TypeScript**: Follow existing code style, use ESLint
- **React Components**: Use functional components with hooks
- **File Naming**: Use kebab-case for files, PascalCase for components
- **Comments**: Write clear, concise comments for complex logic

### Commit Messages

Follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(contracts): add digital signature support"
git commit -m "fix(auth): resolve JWT token expiration issue"
git commit -m "docs(readme): update installation instructions"
```

### Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Test on multiple browsers/devices when applicable

```bash
npm test
```

### Security

- **Never commit secrets**: API keys, passwords, credentials
- **Use environment variables**: Store sensitive data in `.env`
- **Validate input**: Always sanitize user input
- **Review dependencies**: Check for security vulnerabilities

## 📝 Pull Request Process

1. **Update Documentation**
   - Update README.md if needed
   - Add inline code comments
   - Update API documentation

2. **Test Your Changes**
   - Run the full test suite
   - Test manually in development
   - Check for console errors

3. **Create Pull Request**
   - Use a clear, descriptive title
   - Reference related issues
   - Describe what changed and why
   - Include screenshots for UI changes

4. **Code Review**
   - Address reviewer feedback
   - Keep discussion professional and constructive
   - Make requested changes promptly

5. **Merge**
   - Squash commits if requested
   - Delete your branch after merge

## 🐛 Bug Reports

When reporting bugs, please include:

- **Description**: Clear description of the issue
- **Steps to Reproduce**: Detailed steps to recreate the bug
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: OS, browser, Node version, etc.
- **Screenshots**: If applicable
- **Error Messages**: Full error logs

**Template:**
```markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Node: [e.g., 20.10.0]

**Screenshots**
If applicable, add screenshots.

**Additional Context**
Any other relevant information.
```

## 💡 Feature Requests

When suggesting features:

- **Use Case**: Explain why this feature is needed
- **Description**: Detailed description of the feature
- **Mockups**: Include wireframes or mockups if possible
- **Alternatives**: Mention alternative solutions considered

## 🏗 Project Structure

```
vbg-app/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   ├── components/        # React components
│   └── ...
├── contract-system-package/  # Contract management system
├── crm-package/           # CRM integration
├── utils/                 # Utility functions
├── server.js              # Express backend
└── package.json
```

## 🔑 Environment Variables

Required for development:

```bash
# Database
DB_FILENAME=./vbg.db
DB_ENCRYPTION_KEY=your_encryption_key

# Email
RESEND_API_KEY=your_resend_api_key

# SMS (optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_MESSAGING_SERVICE_SID=your_messaging_sid

# Authentication
JWT_SECRET=your_jwt_secret
```

## 📚 Resources

- **Documentation**: See README.md
- **Issue Tracker**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: info@veribuilds.com

## ⚖️ Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect different viewpoints
- Maintain professionalism

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!

---

**Questions?** Open an issue or reach out to the maintainers.
